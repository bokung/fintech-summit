import React, { useState, useEffect, useRef } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits,
  formatEther
} from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button } from "react-bootstrap";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import Papa from "papaparse";
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
import carbonCreditABI from "./contracts/CarbonCredit.json";
import marketplaceABI from "./contracts/CarbonCreditMarketplace.json";
import homeIcon from "./icons/home.png";
import marketplaceIcon from "./icons/marketplace.png";
import userIcon from "./icons/user.png";
import adminIcon from "./icons/admin.png";

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
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [carbonCreditContract, setCarbonCreditContract] = useState(null);
  const [marketplaceContract, setMarketplaceContract] = useState(null);
  const [batchMintNumber, setBatchMintNumber] = useState("1");
  const [batchMintUri, setBatchMintUri] = useState("");
  const [redeemTokenId, setRedeemTokenId] = useState("");
  const [redeemEmissionId, setRedeemEmissionId] = useState("");
  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [buyTokenId, setBuyTokenId] = useState("");
  const [buyOfferPrice, setBuyOfferPrice] = useState("");
  const [listings, setListings] = useState([]);
  const [ownerAddressQuery, setOwnerAddressQuery] = useState("");
  const [ownerTokens, setOwnerTokens] = useState([]);
  const [mintToAddress, setMintToAddress] = useState("");
  const defaultBaseUri = "https://example.com/metadata/";
  const [currentUserAddress, setCurrentUserAddress] = useState("");
  const [currentUserBalance, setCurrentUserBalance] = useState("");
  const [contractOwnerAddress, setContractOwnerAddress] = useState("");
  const [queriedTokenId, setQueriedTokenId] = useState("");
  const [queriedTokenOwner, setQueriedTokenOwner] = useState("");
  const [marketplaceCreditCount, setMarketplaceCreditCount] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const nodeRefs = {
    home: useRef(null),
    marketplace: useRef(null),
    user: useRef(null),
    admin: useRef(null)
  };
  const isUserOwner =
    currentUserAddress &&
    contractOwnerAddress &&
    currentUserAddress.toLowerCase() === contractOwnerAddress.toLowerCase();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        console.error("MetaMask not detected!");
        return;
      }
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const _provider = new BrowserProvider(window.ethereum);
        const _signer = await _provider.getSigner();
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
        const addr = await _signer.getAddress();
        setCurrentUserAddress(addr);
        const owner = await ccContract.owner();
        setContractOwnerAddress(owner);
      } catch (err) {
        console.error("Error initializing wallet:", err);
      }
    };
    init();
  }, []);

  const handleShowPopup = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowModal(true);
  };

  const handleListForSale = async () => {
    if (!marketplaceContract) return;
    try {
      const priceBN = parseUnits(listPrice, 18);
      const tx = await marketplaceContract.listCreditForSale(listTokenId, priceBN);
      await tx.wait();
      handleShowPopup(
        "Success!",
        `Token #${listTokenId} was listed for sale at ${listPrice} XRPL tokens.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to list token.");
    }
  };

  const handleBuyCredit = async () => {
    if (!marketplaceContract) return;
    try {
      const offerBN = parseUnits(buyOfferPrice, 18);
      const tx = await marketplaceContract.buyCredit(buyTokenId, offerBN);
      await tx.wait();
      handleShowPopup(
        "Purchase Complete",
        `You bought token #${buyTokenId} for ${buyOfferPrice} XRPL tokens.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to buy token.");
    }
  };

  const fetchAllListings = async () => {
    if (!marketplaceContract) return;
    try {
      const items = await marketplaceContract.getAllListingsSortedByPrice();
      setListings(items);
      handleShowPopup("Listings Refreshed", "Active listings updated!");
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to fetch listings.");
    }
  };

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
        `Found ${tokenIds.length} token(s) for ${ownerAddressQuery}.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Could not retrieve tokens.");
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
        `Marketplace holds ${tokenIds.length} token(s).`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Could not retrieve marketplace tokens.");
    }
  };

  const handleMintBatch = async () => {
    if (!carbonCreditContract || !signer) return;
    try {
      const toAddress =
        mintToAddress.trim() !== "" ? mintToAddress : await signer.getAddress();
      const uri = batchMintUri.trim() !== "" ? batchMintUri : defaultBaseUri;
      const tx = await carbonCreditContract.mintCarbonCreditsBatch(
        toAddress,
        batchMintNumber,
        uri
      );
      await tx.wait();
      handleShowPopup(
        "Minting Success",
        `Minted ${batchMintNumber} credits to ${toAddress}. (URI: ${uri})`
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
        "Redeemed",
        `Token #${redeemTokenId} was redeemed for emission: ${redeemEmissionId}`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to redeem token.");
    }
  };

  const handleCheckTokenOwner = async () => {
    if (!carbonCreditContract || !queriedTokenId) {
      handleShowPopup("Warning", "Please enter a token ID.");
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
      handleShowPopup("Error!", "Failed to retrieve owner.");
    }
  };

  const handleMarketplaceBalance = async () => {
    if (!marketplaceContract) return;
    try {
      const balanceBN = await marketplaceContract.marketplaceBalance();
      setMarketplaceCreditCount(balanceBN.toString());
      handleShowPopup(
        "Marketplace Balance",
        `Marketplace holds ${balanceBN.toString()} credits.`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup("Error!", "Failed to retrieve marketplace balance.");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            setActiveTab={setActiveTab}
            nodeRef={nodeRefs["home"]}
          />
        );
      case "marketplace":
        return (
          <MarketplaceTab
            listings={listings}
            listTokenId={listTokenId}
            setListTokenId={setListTokenId}
            listPrice={listPrice}
            setListPrice={setListPrice}
            buyTokenId={buyTokenId}
            setBuyTokenId={setBuyTokenId}
            buyOfferPrice={buyOfferPrice}
            setBuyOfferPrice={setBuyOfferPrice}
            fetchAllListings={fetchAllListings}
            handleListForSale={handleListForSale}
            handleBuyCredit={handleBuyCredit}
            nodeRef={nodeRefs["marketplace"]}
          />
        );
      case "user":
        return (
          <UserTab
            currentUserBalance={currentUserBalance}
            handleCheckUserBalance={handleCheckUserBalance}
            ownerAddressQuery={ownerAddressQuery}
            setOwnerAddressQuery={setOwnerAddressQuery}
            handleGetTokensOfAddress={handleGetTokensOfAddress}
            handleGetMarketplaceTokens={handleGetMarketplaceTokens}
            ownerTokens={ownerTokens}
            currentUserAddress={currentUserAddress}
            nodeRef={nodeRefs["user"]}
          />
        );
      case "admin":
        return (
          <AdminTab
            isUserOwner={isUserOwner}
            batchMintNumber={batchMintNumber}
            setBatchMintNumber={setBatchMintNumber}
            batchMintUri={batchMintUri}
            setBatchMintUri={setBatchMintUri}
            mintToAddress={mintToAddress}
            setMintToAddress={setMintToAddress}
            handleMintBatch={handleMintBatch}
            redeemTokenId={redeemTokenId}
            setRedeemTokenId={setRedeemTokenId}
            redeemEmissionId={redeemEmissionId}
            setRedeemEmissionId={setRedeemEmissionId}
            handleRedeem={handleRedeem}
            queriedTokenId={queriedTokenId}
            setQueriedTokenId={setQueriedTokenId}
            handleCheckTokenOwner={handleCheckTokenOwner}
            queriedTokenOwner={queriedTokenOwner}
            handleMarketplaceBalance={handleMarketplaceBalance}
            marketplaceCreditCount={marketplaceCreditCount}
            contractOwnerAddress={contractOwnerAddress}
            carbonCreditContract={carbonCreditContract}
            currentUserAddress={currentUserAddress}
            handleShowPopup={handleShowPopup}
            nodeRef={nodeRefs["admin"]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
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
      <style>{`
        .animated-btn {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .animated-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(0,0,0,0.15);
        }
        .fade-enter {
          opacity: 0.01;
        }
        .fade-enter.fade-enter-active {
          opacity: 1;
          transition: opacity 300ms ease-in;
        }
        .fade-exit {
          opacity: 1;
        }
        .fade-exit.fade-exit-active {
          opacity: 0.01;
          transition: opacity 300ms ease-in;
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div
          style={{
            width: isSidebarCollapsed ? "60px" : "250px",
            backgroundColor: "#e3f6f5",
            borderRight: "1px solid #ccc",
            transition: "width 0.3s ease",
            position: "relative"
          }}
        >
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
            className="btn btn-outline-secondary btn-sm animated-btn"
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
          <div style={{ marginTop: "60px" }}>
            <div
              className={`p-2 ${activeTab === "home" ? "bg-primary text-white" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("home")}
            >
              {isSidebarCollapsed ? (
                <img src={homeIcon} alt="Home" style={{ width: "24px" }} />
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
                  style={{ width: "24px" }}
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
                <img src={userIcon} alt="User" style={{ width: "24px" }} />
              ) : (
                "User"
              )}
            </div>
            <div
              className={`p-2 ${activeTab === "admin" ? "bg-primary text-white" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("admin")}
            >
              {isSidebarCollapsed ? (
                <img src={adminIcon} alt="Admin" style={{ width: "24px" }} />
              ) : (
                "Admin"
              )}
            </div>
          </div>
        </div>
        <div className="container py-4" style={{ flex: 1 }}>
          <h1 className="mb-4" style={{ textAlign: "center" }}>
            Carbon Credit Trading
          </h1>
          <TransitionGroup component={null}>
            <CSSTransition
              key={activeTab}
              nodeRef={nodeRefs[activeTab]}
              timeout={300}
              classNames="fade"
            >
              <div ref={nodeRefs[activeTab]} style={{ minHeight: "300px" }}>
                {renderTabContent()}
              </div>
            </CSSTransition>
          </TransitionGroup>
        </div>
      </div>
    </>
  );
}

function HomeTab({ setActiveTab, nodeRef }) {
  return (
    <div ref={nodeRef}>
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
            Invest in carbon credits to rescue our planet from impending doom!
            This is sustainability so next-level, your mind might just explode
            into glitter and unicorns.
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
      <div className="row">
        <div className="col-md-4 mb-4">
          <div
            className="card h-100"
            style={{ border: "3px solid #0dcaf0", transform: "rotate(-1deg)" }}
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
                Connect your wallet or create an account to begin.
              </p>
              <button
                className="btn btn-primary animated-btn"
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
            style={{ border: "3px solid #198754", transform: "rotate(1deg)" }}
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
                Explore our Marketplace to buy/sell carbon credits.
              </p>
              <button
                className="btn btn-success animated-btn"
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
            style={{ border: "3px solid #ffc107", transform: "rotate(-1deg)" }}
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
                Redeem credits to offset emissions and boost eco-karma!
              </p>
              <button
                className="btn btn-warning animated-btn"
                onClick={() => setActiveTab("admin")}
              >
                Redeem Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceTab({
  listings,
  listTokenId,
  setListTokenId,
  listPrice,
  setListPrice,
  buyTokenId,
  setBuyTokenId,
  buyOfferPrice,
  setBuyOfferPrice,
  fetchAllListings,
  handleListForSale,
  handleBuyCredit,
  nodeRef
}) {
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
    <div ref={nodeRef}>
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Active Listings</h3>
          <button
            className="btn btn-outline-light btn-sm animated-btn"
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
            Marketplace must own the NFT to list it. Transfer it there first!
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
            className="btn btn-primary animated-btn"
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
            Provide the ID of a listed token & your offer price.
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
          <button
            className="btn btn-success animated-btn"
            onClick={handleBuyCredit}
          >
            Buy Now
          </button>
        </div>
      </div>
      <PriceHistoryChart />
    </div>
  );
}

function UserTab({
  currentUserBalance,
  handleCheckUserBalance,
  ownerAddressQuery,
  setOwnerAddressQuery,
  handleGetTokensOfAddress,
  handleGetMarketplaceTokens,
  ownerTokens,
  currentUserAddress,
  nodeRef
}) {
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
    <div ref={nodeRef}>
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Check My XRPL Balance</h3>
        </div>
        <div style={fancyCardBody}>
          <button
            className="btn btn-info mb-2 animated-btn"
            onClick={handleCheckUserBalance}
          >
            Check Balance
          </button>
          <div>
            <label style={{ fontWeight: "bold" }}>Balance (XRPL):</label>
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
              className="btn btn-info animated-btn"
              onClick={handleGetTokensOfAddress}
            >
              Show Tokens
            </button>
            <button
              className="btn btn-secondary animated-btn"
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
    </div>
  );
}

function AdminTab({
  isUserOwner,
  batchMintNumber,
  setBatchMintNumber,
  batchMintUri,
  setBatchMintUri,
  mintToAddress,
  setMintToAddress,
  handleMintBatch,
  redeemTokenId,
  setRedeemTokenId,
  redeemEmissionId,
  setRedeemEmissionId,
  handleRedeem,
  queriedTokenId,
  setQueriedTokenId,
  handleCheckTokenOwner,
  queriedTokenOwner,
  handleMarketplaceBalance,
  marketplaceCreditCount,
  contractOwnerAddress,
  nodeRef,
  carbonCreditContract,
  currentUserAddress,
  handleShowPopup
}) {
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
  const [emissionRecords, setEmissionRecords] = useState([]);
  const [selectedTokenByEmission, setSelectedTokenByEmission] = useState({});
  const [userTokenIds, setUserTokenIds] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      Papa.parse(e.target.files[0], {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setEmissionRecords(results.data);
        },
        error: (err) => {
          console.error("Error parsing CSV:", err);
          handleShowPopup("Error!", "Failed to parse CSV file.");
        }
      });
    }
  };

  const handleSelectToken = (emissionId, tokenId) => {
    setSelectedTokenByEmission((prev) => ({
      ...prev,
      [emissionId]: tokenId
    }));
  };

  const handleRedeemForEmission = async (emissionId) => {
    try {
      const chosenToken = selectedTokenByEmission[emissionId];
      if (!chosenToken) {
        handleShowPopup("Error!", "Please select a carbon credit token.");
        return;
      }
      const tx = await carbonCreditContract.redeemCarbonCredit(chosenToken, emissionId);
      await tx.wait();
      handleShowPopup(
        "Redeemed",
        `Token #${chosenToken} was redeemed for emission: ${emissionId}`
      );
    } catch (err) {
      console.error(err);
      handleShowPopup(
        "Error!",
        `Failed to redeem for emission ${emissionId}.`
      );
    }
  };

  const handleRedeemAll = async () => {
    for (const record of emissionRecords) {
      const emissionId = record.emissionId;
      await handleRedeemForEmission(emissionId);
    }
  };

  const fetchUserTokens = async (address) => {
    if (!carbonCreditContract || !address) return;
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(address);
      setUserTokenIds(tokenIds.map((id) => id.toString()));
    } catch (err) {
      console.error("Error fetching user tokens:", err);
      handleShowPopup("Error!", "Could not fetch user's token IDs.");
    }
  };

  if (!isUserOwner) {
    return (
      <div ref={nodeRef} className="alert alert-danger">
        You do not have permission to view this section.
      </div>
    );
  }

  return (
    <div ref={nodeRef}>
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Mint Carbon Credits (Batch)</h3>
        </div>
        <div style={fancyCardBody}>
          <p className="text-muted">
            Enter how many credits to create, plus an optional address/URI.
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
          <button className="btn btn-primary animated-btn" onClick={handleMintBatch}>
            Mint Batch
          </button>
        </div>
      </div>
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Redeem a Carbon Credit</h3>
        </div>
        <div style={fancyCardBody}>
          <p className="text-muted">Provide the token ID & emission ID.</p>
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
          <button className="btn btn-primary animated-btn" onClick={handleRedeem}>
            Redeem
          </button>
        </div>
      </div>
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Check Owner of a Token</h3>
        </div>
        <div style={fancyCardBody}>
          <p className="text-muted">Enter a token ID below.</p>
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
            className="btn btn-info mb-2 animated-btn"
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
          <p className="text-muted">See how many credits marketplace holds.</p>
          <button
            className="btn btn-info mb-2 animated-btn"
            onClick={handleMarketplaceBalance}
          >
            Retrieve Balance
          </button>
          <div>
            <label style={{ fontWeight: "bold" }}>Marketplace Balance:</label>
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
      <div style={fancyCardStyle}>
        <div style={fancyCardHeader}>
          <h3 style={bigHeadingStyle}>Redeem Emissions from CSV</h3>
        </div>
        <div style={fancyCardBody}>
          <div className="mb-3">
            <label className="form-label">Upload Emission CSV:</label>
            <input
              type="file"
              className="form-control"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          <div className="mb-3">
            <button
              className="btn btn-secondary animated-btn"
              onClick={() => fetchUserTokens(currentUserAddress)}
            >
              Load My Carbon Credits
            </button>
          </div>
          {emissionRecords.length > 0 && (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Emission ID</th>
                  <th>Quantity (Tons)</th>
                  <th>Select Carbon Credit (Token ID)</th>
                  <th>Redeem Action</th>
                </tr>
              </thead>
              <tbody>
                {emissionRecords.map((record, idx) => {
                  const emissionId = record.emissionId;
                  const quantity = record.quantity;
                  return (
                    <tr key={idx}>
                      <td>{emissionId}</td>
                      <td>{quantity}</td>
                      <td>
                        <select
                          className="form-select"
                          value={selectedTokenByEmission[emissionId] || ""}
                          onChange={(e) =>
                            handleSelectToken(emissionId, e.target.value)
                          }
                        >
                          <option value="">-- Select Token --</option>
                          {userTokenIds.map((tid) => (
                            <option key={tid} value={tid}>
                              {tid}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary animated-btn"
                          onClick={() => handleRedeemForEmission(emissionId)}
                        >
                          Redeem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {emissionRecords.length > 0 && (
            <button className="btn btn-success mt-2 animated-btn" onClick={handleRedeemAll}>
              Redeem All Emissions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceHistoryChart() {
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
  const fancyCardStyle = {
    border: "2px solid #0dcaf0",
    backgroundColor: "#f0fcff",
    marginBottom: "25px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)"
  };
  const fancyCardHeader = {
    backgroundColor: "#20c997",
    color: "#fff",
    fontWeight: "700",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };
  const bigHeadingStyle = {
    color: "#034f84",
    fontWeight: "900",
    margin: 0
  };
  return (
    <div style={fancyCardStyle}>
      <div style={fancyCardHeader}>
        <h3 style={bigHeadingStyle}>Price History</h3>
        <small>(Line Chart)</small>
      </div>
      <div style={{ padding: "20px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default App;
