import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.core.addresscodec import classic_address_to_xaddress
from xrpl.models.requests import AccountLines
from xrpl.models.transactions import (
    Payment,
    TrustSet,
    AccountSet
)
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.utils import xrp_to_drops

JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

# Create wallets
creator_wallet = generate_faucet_wallet(client=client, debug=True)
company_wallet = generate_faucet_wallet(client=client, debug=True)

print(f"Creator Address: {creator_wallet.classic_address}")
print(f"Company Address: {company_wallet.classic_address}")

# Configure issuer settings
issuer_settings_tx = AccountSet(
    account=creator_wallet.classic_address,
    set_flag=8
)

issuer_settings_response = submit_and_wait(
    issuer_settings_tx,
    client,
    creator_wallet
)
print("\nIssuer settings response:", issuer_settings_response.result)

# Create trust line
CURRENCY_CODE = "CarbonCredit"

trust_set_tx = TrustSet(
    account=company_wallet.classic_address,
    limit_amount=IssuedCurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="1000000"
    )
)

trust_set_response = submit_and_wait(
    trust_set_tx,
    client,
    company_wallet
)
print("\nTrustSet response:", trust_set_response.result)

# Issue tokens
issue_tx = Payment(
    account=creator_wallet.classic_address,
    destination=creator_wallet.classic_address,
    amount=IssuedCurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="10"
    )
)

issue_response = submit_and_wait(
    issue_tx,
    client,
    creator_wallet
)
print("\nIssuance response:", issue_response.result)

# Transfer tokens
transfer_tx = Payment(
    account=creator_wallet.classic_address,
    destination=company_wallet.classic_address,
    amount=IssuedCurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="3"
    )
)

transfer_response = submit_and_wait(
    transfer_tx,
    client,
    creator_wallet
)
print("\nTransfer response:", transfer_response.result)

def get_token_balance(address: str, issuer: str, currency: str) -> str:
    request = AccountLines(
        account=address,
        peer=issuer
    )
    response = client.request(request)
    for line in response.result['lines']:
        if line['account'] == issuer and line['currency'] == currency:
            return line['balance']
    return "0"

# Check final balances
creator_balance = get_token_balance(
    creator_wallet.classic_address,
    creator_wallet.classic_address,
    CURRENCY_CODE
)

company_balance = get_token_balance(
    company_wallet.classic_address,
    creator_wallet.classic_address,
    CURRENCY_CODE
)

print(f"\nFinal Balances:")
print(f"Creator CarbonCredits: {creator_balance}")
print(f"Company CarbonCredits: {company_balance}")