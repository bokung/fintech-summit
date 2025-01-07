from flask import Flask, request, render_template_string, redirect, url_for, flash, session
import os
import json

import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet, Wallet
from xrpl.core import keypairs
from xrpl.models.requests import AccountLines, BookOffers, AccountInfo
from xrpl.models.transactions import (
    Payment,
    TrustSet,
    AccountSet,
    OfferCreate
)
from xrpl.models.amounts import IssuedCurrencyAmount
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops, drops_to_xrp
from xrpl.transaction import XRPLReliableSubmissionException

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

app = Flask(__name__)
app.secret_key = "SUPER_SECRET_KEY"  # Replace with a secure key in production

# XRPL testnet client
JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

# Currency Code
CURRENCY_CODE = "USD"

# File for storing your "issuer" wallet (creator wallet)
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
    return Wallet.from_seed(wallet_data["seed"])

def get_or_generate_creator_wallet() -> Wallet:
    """
    Load or generate the "creator/issuer" wallet (your main wallet).
    This wallet issues the USD tokens.
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
        if line["account"] == issuer and line["currency"] == currency:
            return line["balance"]
    return "0"

def fund_user_with_tokens(issuer_wallet: Wallet, user_wallet: Wallet, amount: str = "1000"):
    """
    Send 'amount' of the issuer's USD tokens to the user,
    so that the user can sell them.
    """
    payment_tx = Payment(
        account=issuer_wallet.classic_address,
        destination=user_wallet.classic_address,
        amount=IssuedCurrencyAmount(
            currency=CURRENCY_CODE,
            issuer=issuer_wallet.classic_address,
            value=amount
        )
    )
    tx_response = submit_and_wait(payment_tx, client, issuer_wallet)
    
    # Check if it was successful:
    tx_result = tx_response.result["meta"]["TransactionResult"]
    if tx_result != "tesSUCCESS":
        raise Exception(f"Issuance failed with code: {tx_result}")

def create_sell_offer(wallet: Wallet, currency_amount: float, xrp_price: float):
    """
    Create an offer to sell 'currency_amount' of the issuer's token
    for 'xrp_price' XRP.
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
    tx_response = submit_and_wait(offer_tx, client, wallet)
    # Check result code
    tx_result = tx_response.result["meta"]["TransactionResult"]
    return tx_response, tx_result

def create_buy_offer(wallet: Wallet, currency_amount: float, xrp_price: float):
    """
    Create an offer to buy 'currency_amount' of the issuer's token
    by paying 'xrp_price' XRP.
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
    tx_response = submit_and_wait(offer_tx, client, wallet)
    # Check result code
    tx_result = tx_response.result["meta"]["TransactionResult"]
    return tx_response, tx_result

def get_order_book():
    """
    Get the current order book for USD (CarbonCredits) vs XRP
    The book is: TakerGets: USD, TakerPays: XRP
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
    Also create a trust line from the user to the issuer (if not done).
    """
    creator_wallet = get_or_generate_creator_wallet()

    # 1) AccountSet to enable rippling (set_flag=8)
    issuer_settings_tx = AccountSet(
        account=creator_wallet.classic_address,
        set_flag=8  # Enable rippling
    )
    try:
        submit_and_wait(issuer_settings_tx, client, creator_wallet)
    except XRPLReliableSubmissionException:
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
      <li><a href="{{ url_for('fund_tokens') }}">Fund user wallet with USD tokens</a></li>
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

@app.route("/fund_tokens", methods=["GET"])
def fund_tokens():
    """
    Explicit route to fund the user wallet with some USD tokens.
    """
    user_wallet = load_user_wallet()
    if not user_wallet:
        flash("No user wallet found. Please create one first.", "error")
        return redirect(url_for("index"))

    # Make sure issuer is set up
    configure_issuer()
    creator_wallet = get_or_generate_creator_wallet()

    try:
        # The user must have a trust line first:
        trust_set_tx = TrustSet(
            account=user_wallet.classic_address,
            limit_amount=IssuedCurrencyAmount(
                currency=CURRENCY_CODE,
                issuer=creator_wallet.classic_address,
                value="1000000"  # big trust limit
            )
        )
        ts_response = submit_and_wait(trust_set_tx, client, user_wallet)
        ts_result = ts_response.result["meta"]["TransactionResult"]
        if ts_result != "tesSUCCESS":
            flash(f"TrustSet failed with code: {ts_result}", "error")
            return redirect(url_for("index"))

        # Now fund the user with 1000 USD tokens
        fund_user_with_tokens(creator_wallet, user_wallet, "1000")
        flash("Successfully funded user with 1000 USD tokens.", "info")
    except Exception as e:
        flash(f"Error funding tokens: {str(e)}", "error")

    return redirect(url_for("wallet_info"))

@app.route("/wallet_info", methods=["GET"])
def wallet_info():
    """
    Show the user's wallet info: address, XRP faucet balance, token balance.
    If no wallet is found in session, ask the user to create one.
    """
    user_wallet = load_user_wallet()
    if not user_wallet:
        return "<p>No user wallet found. Please <a href='/create_wallet'>create a wallet</a>.</p>"

    # Ensure issuer is configured (one-time)
    configure_issuer()

    creator_wallet = get_or_generate_creator_wallet()
    
    # Get XRP balance
    req = AccountInfo(
        account=user_wallet.classic_address,
        ledger_index="validated",
        strict=True
    )
    response = client.request(req)
    xrp_balance = drops_to_xrp(response.result["account_data"]["Balance"])

    # Get token balance
    token_balance = get_token_balance(
        user_wallet.classic_address,
        creator_wallet.classic_address,
        CURRENCY_CODE
    )

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
    Allow user to create a Buy or Sell offer for USD tokens.
    """
    user_wallet = load_user_wallet()
    if not user_wallet:
        return "<p>No user wallet found. Please <a href='/create_wallet'>create a wallet</a>.</p>"

    if request.method == "POST":
        offer_type = request.form.get("offer_type")
        amount = float(request.form.get("amount"))
        xrp_price = float(request.form.get("xrp_price"))

        try:
            if offer_type == "sell":
                tx_response, tx_result = create_sell_offer(user_wallet, amount, xrp_price)
            elif offer_type == "buy":
                tx_response, tx_result = create_buy_offer(user_wallet, amount, xrp_price)
            else:
                flash("Unknown offer type.", "error")
                return redirect(url_for("create_offer"))

            if tx_result == "tesSUCCESS":
                flash(f"{offer_type.capitalize()} offer succeeded. Transaction: {tx_response.result}", "info")
            else:
                flash(f"{offer_type.capitalize()} offer failed with code: {tx_result}", "error")

        except Exception as e:
            flash(f"Error creating the offer: {str(e)}", "error")

        return redirect(url_for("wallet_info"))

    html_form = """
    <h2>Create an Offer</h2>
    <form method="POST">
      <label>Offer Type:</label><br/>
      <select name="offer_type">
        <option value="sell">Sell CarbonCredits (USD)</option>
        <option value="buy">Buy CarbonCredits (USD)</option>
      </select><br/><br/>
      
      <label>CarbonCredits (USD) amount:</label><br/>
      <input type="text" name="amount" required/><br/><br/>
      
      <label>XRP amount (price):</label><br/>
      <input type="text" name="xrp_price" required/><br/><br/>
      
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
        rows.append(str(o))

    html = "<h2>Order Book (USD / XRP)</h2>"
    if not offers:
        html += "<p>No offers found on this side of the book.</p>"
    else:
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
