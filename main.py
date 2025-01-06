import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.account import get_balance
from xrpl.transaction import safe_sign_and_autofill_transaction, send_reliable_submission
from xrpl.ledger import get_latest_validated_ledger_sequence
from xrpl.models.transactions import Payment, TrustSet, AccountSet, CurrencyAmount

# --------------------------------------------------------------------
# XRPL Client Configuration
# --------------------------------------------------------------------
JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

# --------------------------------------------------------------------
# Step 1: Create/Fetch Wallets
# For demonstration, we generate new test wallets using the XRPL faucet.
# In production, you'd have your own wallets.
# --------------------------------------------------------------------
creator_wallet = generate_faucet_wallet(client=client, debug=True)
company_wallet = generate_faucet_wallet(client=client, debug=True)

print("Creator (Issuer) Wallet Address:", creator_wallet.classic_address)
print("Company Wallet Address:", company_wallet.classic_address)

# --------------------------------------------------------------------
# Step 2: Configure Issuer (Creator) Settings
# We'll require the issuer to enable rippling or set specific flags
# if you want advanced token settings. This step is optional but
# shows how you can configure your account with AccountSet.
# --------------------------------------------------------------------
issuer_settings_tx = AccountSet(
    account=creator_wallet.classic_address,
    set_flag=8  # As an example: asfDefaultRipple for demonstration
)

signed_issuer_settings = safe_sign_and_autofill_transaction(
    issuer_settings_tx,
    creator_wallet,
    client
)
issuer_settings_response = send_reliable_submission(signed_issuer_settings, client)
print("Issuer settings transaction response:", issuer_settings_response)

# --------------------------------------------------------------------
# Step 3: Create and Configure the Trust Line
# The Company must establish a trust line to the Creator's "CarbonCredit" token
# so it can hold this token.
# --------------------------------------------------------------------
CURRENCY_CODE = "CarbonCredit"  # 3 to 40 characters, typically uppercase
trust_set_tx = TrustSet(
    account=company_wallet.classic_address,
    limit_amount=CurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="1000000"  # The max number of tokens Company can hold
    )
)

signed_trust_set_tx = safe_sign_and_autofill_transaction(
    trust_set_tx,
    company_wallet,
    client
)
trust_set_response = send_reliable_submission(signed_trust_set_tx, client)
print("TrustSet transaction response:", trust_set_response)

# --------------------------------------------------------------------
# Step 4: Issue 10 CarbonCredits to the Creator's Own Account
# We can do this by making a Payment transaction from the Creator to itself.
# This "locks in" the token supply.
# --------------------------------------------------------------------
issue_carbon_credits_tx = Payment(
    account=creator_wallet.classic_address,
    destination=creator_wallet.classic_address,
    amount=CurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="10"  # The total supply the Creator initially holds
    )
)

signed_issue_cc_tx = safe_sign_and_autofill_transaction(
    issue_carbon_credits_tx,
    creator_wallet,
    client
)
issue_cc_response = send_reliable_submission(signed_issue_cc_tx, client)
print("Issuance transaction response:", issue_cc_response)

# --------------------------------------------------------------------
# Step 5: Let the Company Buy CarbonCredits Using XRP
# We'll do this by sending a Payment in the 'CarbonCredit' currency
# from the Creator to the Company, but only after the Company sends us XRP.
# In a real-world scenario, you'd have an escrow or a DEX order book.
# For simplicity, we'll show a direct token Payment from the Creator
# to the Company as if they've paid in XRP off-chain or via the built-in DEX.
# --------------------------------------------------------------------

# (A) Check initial balances for demonstration
creator_xrp_balance_before = get_balance(client, creator_wallet.classic_address, None)
company_xrp_balance_before = get_balance(client, company_wallet.classic_address, None)
print(f"Creator XRP Balance (Before): {creator_xrp_balance_before}")
print(f"Company XRP Balance (Before): {company_xrp_balance_before}")

# (B) Payment in CarbonCredit from Creator to Company
# This simulates the Company 'buying' the credits from the Creator.
carbon_payment_tx = Payment(
    account=creator_wallet.classic_address,
    destination=company_wallet.classic_address,
    amount=CurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="3"  # Number of CarbonCredits being purchased
    )
)

signed_carbon_payment_tx = safe_sign_and_autofill_transaction(
    carbon_payment_tx,
    creator_wallet,
    client
)
carbon_payment_response = send_reliable_submission(signed_carbon_payment_tx, client)
print("CarbonCredit Payment transaction response:", carbon_payment_response)

# --------------------------------------------------------------------
# Step 6: Check Final Balances
# We'll fetch final token balances using the "account_lines" method.
# We'll also look at the final XRP balance to ensure everything is consistent.
# --------------------------------------------------------------------

def get_token_balance(address: str, issuer: str, currency: str) -> str:
    """Returns the balance of a token for the given address."""
    account_lines = xrpl.account.get_account_lines(
        address=address,
        client=client
    )
    for line in account_lines.lines:
        if line["account"] == issuer and line["currency"] == currency:
            return line["balance"]
    return "0"

creator_carbon_balance = get_token_balance(
    creator_wallet.classic_address,
    creator_wallet.classic_address,
    CURRENCY_CODE
)
company_carbon_balance = get_token_balance(
    company_wallet.classic_address,
    creator_wallet.classic_address,
    CURRENCY_CODE
)

creator_xrp_balance_after = get_balance(client, creator_wallet.classic_address, None)
company_xrp_balance_after = get_balance(client, company_wallet.classic_address, None)

print("---------------------------------------")
print(f"Creator CarbonCredit Balance: {creator_carbon_balance}")
print(f"Company CarbonCredit Balance: {company_carbon_balance}")
print("---------------------------------------")
print(f"Creator XRP Balance (After): {creator_xrp_balance_after}")
print(f"Company XRP Balance (After): {company_xrp_balance_after}")
print("---------------------------------------")

print("Application run complete. You have successfully demonstrated a token issuance and transfer using XRPL.")
