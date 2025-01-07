import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.models.requests import AccountLines, BookOffers
from xrpl.models.transactions import (
    Payment,
    TrustSet,
    AccountSet,
    OfferCreate,
    OfferCancel
)
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops


JSON_RPC_URL = "https://testnet.xrpl-labs.com/"
client = JsonRpcClient(JSON_RPC_URL)

# Create wallets
import json
import os
from xrpl.wallet import Wallet
from xrpl.core import keypairs
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet

# File paths to save wallet data
CREATOR_WALLET_FILE = "creator_wallet.json"
COMPANY_WALLET_FILE = "company_wallet.json"

def save_wallet_to_file(wallet, file_path):
    """Save wallet's seed and classic address to a file."""
    wallet_data = {
        "seed": wallet.seed,
        "classic_address": wallet.classic_address,
    }
    with open(file_path, "w") as f:
        json.dump(wallet_data, f)
    print(f"Wallet saved to {file_path}")

def load_wallet_from_file(file_path):
    """Load wallet information from a file and reconstruct the Wallet object."""
    with open(file_path, "r") as f:
        wallet_data = json.load(f)
    # Derive keys from the seed
    public_key, private_key = keypairs.derive_keypair(wallet_data["seed"])
    # Reconstruct the wallet using the derived keys
    return Wallet(
        seed=wallet_data["seed"],
        public_key=public_key,
        private_key=private_key
    )

def get_or_generate_wallet(file_path, client):
    """Load wallet from file or generate a new one if not available."""
    if os.path.exists(file_path):
        print(f"Loading wallet from {file_path}...")
        return load_wallet_from_file(file_path)
    else:
        print(f"Generating new wallet and saving to {file_path}...")
        wallet = generate_faucet_wallet(client=client, debug=True)
        save_wallet_to_file(wallet, file_path)
        return wallet

# Initialize client
JSON_RPC_URL = "https://testnet.xrpl-labs.com/"
client = JsonRpcClient(JSON_RPC_URL)

# Load or generate wallets
creator_wallet = get_or_generate_wallet(CREATOR_WALLET_FILE, client)
company_wallet = get_or_generate_wallet(COMPANY_WALLET_FILE, client)

print(f"Creator Address: {creator_wallet.classic_address}")
print(f"Company Address: {company_wallet.classic_address}")



# Configure issuer settings
issuer_settings_tx = AccountSet(
    account=creator_wallet.classic_address,
    set_flag=8  # Enable rippling
)

issuer_settings_response = submit_and_wait(
    issuer_settings_tx,
    client,
    creator_wallet
)
print("\nIssuer settings response:", issuer_settings_response.result)

# Create trust line
CURRENCY_CODE = "USD"

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

# Issue initial supply of CarbonCredits
issue_tx = Payment(
    account=creator_wallet.classic_address,
    destination=company_wallet.classic_address,  # Send IOUs to Company
    amount=IssuedCurrencyAmount(
        currency=CURRENCY_CODE,
        issuer=creator_wallet.classic_address,
        value="1000"
    )
)




issue_response = submit_and_wait(
    issue_tx,
    client,
    creator_wallet
)
print("\nIssuance response:", issue_response.result)

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

def create_sell_offer(wallet, currency_amount, xrp_price):
    """Create an offer to sell CarbonCredits for XRP"""
    offer_tx = OfferCreate(
        account=wallet.classic_address,
        taker_gets=xrp_to_drops(xrp_price),  # Amount of XRP to receive
        taker_pays=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=creator_wallet.classic_address,
            value=str(currency_amount)
        )
    )
    response = submit_and_wait(offer_tx, client, wallet)
    return response

def create_buy_offer(wallet, currency_amount, xrp_price):
    """Create an offer to buy CarbonCredits with XRP"""
    offer_tx = OfferCreate(
        account=wallet.classic_address,
        taker_gets=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=creator_wallet.classic_address,
            value=str(currency_amount)
        ),
        taker_pays=xrp_to_drops(xrp_price)  # Amount of XRP to pay
    )
    response = submit_and_wait(offer_tx, client, wallet)
    return response

def get_order_book():
    """Get the current order book for CarbonCredits/XRP"""
    request = BookOffers(
        taker_gets=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=creator_wallet.classic_address,
            value="0"
        ),
        taker_pays="XRP"
    )
    response = client.request(request)
    return response.result

# Example: Creator creates a sell offer
print("\nCreating sell offer...")
sell_response = create_sell_offer(
    creator_wallet,
    currency_amount=100,  # Selling 100 CarbonCredits
    xrp_price=10       # For 1000 XRP
)
print("Sell offer response:", sell_response.result)

# Example: Company creates a buy offer
print("\nCreating buy offer...")
buy_response = create_buy_offer(
    company_wallet,
    currency_amount=50,   # Buying 50 CarbonCredits
    xrp_price=5        # Offering 450 XRP
)
print("Buy offer response:", buy_response.result)

# Get and display order book
print("\nCurrent Order Book:")
order_book = get_order_book()
print(order_book)

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