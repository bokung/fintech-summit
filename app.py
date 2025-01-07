from flask import Flask, request, render_template_string, redirect, url_for, flash, session
import os
import json

import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet, Wallet
from xrpl.core import keypairs
from xrpl.models.requests import AccountLines, BookOffers
from xrpl.models.transactions import (
    Payment,
    TrustSet,
    AccountSet,
    OfferCreate
)
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops
from xrpl.models.requests import AccountInfo
from xrpl.utils import drops_to_xrp

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = "SUPER_SECRET_KEY"  # Replace with a secure key in production

# XRPL testnet client
JSON_RPC_URL = "https://testnet.xrpl-labs.com/"
client = JsonRpcClient(JSON_RPC_URL)

# Currency Code
CURRENCY_CODE = "USD"

# The file for storing your "issuer" wallet (i.e., creator wallet)
CREATOR_WALLET_FILE = "creator_wallet.json"

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------

def save_wallet_to_file(wallet: Wallet, file_path: str) -> None:
    """Save wallet's seed and classic address to a file."""
    wallet_data = {
        "seed": wallet.seed,
        "classic_address": wallet.classic_address,
    }
    with open(file_path, "w") as f:
        json.dump(wallet_data, f)

def load_wallet_from_file(file_path):
    with open(file_path, "r") as f:
        wallet_data = json.load(f)
    # Just load from seed in newer versions of xrpl-py
    return Wallet.from_seed(wallet_data["seed"])


def get_or_generate_creator_wallet() -> Wallet:
    """
    Load or generate the "creator/issuer" wallet (your main wallet). 
    This wallet issues the CarbonCredits (USD).
    """
    if os.path.exists(CREATOR_WALLET_FILE):
        creator_wallet = load_wallet_from_file(CREATOR_WALLET_FILE)
    else:
        creator_wallet = generate_faucet_wallet(client=client)
        save_wallet_to_file(creator_wallet, CREATOR_WALLET_FILE)
    return creator_wallet

def create_user_wallet() -> dict:
    """
    Generates a new user wallet funded by the testnet faucet.
    We store it in Flask session (for demo).
    """
    new_wallet = generate_faucet_wallet(client=client)
    # Store in session so that you can reuse it across requests
    session["user_wallet"] = {
        "seed": new_wallet.seed,
        "classic_address": new_wallet.classic_address
    }
    return session["user_wallet"]

def load_user_wallet() -> Wallet:
    """
    Load the user's wallet from session (if it exists).
    """
    if "user_wallet" not in session:
        return None
    wdata = session["user_wallet"]
    return Wallet.from_seed(wdata["seed"])



def get_token_balance(address: str, issuer: str, currency: str) -> str:
    """
    Retrieve the balance of a given (issuer, currency) for a specific address.
    """
    request = AccountLines(
        account=address,
        peer=issuer
    )
    response = client.request(request)
    lines = response.result.get("lines", [])
    for line in lines:
        if line['account'] == issuer and line['currency'] == currency:
            return line['balance']
    return "0"

def create_sell_offer(wallet: Wallet, currency_amount: float, xrp_price: float):
    """
    Create an offer to sell 'currency_amount' of the issuer's token for 'xrp_price' XRP
    """
    offer_tx = OfferCreate(
        account=wallet.classic_address,
        taker_gets=xrp_to_drops(xrp_price),  # How much XRP you want
        taker_pays=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=get_or_generate_creator_wallet().classic_address,
            value=str(currency_amount)
        )
    )
    return submit_and_wait(offer_tx, client, wallet)

def create_buy_offer(wallet: Wallet, currency_amount: float, xrp_price: float):
    """
    Create an offer to buy 'currency_amount' of the issuer's token for 'xrp_price' XRP
    """
    offer_tx = OfferCreate(
        account=wallet.classic_address,
        taker_gets=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=get_or_generate_creator_wallet().classic_address,
            value=str(currency_amount)
        ),
        taker_pays=xrp_to_drops(xrp_price)
    )
    return submit_and_wait(offer_tx, client, wallet)

def get_order_book():
    """
    Get the current order book for CarbonCredits (USD) vs XRP
    The book is: TakerGets: CarbonCredits (USD), TakerPays: XRP
    """
    request = BookOffers(
        taker_gets=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=get_or_generate_creator_wallet().classic_address,
            value="0"
        ),
        taker_pays="XRP"
    )
    response = client.request(request)
    return response.result

# -----------------------------------------------------------------------------
# One-time setup for the issuer (creator_wallet)
# -----------------------------------------------------------------------------

def configure_issuer():
    """
    Configure the issuer wallet to enable rippling (if not already done).
    Also create a trust line from the user to the issuer so we can hold tokens.
    For demonstration, we'll set a big trust line limit (like 1,000,000).
    """
    creator_wallet = get_or_generate_creator_wallet()

    # 1) AccountSet to enable rippling (set_flag=8)
    issuer_settings_tx = AccountSet(
        account=creator_wallet.classic_address,
        set_flag=8  # Enable rippling
    )
    try:
        submit_and_wait(issuer_settings_tx, client, creator_wallet)
    except xrpl.transaction.exceptions.XRPLReliableSubmissionException:
        # If it's already set, we can ignore the error
        pass

