import xrpl
from xrpl.clients import JsonRpcClient
from xrpl.wallet import generate_faucet_wallet
from xrpl.models.requests import AccountInfo

JSON_RPC_URL = "https://testnet.xrpl-labs.com/"
client = JsonRpcClient(JSON_RPC_URL)

# Generate a testnet wallet (gives test XRP automatically)
creator_wallet = generate_faucet_wallet(client=client, debug=True)

# Now pass the classic address to AccountInfo, not the wallet object
account_info_request = AccountInfo(
    account=creator_wallet.classic_address,
    ledger_index="validated",
    strict=True
)

creator_account_info = client.request(account_info_request)
# The balance is in "drops": 1 XRP = 1,000,000 drops
print("Creator wallet address:", creator_wallet.classic_address)
print("Creator wallet balance:", creator_account_info.result["account_data"]["Balance"], "drops")
