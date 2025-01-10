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
import carbonCreditABI from "./contracts/CarbonCredit.json";
import marketplaceABI from "./contracts/CarbonCreditMarketplace.json";

// Import icons for collapsed sidebar
import homeIcon from "./icons/home.png";
import marketplaceIcon from "./icons/marketplace.png";
import userIcon from "./icons/user.png";
import adminIcon from "./icons/admin.png";

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

const CARBON_CREDIT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const MARKETPLACE_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

// ---------------------------------------------
// SAMPLE PRICE HISTORY DATA
// ---------------------------------------------
const priceHistoryData = [
  { timestamp: 1704067200, price: "95" },
  { timestamp: 1704153600, price: "98" },
  { timestamp: 1704240000, price: "102" },
  { timestamp: 1704326400, price: "110" },
  { timestamp: 1704412800, price: "108" },
  { timestamp: 1704499200, price: "112" },
  { timestamp: 1704585600, price: "115" },
  { timestamp: 1704672000, price: "120" },
  { timestamp: 1704758400, price: "118" },
  { timestamp: 1704844800, price: "121" },
  { timestamp: 1704931200, price: "123" },
  { timestamp: 1705017600, price: "125" },
  { timestamp: 1705104000, price: "128" },
  { timestamp: 1705190400, price: "130" },
  { timestamp: 1705276800, price: "127" },
  { timestamp: 1705363200, price: "129" },
  { timestamp: 1705449600, price: "135" },
  { timestamp: 1705536000, price: "140" },
  { timestamp: 1705622400, price: "137" },
  { timestamp: 1705708800, price: "142" },
  { timestamp: 1705795200, price: "145" },
  { timestamp: 1705881600, price: "148" },
  { timestamp: 1705968000, price: "152" },
  { timestamp: 1706054400, price: "150" },
  { timestamp: 1706140800, price: "155" },
  { timestamp: 1706227200, price: "158" },
  { timestamp: 1706313600, price: "160" },
  { timestamp: 1706400000, price: "165" },
  { timestamp: 1706486400, price: "168" },
  { timestamp: 1706572800, price: "172" }
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
  const [batchMintUri, setBatchMintUri] = useState("");

  // For redeeming
  const [redeemTokenId, setRedeemTokenId] = useState("");
  const [redeemEmissionId, setRedeemEmissionId] = useState("");

  // For listing
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");

  // For buying
  const [buyTokenId, setBuyTokenId] = useState("");
  const [buyOfferPrice, setBuyOfferPrice] = useState("");

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

  // Sidebar / Tab state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // Default to "home" tab

  // Check if current user is contract owner
  const isUserOwner =
    currentUserAddress &&
    contractOwnerAddress &&
    currentUserAddress.toLowerCase() === contractOwnerAddress.toLowerCase();

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

        // In ethers v6, we use BrowserProvider
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

        // Fetch addresses for user and contract owner
        const addr = await _signer.getAddress();
        setCurrentUserAddress(addr);

        const owner = await ccContract.owner();
        setContractOwnerAddress(owner);

      } catch (err) {
        console.error("Error initializing contracts or wallet:", err);
      }
    };

    init();
  }, []);

  // ---------------------------------------------
  // Marketplace Handlers
  // ---------------------------------------------
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
      const items = await marketplaceContract.getAllListingsSortedByPrice();
      setListings(items);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch listings!");
    }
  };

  // ---------------------------------------------
  // User Handlers
  // ---------------------------------------------
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

  const handleGetTokensOfAddress = async () => {
    if (!carbonCreditContract || !ownerAddressQuery) {
      alert("Please enter a valid address.");
      return;
    }
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(
        ownerAddressQuery
      );
      setOwnerTokens(tokenIds.map((id) => id.toString()));
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for that address.");
    }
  };

  const handleGetMarketplaceTokens = async () => {
    if (!carbonCreditContract) return;
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(
        MARKETPLACE_ADDRESS
      );
      setOwnerTokens(tokenIds.map((id) => id.toString()));
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for the marketplace.");
    }
  };

  // ---------------------------------------------
  // Admin Handlers
  // ---------------------------------------------
  const handleMintBatch = async () => {
    if (!carbonCreditContract || !signer) return;

    try {
      const numberOfCredits = batchMintNumber;
      const toAddress =
        mintToAddress && mintToAddress.trim() !== ""
          ? mintToAddress
          : await signer.getAddress();

      const uri =
        batchMintUri && batchMintUri.trim() !== ""
          ? batchMintUri
          : defaultBaseUri;

      const tx = await carbonCreditContract.mintCarbonCreditsBatch(
        toAddress,
        numberOfCredits,
        uri
      );
      await tx.wait();

      alert(
        `Successfully minted ${batchMintNumber} credits to ${toAddress}! (URI: ${uri})`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to mint batch!");
    }
  };

  const handleRedeem = async () => {
    if (!carbonCreditContract) return;

    try {
      const tx = await carbonCreditContract.redeemCarbonCredit(
        redeemTokenId,
        redeemEmissionId
      );
      await tx.wait();
      alert(
        `Redeemed token #${redeemTokenId} for emission: ${redeemEmissionId}`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to redeem credit!");
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

  // ---------------------------------------------
  // Simple toggler for side nav
  // ---------------------------------------------
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // ---------------------------------------------
  // UI Rendering
  // ---------------------------------------------
  return (
    <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
      {/* 
        ====================================
        Side Navigation Panel 
        ====================================
      */}
      <div
        style={{
          width: isSidebarCollapsed ? "60px" : "250px",
          backgroundColor: "#f8f9fa",
          borderRight: "1px solid #ddd",
          transition: "width 0.3s ease",
          position: "relative"
        }}
      >
        {/* Collapse button */}
        <button
          style={{
            position: "absolute",
            top: 10,
            right: isSidebarCollapsed ? "-35px" : "-45px",
            width: "30px",
            height: "30px",
            cursor: "pointer",
            transition: "right 0.3s ease"
          }}
          onClick={toggleSidebar}
          className="btn btn-outline-secondary btn-sm"
        >
          {isSidebarCollapsed ? ">" : "<"}
        </button>

        {/* Navigation Items */}
        <div style={{ marginTop: "60px" }}>
          {/* Home Tab */}
          <div
            className={`p-2 ${activeTab === "home" ? "bg-primary text-white" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("home")}
          >
            {isSidebarCollapsed ? (
              <img
                src={homeIcon}
                alt="Home"
                style={{ width: "24px", height: "24px" }}
              />
            ) : (
              "Home"
            )}
          </div>

          <div
            className={`p-2 ${
              activeTab === "marketplace" ? "bg-primary text-white" : ""
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("marketplace")}
          >
            {isSidebarCollapsed ? (
              <img
                src={marketplaceIcon}
                alt="Marketplace"
                style={{ width: "24px", height: "24px" }}
              />
            ) : (
              "Marketplace"
            )}
          </div>
          <div
            className={`p-2 ${activeTab === "user" ? "bg-primary text-white" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("user")}
          >
            {isSidebarCollapsed ? (
              <img
                src={userIcon}
                alt="User"
                style={{ width: "24px", height: "24px" }}
              />
            ) : (
              "User"
            )}
          </div>
          {/* Admin Tab - Always Visible */}
          <div
            className={`p-2 ${activeTab === "admin" ? "bg-primary text-white" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("admin")}
          >
            {isSidebarCollapsed ? (
              <img
                src={adminIcon}
                alt="Admin"
                style={{ width: "24px", height: "24px" }}
              />
            ) : (
              "Admin"
            )}
          </div>
        </div>
      </div>

      {/* 
        ====================================
        Main Content Area 
        ====================================
      */}
      <div className="container py-4" style={{ flex: 1 }}>
        <h1 className="mb-4" style={{ textAlign: "center" }}>
          Carbon Credit Trading
        </h1>

        {/* HOME TAB CONTENT */}
        {activeTab === "home" && (
          <>
            {/* Incredibly Over-the-Top Hero Section */}
            <div
              className="card mb-4"
              style={{
                border: "0",
                boxShadow: "0 0 20px rgba(0,0,0,0.3)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  background:
                    "radial-gradient(circle at top, rgba(255, 255, 0, 0.7), rgba(0, 206, 209, 0.7)), url('https://images.unsplash.com/photo-1528825871115-3581a5387919') center/cover",
                  minHeight: "400px",
                  color: "#fff",
                  padding: "40px 30px",
                  position: "relative"
                }}
              >
                <div
                  style={{
                    fontSize: "4rem",
                    fontWeight: "800",
                    marginBottom: "20px",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
                  }}
                >
                  SAVE THE EARTH!
                </div>
                <p
                  style={{
                    fontSize: "1.4rem",
                    maxWidth: "800px",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                  }}
                >
                  Invest in carbon credits to rescue our planet from impending
                  doom! This is sustainability so next-level, your mind might
                  just explode into glitter and unicorns.
                </p>
                <img
                  src="https://media.giphy.com/media/l2QE3cCP0ws80i1FC/giphy.gif"
                  alt="Over-the-top environment"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    boxShadow: "0 0 12px rgba(0,0,0,0.3)"
                  }}
                />
              </div>
            </div>

            {/* Ridiculously Impressive Steps */}
            <div
              className="row"
              style={{
                animation: "beat 1.5s infinite alternate ease-in-out",
                "@keyframes beat": {
                  "0%": { transform: "scale(1)" },
                  "100%": { transform: "scale(1.05)" }
                }
              }}
            >
              <div className="col-md-4 mb-4">
                <div
                  className="card h-100"
                  style={{
                    border: "3px solid magenta",
                    transform: "rotate(-1deg)"
                  }}
                >
                  <div className="card-body text-center">
                    <h2
                      style={{
                        color: "magenta",
                        fontWeight: "900",
                        marginBottom: "15px"
                      }}
                    >
                      Step 1
                    </h2>
                    <p className="card-text" style={{ fontSize: "1.2rem" }}>
                      Create or connect your wallet. Feel the adrenaline pumping
                      as you prepare to buy, sell, or trade planet-saving
                      credits.
                    </p>
                    <button className="btn btn-primary">
                      I'm Extremely Ready!
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div
                  className="card h-100"
                  style={{
                    border: "3px solid gold",
                    transform: "rotate(1deg)"
                  }}
                >
                  <div className="card-body text-center">
                    <h2
                      style={{
                        color: "gold",
                        fontWeight: "900",
                        marginBottom: "15px"
                      }}
                    >
                      Step 2
                    </h2>
                    <p className="card-text" style={{ fontSize: "1.2rem" }}>
                      Plunge into our ludicrously exciting marketplace and
                      acquire carbon credits before they literally save the
                      world.
                    </p>
                    <button
                      className="btn btn-success"
                      onClick={() => setActiveTab("marketplace")}
                    >
                      To The Grand Marketplace!
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div
                  className="card h-100"
                  style={{
                    border: "3px solid cyan",
                    transform: "rotate(-1deg)"
                  }}
                >
                  <div className="card-body text-center">
                    <h2
                      style={{
                        color: "cyan",
                        fontWeight: "900",
                        marginBottom: "15px"
                      }}
                    >
                      Step 3
                    </h2>
                    <p className="card-text" style={{ fontSize: "1.2rem" }}>
                      Redeem your credits to offset real-world emissions, while
                      singing a majestic anthem to Mother Nature herself.
                    </p>
                    <button
                      className="btn btn-warning"
                      onClick={() => setActiveTab("admin")}
                    >
                      Offset The Heck Out Of My Emissions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MARKETPLACE TAB CONTENT */}
        {activeTab === "marketplace" && (
          <>
            <div className="card mb-4">
              <div className="card-header">List Carbon Credit for Sale</div>
              <div className="card-body">
                <p className="text-muted">
                  (Marketplace contract must currently own the NFT if you want
                  to list it.)
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

            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Active Listings</span>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={fetchAllListings}
                >
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

            {/* Price History */}
            <PriceHistoryChart />
          </>
        )}

        {/* USER TAB CONTENT */}
        {activeTab === "user" && (
          <>
            <div className="card mb-4">
              <div className="card-header">Check My ETH Balance</div>
              <div className="card-body">
                <button
                  className="btn btn-info mb-2"
                  onClick={handleCheckUserBalance}
                >
                  Check My ETH Balance
                </button>
                <div>
                  <label>Balance (ETH): </label>
                  <span className="ms-2">
                    {currentUserBalance || "Not fetched yet"}
                  </span>
                </div>
              </div>
            </div>

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
                  <button
                    className="btn btn-info"
                    onClick={handleGetTokensOfAddress}
                  >
                    Get Tokens of Address
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleGetMarketplaceTokens}
                  >
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

            <div className="card mb-4">
              <div className="card-header">My Account</div>
              <div className="card-body">
                <div className="mb-2">
                  <label>My Address: </label>
                  <span className="ms-2">
                    {currentUserAddress || "Not fetched yet"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ADMIN TAB CONTENT */}
        {activeTab === "admin" &&
          (isUserOwner ? (
            <>
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
                    <label>Mint To Address (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0x1234... (defaults to your address)"
                      value={mintToAddress}
                      onChange={(e) => setMintToAddress(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label>Base URI (optional)</label>
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

              <div className="card mb-4">
                <div className="card-header">Check Owner of a Token</div>
                <div className="card-body">
                  <div className="mb-3">
                    <label>Token ID</label>
                    <input
                      type="number"
                      className="form-control"
                      value={queriedTokenId}
                      onChange={(e) => setQueriedTokenId(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-info mb-2"
                    onClick={handleCheckTokenOwner}
                  >
                    Check Owner
                  </button>
                  <div>
                    <label>Owner of Token #{queriedTokenId}:</label>
                    <div>{queriedTokenOwner || "Not fetched yet"}</div>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header">Get Marketplace Balance</div>
                <div className="card-body">
                  <button
                    className="btn btn-info mb-2"
                    onClick={handleMarketplaceBalance}
                  >
                    Retrieve Marketplace Balance
                  </button>
                  <div>
                    <label>Marketplace Balance (Credits):</label>
                    <span className="ms-2">
                      {marketplaceCreditCount || "Not fetched yet"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header">Contract Owner</div>
                <div className="card-body">
                  <p>CarbonCredit Contract Owner:</p>
                  <strong>{contractOwnerAddress}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="alert alert-danger">
              You do not have permission to view this section.
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Separate component to render the line chart using Chart.js + react-chartjs-2.
 */
function PriceHistoryChart() {
  // Convert JSON data (timestamp/price) to arrays for Chart.js
  const labels = priceHistoryData.map((point) =>
    new Date(point.timestamp * 1000).toLocaleDateString()
  );

  const prices = priceHistoryData.map((point) => Number(point.price));

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
