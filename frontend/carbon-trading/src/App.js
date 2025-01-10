import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits,
  formatEther
} from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button } from "react-bootstrap"; // For popups

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

// Contract addresses
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

  // State for controlling popups (modals)
  const [showModal, setShowModal] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

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

  // Popup helper
  const handleShowPopup = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowModal(true);
  };

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

      handleShowPopup(
        "Success!",
        `Token #${listTokenId} was listed for sale at ${listPrice} XRPL tokens.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to list token for sale.");
    }
  };

  const handleBuyCredit = async () => {
    if (!marketplaceContract) return;

    try {
      const tokenIdBN = buyTokenId;
      const offerBN = parseUnits(buyOfferPrice, 18);

      const tx = await marketplaceContract.buyCredit(tokenIdBN, offerBN);
      await tx.wait();

      handleShowPopup(
        "Purchase Complete",
        `You bought token #${buyTokenId} for ${buyOfferPrice} XRPL tokens.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to buy credit.");
    }
  };

  const fetchAllListings = async () => {
    if (!marketplaceContract) return;

    try {
      const items = await marketplaceContract.getAllListingsSortedByPrice();
      setListings(items);
      handleShowPopup(
        "Listings Refreshed",
        "Active marketplace listings updated!"
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to fetch listings.");
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
      setCurrentUserBalance(formatEther(bal));
      handleShowPopup("Balance Retrieved", `You have ${formatEther(bal)} ETH.`);
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to retrieve user balance.");
    }
  };

  const handleGetTokensOfAddress = async () => {
    if (!carbonCreditContract || !ownerAddressQuery) {
      handleShowPopup("Warning", "Please enter a valid address to query.");
      return;
    }
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(
        ownerAddressQuery
      );
      setOwnerTokens(tokenIds.map((id) => id.toString()));
      handleShowPopup(
        "Query Complete",
        `Found ${tokenIds.length} token(s) for address ${ownerAddressQuery}.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Could not retrieve tokens for that address.");
    }
  };

  const handleGetMarketplaceTokens = async () => {
    if (!carbonCreditContract) return;
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(
        MARKETPLACE_ADDRESS
      );
      setOwnerTokens(tokenIds.map((id) => id.toString()));
      handleShowPopup(
        "Marketplace Tokens",
        `Marketplace currently holds ${tokenIds.length} token(s).`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Could not retrieve marketplace tokens.");
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

      handleShowPopup(
        "Minting Success",
        `Successfully minted ${batchMintNumber} credits to ${toAddress}! (URI: ${uri})`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to mint batch.");
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
      handleShowPopup(
        "Redeemed!",
        `Token #${redeemTokenId} was redeemed for emission: ${redeemEmissionId}.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to redeem credit.");
    }
  };

  const handleCheckTokenOwner = async () => {
    if (!carbonCreditContract || !queriedTokenId) {
      handleShowPopup("Warning", "Please enter a valid Token ID first.");
      return;
    }
    try {
      const ownerOfToken = await carbonCreditContract.ownerOf(queriedTokenId);
      setQueriedTokenOwner(ownerOfToken);
      handleShowPopup(
        "Owner Retrieved",
        `Token #${queriedTokenId} is owned by ${ownerOfToken}.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to retrieve token owner.");
    }
  };

  const handleMarketplaceBalance = async () => {
    if (!marketplaceContract) return;
    try {
      const balanceBN = await marketplaceContract.marketplaceBalance();
      setMarketplaceCreditCount(balanceBN.toString());
      handleShowPopup(
        "Marketplace Balance",
        `The Marketplace contract holds ${balanceBN.toString()} credits.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to retrieve marketplace balance.");
    }
  };

  // ---------------------------------------------
  // Simple toggler for side nav
  // ---------------------------------------------
  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // Basic style for cards
  const fancyCardStyle = {
    border: "2px solid #0dcaf0",
    borderRadius: "8px",
    backgroundColor: "#f0fcff",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    marginBottom: "25px",
    overflow: "hidden"
  };

  const fancyCardHeader = {
    backgroundColor: "#20c997",
    color: "#fff",
    fontWeight: "700",
    padding: "10px 20px",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const fancyCardBody = {
    padding: "20px"
  };

  const bigHeadingStyle = {
    color: "#034f84",
    fontWeight: "900",
    margin: 0
  };

  return (
    <>
      {/* Popup (Modal) for alerts */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{popupTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{popupMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>
        {/* 
          ====================================
          Side Navigation Panel 
          ====================================
        */}
        <div
          style={{
            width: isSidebarCollapsed ? "60px" : "250px",
            backgroundColor: "#e3f6f5",
            borderRight: "1px solid #ccc",
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

            {/* Marketplace Tab */}
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

            {/* User Tab */}
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

            {/* Admin Tab */}
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
              {/* Hero Section */}
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
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7f/Rotating_earth_animated_transparent.gif"
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

              {/* Steps / Buttons Section */}
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
                      border: "3px solid #0dcaf0",
                      transform: "rotate(-1deg)"
                    }}
                  >
                    <div className="card-body text-center">
                      <h2
                        style={{
                          color: "#0dcaf0",
                          fontWeight: "900",
                          marginBottom: "15px"
                        }}
                      >
                        Step 1
                      </h2>
                      <p className="card-text" style={{ fontSize: "1.2rem" }}>
                        Connect your wallet or create an account to begin your
                        carbon credit journey.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => alert("Wallet connect logic here!")}
                      >
                        Connect Wallet
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div
                    className="card h-100"
                    style={{
                      border: "3px solid #198754",
                      transform: "rotate(1deg)"
                    }}
                  >
                    <div className="card-body text-center">
                      <h2
                        style={{
                          color: "#198754",
                          fontWeight: "900",
                          marginBottom: "15px"
                        }}
                      >
                        Step 2
                      </h2>
                      <p className="card-text" style={{ fontSize: "1.2rem" }}>
                        Explore our Marketplace to buy/sell carbon credits that
                        help the planet.
                      </p>
                      <button
                        className="btn btn-success"
                        onClick={() => setActiveTab("marketplace")}
                      >
                        Go to Marketplace
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-4">
                  <div
                    className="card h-100"
                    style={{
                      border: "3px solid #ffc107",
                      transform: "rotate(-1deg)"
                    }}
                  >
                    <div className="card-body text-center">
                      <h2
                        style={{
                          color: "#ffc107",
                          fontWeight: "900",
                          marginBottom: "15px"
                        }}
                      >
                        Step 3
                      </h2>
                      <p className="card-text" style={{ fontSize: "1.2rem" }}>
                        Redeem credits to offset real-world emissions and watch
                        your eco-karma soar!
                      </p>
                      <button
                        className="btn btn-warning"
                        onClick={() => setActiveTab("admin")}
                      >
                        Redeem Credits
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
              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>Active Listings</h3>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={fetchAllListings}
                  >
                    Refresh
                  </button>
                </div>
                <div style={fancyCardBody}>
                  {listings.length === 0 ? (
                    <p>No active listings found.</p>
                  ) : (
                    <table className="table table-bordered">
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

              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>List a Credit For Sale</h3>
                </div>
                <div style={fancyCardBody}>
                  <p className="text-muted">
                    Remember: The Marketplace must currently own the NFT to list
                    it. If it’s in your wallet, first send it to the Marketplace
                    address.
                  </p>
                  <div className="mb-3">
                    <label>Token ID to List:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={listTokenId}
                      onChange={(e) => setListTokenId(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Sale Price (XRPL):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleListForSale}
                  >
                    List For Sale
                  </button>
                </div>
              </div>

              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>Buy a Credit</h3>
                </div>
                <div style={fancyCardBody}>
                  <p className="text-muted">
                    Provide the ID of a listed token and your offer price.
                  </p>
                  <div className="mb-3">
                    <label>Token ID to Purchase:</label>
                    <input
                      type="number"
                      className="form-control"
                      value={buyTokenId}
                      onChange={(e) => setBuyTokenId(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Your Offer (XRPL):</label>
                    <input
                      type="text"
                      className="form-control"
                      value={buyOfferPrice}
                      onChange={(e) => setBuyOfferPrice(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-success" onClick={handleBuyCredit}>
                    Buy Now
                  </button>
                </div>
              </div>

              <PriceHistoryChart />
            </>
          )}

          {/* USER TAB CONTENT */}
          {activeTab === "user" && (
            <>
              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>Check My XRPL Balance</h3>
                </div>
                <div style={fancyCardBody}>
                  <button
                    className="btn btn-info mb-2"
                    onClick={handleCheckUserBalance}
                  >
                    Check Balance
                  </button>
                  <div>
                    <label style={{ fontWeight: "bold" }}>Balance (XRPL): </label>
                    <span className="ms-2">
                      {currentUserBalance || "Not fetched yet"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>Check Tokens of an Address</h3>
                </div>
                <div style={fancyCardBody}>
                  <div className="mb-3">
                    <label>Address to Query:</label>
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
                      Show Tokens
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleGetMarketplaceTokens}
                    >
                      Marketplace Tokens
                    </button>
                  </div>

                  <h5 style={{ color: "#0d6efd" }}>Token IDs Found:</h5>
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

              <div style={fancyCardStyle}>
                <div style={fancyCardHeader}>
                  <h3 style={bigHeadingStyle}>My Account</h3>
                </div>
                <div style={fancyCardBody}>
                  <div className="mb-2">
                    <label style={{ fontWeight: "bold" }}>My Address:</label>
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
                <div style={fancyCardStyle}>
                  <div style={fancyCardHeader}>
                    <h3 style={bigHeadingStyle}>Mint Carbon Credits (Batch)</h3>
                  </div>
                  <div style={fancyCardBody}>
                    <p className="text-muted">
                      Enter how many credits to create, plus an optional address
                      (defaults to your own) and optional URI.
                    </p>
                    <div className="mb-3">
                      <label>Number of Credits:</label>
                      <input
                        type="number"
                        className="form-control"
                        value={batchMintNumber}
                        onChange={(e) => setBatchMintNumber(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label>Mint To Address (optional):</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0x1234... (defaults to your address)"
                        value={mintToAddress}
                        onChange={(e) => setMintToAddress(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label>Base URI (optional):</label>
                      <input
                        type="text"
                        className="form-control"
                        value={batchMintUri}
                        onChange={(e) => setBatchMintUri(e.target.value)}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleMintBatch}
                    >
                      Mint Batch
                    </button>
                  </div>
                </div>

                <div style={fancyCardStyle}>
                  <div style={fancyCardHeader}>
                    <h3 style={bigHeadingStyle}>Redeem a Carbon Credit</h3>
                  </div>
                  <div style={fancyCardBody}>
                    <p className="text-muted">
                      Provide the token ID and emission ID for offset.
                    </p>
                    <div className="mb-3">
                      <label>Token ID:</label>
                      <input
                        type="number"
                        className="form-control"
                        value={redeemTokenId}
                        onChange={(e) => setRedeemTokenId(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label>Emission ID:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={redeemEmissionId}
                        onChange={(e) => setRedeemEmissionId(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleRedeem}>
                      Redeem
                    </button>
                  </div>
                </div>

                <div style={fancyCardStyle}>
                  <div style={fancyCardHeader}>
                    <h3 style={bigHeadingStyle}>Check Owner of a Token</h3>
                  </div>
                  <div style={fancyCardBody}>
                    <p className="text-muted">
                      Unsure who owns that Carbon Credit Token? Check here:
                    </p>
                    <div className="mb-3">
                      <label>Token ID:</label>
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
                      <label style={{ fontWeight: "bold" }}>
                        Owner of Token #{queriedTokenId}:
                      </label>
                      <div>{queriedTokenOwner || "Not fetched yet"}</div>
                    </div>
                  </div>
                </div>

                <div style={fancyCardStyle}>
                  <div style={fancyCardHeader}>
                    <h3 style={bigHeadingStyle}>Get Marketplace Balance</h3>
                  </div>
                  <div style={fancyCardBody}>
                    <p className="text-muted">
                      See how many credits the marketplace holds.
                    </p>
                    <button
                      className="btn btn-info mb-2"
                      onClick={handleMarketplaceBalance}
                    >
                      Retrieve Balance
                    </button>
                    <div>
                      <label style={{ fontWeight: "bold" }}>
                        Marketplace Balance (Credits):
                      </label>
                      <span className="ms-2">
                        {marketplaceCreditCount || "Not fetched yet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={fancyCardStyle}>
                  <div style={fancyCardHeader}>
                    <h3 style={bigHeadingStyle}>Contract Owner</h3>
                  </div>
                  <div style={fancyCardBody}>
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
    </>
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
        borderColor: "rgba(0, 123, 255, 1)",
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
    <div
      style={{
        border: "2px solid #0dcaf0",
        backgroundColor: "#f0fcff",
        marginBottom: "25px",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
      }}
    >
      <div
        style={{
          backgroundColor: "#20c997",
          color: "#fff",
          fontWeight: "700",
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <h3 style={{ color: "#034f84", fontWeight: "900", margin: 0 }}>
          Price History
        </h3>
        <small>(Line Chart)</small>
      </div>
      <div style={{ padding: "20px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default App;
