from web3 import Web3

# Holesky testnet RPC URL
testnet_url = "https://rpc.holesky.ethpandaops.io/"
web3 = Web3(Web3.HTTPProvider(testnet_url))

# Check connection
if web3.is_connected():
    print("Connected to Holesky testnet")
else:
    print("Connection failed")
