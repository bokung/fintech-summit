// File: src/App.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";

// --- Import the ABI JSON for each contract
import carbonCreditABI from "./contracts/CarbonCredit.json";
import marketplaceABI from "./contracts/CarbonCreditMarketplace.json";

// You should update these to match what was printed by your Hardhat deploy script!
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
  // Connect wallet + instantiate contracts
  // ---------------------------------------------
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        console.error("MetaMask not detected!");
        return;
      }

      try {
        // Request user to connect their wallet
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const _provider = new ethers.providers.Web3Provider(window.ethereum);
        const _signer = _provider.getSigner();

        // Instantiate the contracts
        const ccContract = new ethers.Contract(
          CARBON_CREDIT_ADDRESS, 
          carbonCreditABI.abi, 
          _signer
        );

        const mpContract = new ethers.Contract(
          MARKETPLACE_ADDRESS,
          marketplaceABI.abi,
          _signer
        );

        setSigner(_signer);
        setProvider(_provider);
        setCarbonCreditContract(ccContract);
        setMarketplaceContract(mpContract);
      } catch (err) {
        console.error(err);
      }
    };

    init();
  }, []);

  // ---------------------------------------------
  // Mint (Batch)
  // ---------------------------------------------
  const handleMintBatch = async () => {
    if (!carbonCreditContract) return;

    try {
      const tx = await carbonCreditContract.mintCarbonCreditsBatch(
        await signer.getAddress(),        // to
        ethers.BigNumber.from(batchMintNumber),  // numberOfCredits
        batchMintUri                     // baseTokenURI
      );
      await tx.wait();
      alert(`Successfully minted ${batchMintNumber} credits!`);
    } catch (err) {
      console.error(err);
      alert("Failed to mint batch!");
    }
  };

  // ---------------------------------------------
  // Redeem Credit
  // ---------------------------------------------
  const handleRedeem = async () => {
    if (!carbonCreditContract) return;

    try {
      const tx = await carbonCreditContract.redeemCarbonCredit(
        ethers.BigNumber.from(redeemTokenId),
        redeemEmissionId
      );
      await tx.wait();
      alert(`Redeemed token #${redeemTokenId} for emission: ${redeemEmissionId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to redeem credit!");
    }
  };

  // ---------------------------------------------
  // List for Sale
  //   NOTE: The NFT must be already in the marketplace's possession
  //         (safeTransferFrom your address -> marketplace contract)
  // ---------------------------------------------
  const handleListForSale = async () => {
    if (!marketplaceContract) return;

    try {
      const tx = await marketplaceContract.listCreditForSale(
        ethers.BigNumber.from(listTokenId),
        ethers.utils.parseUnits(listPrice, 18)  // if your XRPL token uses 18 decimals
      );
      await tx.wait();
      alert(`Listed token #${listTokenId} for sale at ${listPrice} XRPL tokens.`);
    } catch (err) {
      console.error(err);
      alert("Failed to list token for sale!");
    }
  };

  // ---------------------------------------------
  // Buy Credit
  //   Buyer must have approved marketplace to spend "offerPrice" XRPL tokens
  // ---------------------------------------------
  const handleBuyCredit = async () => {
    if (!marketplaceContract) return;

    try {
      const tx = await marketplaceContract.buyCredit(
        ethers.BigNumber.from(buyTokenId),
        ethers.utils.parseUnits(buyOfferPrice, 18) 
      );
      await tx.wait();
      alert(`Bought token #${buyTokenId} for ${buyOfferPrice} XRPL tokens.`);
    } catch (err) {
      console.error(err);
      alert("Failed to buy credit!");
    }
  };

  // ---------------------------------------------
  // Get All Listings (sorted by price)
  // ---------------------------------------------
  const fetchAllListings = async () => {
    if (!marketplaceContract) return;

    try {
      // This is a view function (no gas cost)
      const items = await marketplaceContract.getAllListingsSortedByPrice();
      // Each item is { tokenId, price }
      setListings(items);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch listings!");
    }
  };

  // ---------------------------------------------
  // Render UI
  // ---------------------------------------------
  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Carbon Credit Trading</h1>

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
            (Remember that the Marketplace contract must currently own the NFT if you want to list it.)
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
                    <td>{ethers.utils.formatUnits(item.price, 18)}</td>
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
