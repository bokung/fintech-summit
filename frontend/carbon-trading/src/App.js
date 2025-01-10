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

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

// --- Import the ABI JSON for each contract
//    (Replace these paths with the correct paths to your own ABI files.)
import carbonCreditABI from "./contracts/CarbonCredit.json";
import marketplaceABI from "./contracts/CarbonCreditMarketplace.json";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// You should update these to match the addresses of your deployed contracts:
const CARBON_CREDIT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MARKETPLACE_ADDRESS   = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// ---------------------------------------------
// SAMPLE PRICE HISTORY DATA (30+ entries)
// (Embedded directly here, so there's no external fetch.)
// ---------------------------------------------
const priceHistoryData = [
  { "timestamp": 1704067200, "price": "95" },
  { "timestamp": 1704153600, "price": "98" },
  { "timestamp": 1704240000, "price": "102" },
  { "timestamp": 1704326400, "price": "110" },
  { "timestamp": 1704412800, "price": "108" },
  { "timestamp": 1704499200, "price": "112" },
  { "timestamp": 1704585600, "price": "115" },
  { "timestamp": 1704672000, "price": "120" },
  { "timestamp": 1704758400, "price": "118" },
  { "timestamp": 1704844800, "price": "121" },
  { "timestamp": 1704931200, "price": "123" },
  { "timestamp": 1705017600, "price": "125" },
  { "timestamp": 1705104000, "price": "128" },
  { "timestamp": 1705190400, "price": "130" },
  { "timestamp": 1705276800, "price": "127" },
  { "timestamp": 1705363200, "price": "129" },
  { "timestamp": 1705449600, "price": "135" },
  { "timestamp": 1705536000, "price": "140" },
  { "timestamp": 1705622400, "price": "137" },
  { "timestamp": 1705708800, "price": "142" },
  { "timestamp": 1705795200, "price": "145" },
  { "timestamp": 1705881600, "price": "148" },
  { "timestamp": 1705968000, "price": "152" },
  { "timestamp": 1706054400, "price": "150" },
  { "timestamp": 1706140800, "price": "155" },
  { "timestamp": 1706227200, "price": "158" },
  { "timestamp": 1706313600, "price": "160" },
  { "timestamp": 1706400000, "price": "165" },
  { "timestamp": 1706486400, "price": "168" },
  { "timestamp": 1706572800, "price": "172" }
];

