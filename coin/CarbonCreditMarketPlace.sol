// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract CarbonCreditMarketplace is IERC721Receiver {

    CarbonCredit public carbonCreditContract;
    address public owner;

    // Mapping of tokenId to its sale price (0 means not for sale)
    mapping(uint256 => uint256) public creditsForSale;

    // Events
    event CreditListed(uint256 indexed tokenId, uint256 price);
    event CreditSold(uint256 indexed tokenId, address buyer, uint256 price);

    constructor(address carbonCreditAddress) {
        carbonCreditContract = CarbonCredit(carbonCreditAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    /**
     * @notice List a carbon credit for sale.
     * @param tokenId The ID of the carbon credit NFT.
     * @param price The price in wei.
     */
    function listCreditForSale(uint256 tokenId, uint256 price) external onlyOwner {
        require(carbonCreditContract.ownerOf(tokenId) == address(this), "Marketplace does not own this credit");
        creditsForSale[tokenId] = price;
        emit CreditListed(tokenId, price);
    }

    /**
     * @notice Purchase a carbon credit from the marketplace.
     * @param tokenId The ID of the carbon credit NFT.
     */
    function buyCredit(uint256 tokenId) external payable {
        uint256 price = creditsForSale[tokenId];
        require(price > 0, "Credit not for sale");
        require(msg.value == price, "Incorrect payment");

        // Transfer the NFT to the buyer
        carbonCreditContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Remove from sale
        creditsForSale[tokenId] = 0;

        emit CreditSold(tokenId, msg.sender, price);
    }

    /**
     * @notice Withdraw funds from sales.
     */
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Get the balance of the marketplace.
     */
    function marketplaceBalance() external view returns (uint256) {
        return carbonCreditContract.balanceOf(address(this));
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        // By returning this selector, you’re “telling” the ERC721 contract
        // that your marketplace contract can handle receiving ERC721 tokens.
        return IERC721Receiver.onERC721Received.selector;
    }
}
