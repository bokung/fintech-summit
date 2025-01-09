import { ethers } from "hardhat";

async function main() {
  // Get the deployer's address
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the CarbonCredit contract first
  const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
  const carbonCredit = await CarbonCredit.deploy(deployer.address);
  await carbonCredit.waitForDeployment();
  
  const carbonCreditAddress = await carbonCredit.getAddress();
  console.log("CarbonCredit deployed to:", carbonCreditAddress);

  // For this example, we'll assume you have a mock XRPL token deployed
  // In practice, you would either:
  // 1. Deploy a new mock XRPL token for testing
  // 2. Use an existing XRPL token address on mainnet
  // Here's how to deploy a mock token (uncomment if needed):
  /*
  const MockXRPL = await ethers.getContractFactory("MockXRPL");
  const mockXRPL = await MockXRPL.deploy();
  await mockXRPL.waitForDeployment();
  const xrplTokenAddress = await mockXRPL.getAddress();
  */
  // For now, we'll use a placeholder address - replace this with your actual XRPL token address
  const xrplTokenAddress = "0x39fBBABf11738317a448031930706cd3e612e1B9"; // Replace with actual address

  // Deploy the CarbonCreditMarketplace contract
  const CarbonCreditMarketplace = await ethers.getContractFactory("CarbonCreditMarketplace");
  const marketplace = await CarbonCreditMarketplace.deploy(
    carbonCreditAddress,
    xrplTokenAddress
  );
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("CarbonCreditMarketplace deployed to:", marketplaceAddress);

  console.log("Deployment completed!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});