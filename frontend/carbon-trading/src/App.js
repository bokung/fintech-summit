// File: src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits,
  formatEther
} from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";

// --- Import the ABI JSON for each contract
import carbonCreditABI from "./contracts/CarbonCredit.json";
import marketplaceABI from "./contracts/CarbonCreditMarketplace.json";

// You should update these to match what was printed by your Hardhat (or similar) deploy script!
const CARBON_CREDIT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MARKETPLACE_ADDRESS   = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

function App() {
  // ---------------------------------------------
  // State hooks
  // ---------------------------------------------
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  const [carbonCreditContract, setCarbonCreditContract] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);

  // For the forms
  const [batchMintNumber, setBatchMintNumber] = useState("1");
  const [batchMintUri, setBatchMintUri]       = useState("https://example.com/metadata/");
  
  const [redeemTokenId, setRedeemTokenId]     = useState("");
  const [redeemEmissionId, setRedeemEmissionId] = useState("");

  const [listTokenId, setListTokenId]         = useState("");
  const [listPrice, setListPrice]             = useState("");

  const [buyTokenId, setBuyTokenId]           = useState("");
  const [buyOfferPrice, setBuyOfferPrice]     = useState("");

  // For displaying listings
  const [listings, setListings] = useState([]);

  // ---------------------------------------------
  // New State hooks for the extended UI
  // ---------------------------------------------
  const [currentUserAddress, setCurrentUserAddress] = useState("");
  const [currentUserBalance, setCurrentUserBalance] = useState("");
  const [contractOwnerAddress, setContractOwnerAddress] = useState("");
  const [queriedTokenId, setQueriedTokenId] = useState("");
  const [queriedTokenOwner, setQueriedTokenOwner] = useState("");
  const [marketplaceCreditCount, setMarketplaceCreditCount] = useState("");

  // ---------------------------------------------
  // Connect wallet + instantiate contracts
  // ---------------------------------------------
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        console.error("MetaMask (or another Ethereum provider) not detected!");
        return;
      }

      try {
        // Request user to connect their wallet
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // In ethers v6, we use BrowserProvider instead of ethers.providers.Web3Provider
        const _provider = new BrowserProvider(window.ethereum);
        // The signer is derived via getSigner()
        const _signer = await _provider.getSigner();

        // Instantiate the contracts
        const ccContract = new Contract(
          CARBON_CREDIT_ADDRESS,
          carbonCreditABI.abi,
          _signer
        );

        const mpContract = new Contract(
          MARKETPLACE_ADDRESS,
          marketplaceABI.abi,
          _signer
        );

        setSigner(_signer);
        setProvider(_provider);
        setCarbonCreditContract(ccContract);
        setMarketplaceContract(mpContract);
      } catch (err) {
        console.error("Error initializing contracts or wallet:", err);
      }
    };

    init();
  }, []);

  // ---------------------------------------------
  // Handlers for the original functionality
  // ---------------------------------------------
  const handleMintBatch = async () => {
    if (!carbonCreditContract || !signer) return;

    try {
      // Convert batchMintNumber to a BigInt (or keep as string if using ethers v6)
      const numberOfCredits = batchMintNumber;
      // We assume signer is the `to` address
      const toAddress = await signer.getAddress();

      const tx = await carbonCreditContract.mintCarbonCreditsBatch(
        toAddress,
        numberOfCredits,
        batchMintUri
      );
      await tx.wait();
      alert(`Successfully minted ${batchMintNumber} credits!`);
    } catch (err) {
      console.error(err);
      alert("Failed to mint batch!");
    }
  };

  const handleRedeem = async () => {
    if (!carbonCreditContract) return;

    try {
      const tokenIdBN = redeemTokenId;

      const tx = await carbonCreditContract.redeemCarbonCredit(
        tokenIdBN,
        redeemEmissionId
      );
      await tx.wait();
      alert(`Redeemed token #${redeemTokenId} for emission: ${redeemEmissionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to redeem credit!");
    }
  };

  const handleListForSale = async () => {
    if (!marketplaceContract) return;

    try {
      const tokenIdBN = listTokenId;
      const priceBN = parseUnits(listPrice, 18);

      const tx = await marketplaceContract.listCreditForSale(tokenIdBN, priceBN);
      await tx.wait();
      alert(`Listed token #${listTokenId} for sale at ${listPrice} XRPL tokens.`);
    } catch (err) {
      console.error(err);
      alert("Failed to list token for sale!");
    }
  };

  const handleBuyCredit = async () => {
    if (!marketplaceContract) return;

    try {
      const tokenIdBN = buyTokenId;
      const offerBN = parseUnits(buyOfferPrice, 18);

      const tx = await marketplaceContract.buyCredit(tokenIdBN, offerBN);
      await tx.wait();
      alert(`Bought token #${buyTokenId} for ${buyOfferPrice} XRPL tokens.`);
    } catch (err) {
      console.error(err);
      alert("Failed to buy credit!");
    }
  };

  const fetchAllListings = async () => {
    if (!marketplaceContract) return;

    try {
      // This is a view function
      const items = await marketplaceContract.getAllListingsSortedByPrice();
      setListings(items);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch listings!");
    }
  };

  // ---------------------------------------------
  // Handlers for the extended functionality
  // ---------------------------------------------
  // 1. Get the address of the current user (button)
  const handleCheckUserAddress = async () => {
    if (!signer) return;
    try {
      const addr = await signer.getAddress();
      setCurrentUserAddress(addr);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve user address!");
    }
  };

  // 2. Get the current balance of the signed-in user in ETH
  const handleCheckUserBalance = async () => {
    if (!provider || !signer) return;
    try {
      const userAddr = await signer.getAddress();
      const bal = await provider.getBalance(userAddr);
      // Convert from wei to ETH
      setCurrentUserBalance(formatEther(bal));
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve user balance!");
    }
  };

  // 3 & 4. Show the address of the owner of the carbon credit contract
  //    We'll fetch it on-demand with a button, or you can also do so on init.
  const handleFetchContractOwner = async () => {
    if (!carbonCreditContract) return;
    try {
      const ownerAddr = await carbonCreditContract.owner();
      setContractOwnerAddress(ownerAddr);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve contract owner address!");
    }
  };

  // 5. A box that prompts for a token ID and returns the owner of that coin
  const handleCheckTokenOwner = async () => {
    if (!carbonCreditContract || !queriedTokenId) return;
    try {
      const ownerOfToken = await carbonCreditContract.ownerOf(queriedTokenId);
      setQueriedTokenOwner(ownerOfToken);
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve token owner!");
    }
  };

  // 6. The total number of carbon credits currently in the marketplace
  //    (the # of tokens the marketplace contract itself owns)
  const handleMarketplaceBalance = async () => {
    if (!marketplaceContract) return;
    try {
      const balanceBN = await marketplaceContract.marketplaceBalance();
      setMarketplaceCreditCount(balanceBN.toString());
    } catch (err) {
      console.error(err);
      alert("Failed to retrieve marketplace balance!");
    }
  };

  // ---------------------------------------------
  // Render UI
  // ---------------------------------------------
  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Carbon Credit Trading</h1>

      {/* --- New Extended UI Section --- */}
      <div className="card mb-4">
        <div className="card-header">Extended UI Features</div>
        <div className="card-body">
          {/* 1. Button to fetch user address */}
          <button className="btn btn-info mb-2" onClick={handleCheckUserAddress}>
            Check Current User Address
          </button>
          <div className="mb-3">
            <label>Current User Address:</label>
            <div className="form-control" readOnly>{currentUserAddress || "Not fetched yet"}</div>
          </div>

          {/* 2. UI element to display the current user balance in ETH */}
          <button className="btn btn-info mb-2" onClick={handleCheckUserBalance}>
            Check My ETH Balance
          </button>
          <div className="mb-3">
            <label>My Balance (ETH):</label>
            <div className="form-control" readOnly>{currentUserBalance || "Not fetched yet"}</div>
          </div>

          {/* 3 & 4. Address of the owner of the carbon credit contract */}
          <button className="btn btn-info mb-2" onClick={handleFetchContractOwner}>
            Fetch Carbon Credit Contract Owner
          </button>
          <div className="mb-3">
            <label>CarbonCredit Contract Owner:</label>
            <div className="form-control" readOnly>
              {contractOwnerAddress || "Not fetched yet"}
            </div>
          </div>

          {/* 5. Box to prompt for a token ID and returns the owner */}
          <div className="mb-3">
            <label>Token ID to check ownership</label>
            <input
              type="number"
              className="form-control"
              value={queriedTokenId}
              onChange={(e) => setQueriedTokenId(e.target.value)}
            />
          </div>
          <button className="btn btn-info mb-2" onClick={handleCheckTokenOwner}>
            Check Owner of Token
          </button>
          <div className="mb-3">
            <label>Owner of Token #{queriedTokenId}:</label>
            <div className="form-control" readOnly>
              {queriedTokenOwner || "Not fetched yet"}
            </div>
          </div>

          {/* 6. Total number of carbon credits in the marketplace */}
          <button className="btn btn-info mb-2" onClick={handleMarketplaceBalance}>
            Get Marketplace Balance
          </button>
          <div className="mb-3">
            <label>Number of Carbon Credits in Marketplace Contract:</label>
            <div className="form-control" readOnly>
              {marketplaceCreditCount || "Not fetched yet"}
            </div>
          </div>
        </div>
      </div>
      {/* --- End Extended UI Section --- */}

      {/* Mint Batch Section */}
      <div className="card mb-4">
        <div className="card-header">Mint Carbon Credits (Batch)</div>
        <div className="card-body">
          <div className="mb-3">
            <label>Number of Credits to Mint</label>
            <input
              type="number"
              className="form-control"
              value={batchMintNumber}
              onChange={(e) => setBatchMintNumber(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Base URI</label>
            <input
              type="text"
              className="form-control"
              value={batchMintUri}
              onChange={(e) => setBatchMintUri(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleMintBatch}>
            Mint Batch
          </button>
        </div>
      </div>

      {/* Redeem Section */}
      <div className="card mb-4">
        <div className="card-header">Redeem a Carbon Credit</div>
        <div className="card-body">
          <div className="mb-3">
            <label>Token ID</label>
            <input
              type="number"
              className="form-control"
              value={redeemTokenId}
              onChange={(e) => setRedeemTokenId(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Emission ID (string)</label>
            <input
              type="text"
              className="form-control"
              value={redeemEmissionId}
              onChange={(e) => setRedeemEmissionId(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleRedeem}>
            Redeem Credit
          </button>
        </div>
      </div>

      {/* List for Sale Section */}
      <div className="card mb-4">
        <div className="card-header">List Carbon Credit for Sale</div>
        <div className="card-body">
          <p className="text-muted">
            (The Marketplace contract must currently own the NFT if you want to list it.)
          </p>
          <div className="mb-3">
            <label>Token ID</label>
            <input
              type="number"
              className="form-control"
              value={listTokenId}
              onChange={(e) => setListTokenId(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Price (in XRPL tokens)</label>
            <input
              type="text"
              className="form-control"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleListForSale}>
            List for Sale
          </button>
        </div>
      </div>

      {/* Buy Credit Section */}
      <div className="card mb-4">
        <div className="card-header">Buy a Carbon Credit</div>
        <div className="card-body">
          <div className="mb-3">
            <label>Token ID</label>
            <input
              type="number"
              className="form-control"
              value={buyTokenId}
              onChange={(e) => setBuyTokenId(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Offer Price (in XRPL tokens)</label>
            <input
              type="text"
              className="form-control"
              value={buyOfferPrice}
              onChange={(e) => setBuyOfferPrice(e.target.value)}
            />
          </div>
          <button className="btn btn-success" onClick={handleBuyCredit}>
            Buy Credit
          </button>
        </div>
      </div>

      {/* Listings Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Active Listings</span>
          <button className="btn btn-outline-primary btn-sm" onClick={fetchAllListings}>
            Refresh
          </button>
        </div>
        <div className="card-body">
          {listings.length === 0 ? (
            <p>No active listings found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Token ID</th>
                  <th>Price (XRPL)</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.tokenId.toString()}</td>
                    <td>{formatUnits(item.price, 18)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
