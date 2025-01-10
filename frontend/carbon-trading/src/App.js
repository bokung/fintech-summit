import React, { useState, useEffect } from "react";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits,
  formatEther
} from "ethers";
import "bootstrap/dist/css/bootstrap.min.css";
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
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

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
  const [activeTab, setActiveTab] = useState("home");

  const isUserOwner =
    currentUserAddress &&
    contractOwnerAddress &&
    currentUserAddress.toLowerCase() === contractOwnerAddress.toLowerCase();

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        console.error("MetaMask (or another Ethereum provider) not detected!");
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
        console.error("Error initializing contracts or wallet:", err);
      }
    };

    init();
  }, []);

  // Handler functions
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

  const handleCheckUserBalance = async () => {
    if (!provider || !signer) return;
    try {
      const userAddr = await signer.getAddress();
      const bal = await provider.getBalance(userAddr);
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
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(ownerAddressQuery);
      setOwnerTokens(tokenIds.map((id) => id.toString()));
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for that address.");
    }
  };

  const handleGetMarketplaceTokens = async () => {
    if (!carbonCreditContract) return;
    try {
      const tokenIds = await carbonCreditContract.getTokenIdsOfOwner(MARKETPLACE_ADDRESS);
      setOwnerTokens(tokenIds.map((id) => id.toString()));
    } catch (err) {
      console.error(err);
      alert("Error retrieving tokens for the marketplace.");
    }
  };

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        overflow: "hidden",
        backgroundColor: darkMode ? "#121212" : "#ffffff",
        color: darkMode ? "white" : "black"
      }}
    >
      {/* Side Navigation Panel */}
      <div
        style={{
          width: isSidebarCollapsed ? "60px" : "250px",
          backgroundColor: darkMode ? "#333" : "#f8f9fa",
          borderRight: "1px solid #ddd",
          transition: "width 0.3s ease",
          position: "relative",
          color: darkMode ? "white" : "black"
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
          className="btn btn-outline-secondary btn-sm"
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
              <img src={homeIcon} alt="Home" style={{ width: "24px", height: "24px" }} />
            ) : (
              "Home"
            )}
          </div>
          <div
            className={`p-2 ${activeTab === "marketplace" ? "bg-primary text-white" : ""}`}
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
              <img src={userIcon} alt="User" style={{ width: "24px", height: "24px" }} />
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
              <img src={adminIcon} alt="Admin" style={{ width: "24px", height: "24px" }} />
            ) : (
              "Admin"
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="container py-4"
        style={{
          flex: 1,
          backgroundColor: darkMode ? "#121212" : "#ffffff",
          color: darkMode ? "white" : "black"
        }}
      >
        <h1 className="mb-4" style={{ textAlign: "center" }}>
          Carbon Credit Trading
        </h1>

        {/* Dark Mode Toggle Button */}
        <div className="d-flex justify-content-end mb-3">
          <button className="btn btn-secondary" onClick={toggleDarkMode}>
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </div>

        {/* HOME TAB CONTENT */}
        {activeTab === "home" && (
          <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
            <div className="card-body">
              <h2>Welcome to the Carbon Credit Trading App</h2>
              <p>This is the home page.</p>
            </div>
          </div>
        )}

        {/* MARKETPLACE TAB CONTENT */}
        {activeTab === "marketplace" && (
          <>
            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
              <div className="card-header">List Carbon Credit for Sale</div>
              <div className="card-body">
                <p className="text-muted">
                  (Marketplace contract must currently own the NFT if you want to list it.)
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

            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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

            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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

            <PriceHistoryChart darkMode={darkMode} />
          </>
        )}

        {/* USER TAB CONTENT */}
        {activeTab === "user" && (
          <>
            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
              <div className="card-header">Check My ETH Balance</div>
              <div className="card-body">
                <button className="btn btn-info mb-2" onClick={handleCheckUserBalance}>
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

            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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

            <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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
        {activeTab === "admin" && (
          isUserOwner ? (
            <>
              <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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

              <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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

              <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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
                  <button className="btn btn-info mb-2" onClick={handleCheckTokenOwner}>
                    Check Owner
                  </button>
                  <div>
                    <label>Owner of Token #{queriedTokenId}:</label>
                    <div>{queriedTokenOwner || "Not fetched yet"}</div>
                  </div>
                </div>
              </div>

              <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
                <div className="card-header">Get Marketplace Balance</div>
                <div className="card-body">
                  <button className="btn btn-info mb-2" onClick={handleMarketplaceBalance}>
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

              <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
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
          )
        )}
      </div>
    </div>
  );
}

function PriceHistoryChart({ darkMode }) {
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
        text: "Price History of Carbon Credits",
        color: darkMode ? "white" : "black"
      },
      legend: {
        labels: {
          color: darkMode ? "white" : "black"
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Price (XRPL)",
          color: darkMode ? "white" : "black"
        },
        ticks: {
          color: darkMode ? "white" : "black"
        }
      },
      x: {
        title: {
          display: true,
          text: "Date",
          color: darkMode ? "white" : "black"
        },
        ticks: {
          color: darkMode ? "white" : "black"
        }
      }
    }
  };

  return (
    <div className={`card mb-4 ${darkMode ? "bg-dark text-light" : ""}`}>
      <div className="card-header">Price History (Line Chart)</div>
      <div className="card-body">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default App;