function App() {
  // ---------------------------------------------
  // State hooks
  // ---------------------------------------------
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  const [carbonCreditContract, setCarbonCreditContract] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);

  // For batch minting
  const [batchMintNumber, setBatchMintNumber] = useState("1");
  const [batchMintUri, setBatchMintUri]       = useState("");

  // For redeeming
  const [redeemTokenId, setRedeemTokenId]         = useState("");
  const [redeemEmissionId, setRedeemEmissionId]   = useState("");

  // For listing
  const [listTokenId, setListTokenId]             = useState("");
  const [listPrice, setListPrice]                 = useState("");

  // For buying
  const [buyTokenId, setBuyTokenId]               = useState("");
  const [buyOfferPrice, setBuyOfferPrice]         = useState("");

  // For displaying listings
  const [listings, setListings] = useState([]);

  // For querying tokens of an address
  const [ownerAddressQuery, setOwnerAddressQuery] = useState("");
  const [ownerTokens, setOwnerTokens] = useState([]);

  // For minting
  const [mintToAddress, setMintToAddress] = useState("");
  const defaultBaseUri = "https://example.com/metadata/";

  // Extended UI
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
  // Handlers (Original)
  // ---------------------------------------------
  const handleMintBatch = async () => {
    if (!carbonCreditContract || !signer) return;

    try {
      // Number of credits to mint
      const numberOfCredits = batchMintNumber;

      // Use the user-provided 'to' address if given; otherwise, default to the connected wallet
      const toAddress = mintToAddress && mintToAddress.trim() !== ""
        ? mintToAddress
        : await signer.getAddress();

      // Use the user-provided URI if given; otherwise, use the default
      const uri = batchMintUri && batchMintUri.trim() !== ""
        ? batchMintUri
        : defaultBaseUri;

      const tx = await carbonCreditContract.mintCarbonCreditsBatch(
        toAddress,
        numberOfCredits,
        uri
      );
      await tx.wait();

      alert(`Successfully minted ${batchMintNumber} credits to ${toAddress}! (URI: ${uri})`);
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
  // Handlers (Extended UI)
  // ---------------------------------------------
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

  const handleGetTokensOfAddress = async () => {
    if (!carbonCreditContract || !ownerAddressQuery) {
      alert("Please enter a valid address.");
      return;
    }
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(ownerAddressQuery);
      setOwnerTokens(tokenIds.map((id) => id.toString())); // Convert BN to string
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for that address.");
    }
  };

  const handleGetMarketplaceTokens = async () => {
    if (!carbonCreditContract) return;
    try {
      // We'll reuse the existing MARKETPLACE_ADDRESS constant
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(MARKETPLACE_ADDRESS);
      setOwnerTokens(tokenIds.map((id) => id.toString())); // Convert BN to string
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for the marketplace.");
    }
  };

  // ---------------------------------------------
  // Render UI
  // ---------------------------------------------
  return (
    <div className="container py-5">
      <h1 className="text-center mb-5">Carbon Credit Trading</h1>

      {/* --- Extended UI Section --- */}
      <div className="card mb-4">
        <div className="card-header">Extended UI Features</div>
        <div className="card-body">
          {/* 1. Button to fetch user address */}
          <button className="btn btn-info mb-2" onClick={handleCheckUserAddress}>
            Check Current User Address
          </button>
          <div className="mb-3">
            <label>Current User Address:</label>
            <div className="form-control" readOnly>
              {currentUserAddress || "Not fetched yet"}
            </div>
          </div>

          {/* 2. UI element to display the current user balance in ETH */}
          <button className="btn btn-info mb-2" onClick={handleCheckUserBalance}>
            Check My ETH Balance
          </button>
          <div className="mb-3">
            <label>My Balance (ETH):</label>
            <div className="form-control" readOnly>
              {currentUserBalance || "Not fetched yet"}
            </div>
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

      {/* ---- Check Tokens of Owner Section ---- */}
      <div className="card mb-4">
        <div className="card-header">Check Tokens of an Address</div>
        <div className="card-body">
          <div className="mb-3">
            <label>Address to Query</label>
            <input
              type="text"
              className="form-control"
              placeholder="0x123..."
              value={ownerAddressQuery}
              onChange={(e) => setOwnerAddressQuery(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2 mb-3">
            <button className="btn btn-info" onClick={handleGetTokensOfAddress}>
              Get Tokens of Address
            </button>
            <button className="btn btn-secondary" onClick={handleGetMarketplaceTokens}>
              Get Marketplace Tokens
            </button>
          </div>

          {/* Display the tokens */}
          <h5>Token IDs Found:</h5>
          {ownerTokens.length === 0 ? (
            <p>No tokens found.</p>
          ) : (
            <ul>
              {ownerTokens.map((tid, idx) => (
                <li key={idx}>{tid}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

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

          {/* New: Address to Mint To (optional) */}
          <div className="mb-3">
            <label>Mint To Address (optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="0x1234... (defaults to your own address)"
              value={mintToAddress}
              onChange={(e) => setMintToAddress(e.target.value)}
            />
          </div>

          {/* New: Base URI (optional) */}
          <div className="mb-3">
            <label>Base URI (optional; defaults to https://example.com/metadata/)</label>
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

      {/* 
        ============================
        Price History (Line Chart)
        ============================
      */}
      <PriceHistoryChart />

    </div>
  );
}

/**
 * Separate component to render the line chart using Chart.js + react-chartjs-2.
 * We use the embedded `priceHistoryData` array from above. 
 * All data points share the same "series," meaning there's only one line on the graph.
 */
function PriceHistoryChart() {
  // Convert your JSON data (timestamp/price) to arrays for Chart.js
  const labels = priceHistoryData.map((point) =>
    // Convert Unix timestamp to a readable date
    new Date(point.timestamp * 1000).toLocaleDateString()
  );

  const prices = priceHistoryData.map((point) => Number(point.price));

  // Prepare data and options for Chart.js
  const data = {
    labels,
    datasets: [
      {
        label: "Carbon Credit Price (XRPL)",
        data: prices,
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Price History of Carbon Credits"
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Price (XRPL)"
        }
      },
      x: {
        title: {
          display: true,
          text: "Date"
        }
      }
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Price History (Line Chart)</div>
      <div className="card-body">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default App;