# -----------------------------------------------------------------------------
# Flask routes
# -----------------------------------------------------------------------------

@app.route("/")
def index():
    """
    Landing page with links to create a wallet, see wallet info, buy/sell, etc.
    """
    html = """
    <h1>Carbon Credits on the XRPL</h1>
    <p>Welcome to the Carbon Credits demo!</p>
    <ul>
      <li><a href="{{ url_for('create_wallet') }}">Create a new user wallet</a></li>
      <li><a href="{{ url_for('wallet_info') }}">View my wallet info</a></li>
      <li><a href="{{ url_for('create_offer') }}">Buy or Sell Carbon Credits</a></li>
      <li><a href="{{ url_for('order_book') }}">View current order book</a></li>
    </ul>
    """
    return render_template_string(html)

@app.route("/create_wallet", methods=["GET"])
def create_wallet():
    """
    Create a new wallet for the user and store it in session.
    """
    user_w = create_user_wallet()
    flash(f"New wallet created. Address: {user_w['classic_address']}", "info")
    return redirect(url_for("wallet_info"))

@app.route("/wallet_info", methods=["GET"])
def wallet_info():
    """
    Show the user's wallet info: address, XRPL faucet balance, and token balance.
    If no wallet is found in session, ask the user to create one.
    """
    user_wallet = load_user_wallet()
    if not user_wallet:
        return "<p>No user wallet found. Please <a href='/create_wallet'>create a wallet</a>.</p>"

    # Ensure issuer is configured (one-time)
    configure_issuer()

    creator_wallet = get_or_generate_creator_wallet()
    xrp_balance = "0"
    token_balance = "0"

    req = AccountInfo(
        account=user_wallet.classic_address,
        ledger_index="validated",
        strict=True
    )
    response = client.request(req)
    xrp_balance = drops_to_xrp(response.result["account_data"]["Balance"])

    # Ensure a trust line from user to the issuer
    try:
        trust_set_tx = TrustSet(
            account=user_wallet.classic_address,
            limit_amount=IssuedCurrencyAmount(
                currency=CURRENCY_CODE,
                issuer=creator_wallet.classic_address,
                value="1000000"  # large limit
            )
        )
        submit_and_wait(trust_set_tx, client, user_wallet)
    except xrpl.transaction.exceptions.XRPLReliableSubmissionException:
        pass  # If trust line is already set

    # Now fetch the token balance
    token_balance = get_token_balance(user_wallet.classic_address, creator_wallet.classic_address, CURRENCY_CODE)

    html = f"""
    <h2>Wallet Info</h2>
    <p><strong>Address:</strong> {user_wallet.classic_address}</p>
    <p><strong>XRP Balance:</strong> {xrp_balance}</p>
    <p><strong>{CURRENCY_CODE} Balance:</strong> {token_balance}</p>
    <p><a href="/">Return Home</a></p>
    """
    return render_template_string(html)

@app.route("/create_offer", methods=["GET", "POST"])
def create_offer():
    """
    Allow user to create a Buy or Sell offer.
    """
    user_wallet = load_user_wallet()
    if not user_wallet:
        return "<p>No user wallet found. Please <a href='/create_wallet'>create a wallet</a>.</p>"

    if request.method == "POST":
        offer_type = request.form.get("offer_type")
        amount = float(request.form.get("amount"))
        xrp_price = float(request.form.get("xrp_price"))

        if offer_type == "sell":
            tx_response = create_sell_offer(user_wallet, amount, xrp_price)
            flash(f"Sell offer created. {tx_response.result}", "info")
        elif offer_type == "buy":
            tx_response = create_buy_offer(user_wallet, amount, xrp_price)
            flash(f"Buy offer created. {tx_response.result}", "info")
        else:
            flash("Unknown offer type.", "error")

        return redirect(url_for("wallet_info"))

    html_form = """
    <h2>Create an Offer</h2>
    <form method="POST">
      <label>Offer Type:</label><br/>
      <select name="offer_type">
        <option value="sell">Sell CarbonCredits</option>
        <option value="buy">Buy CarbonCredits</option>
      </select><br/><br/>
      
      <label>CarbonCredits (USD) amount:</label><br/>
      <input type="text" name="amount"/><br/><br/>
      
      <label>XRP amount (price):</label><br/>
      <input type="text" name="xrp_price"/><br/><br/>
      
      <input type="submit" value="Submit"/>
    </form>
    <p><a href="/">Return Home</a></p>
    """
    return render_template_string(html_form)

@app.route("/order_book")
def order_book():
    """
    Show the current order book for USD:XRP.
    """
    ob = get_order_book()
    offers = ob.get("offers", [])
    rows = []
    for o in offers:
        # Each offer in the book has fields like 'TakerPays', 'TakerGets', etc.
        # Depending on whether TakerGets is XRP or the token, you interpret differently.
        rows.append(str(o))

    html = "<h2>Order Book for CarbonCredits (USD) / XRP</h2>"
    html += "<ul>"
    for row in rows:
        html += f"<li>{row}</li>"
    html += "</ul>"
    html += '<p><a href="/">Return Home</a></p>'
    return render_template_string(html)

# -----------------------------------------------------------------------------
# Run the Flask app
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
