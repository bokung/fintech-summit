// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title CarbonCreditMarketplace
 * @dev A marketplace that only accepts a wrapped XRPL ERC-20 token for buying carbon credits.
 *
 * NOTE: This assumes you have an ERC-20 token contract that represents XRPL in the Ethereum ecosystem.
 *       Buyers must "approve" this contract to spend their XRPL tokens before calling `buyCredit`.
 */
contract CarbonCreditMarketplace is IERC721Receiver {

    CarbonCredit public carbonCreditContract;  // The NFT contract
    IERC20 public xrplToken;                   // The ERC-20 token representing XRPL on Ethereum
    address public owner;

    // Mapping of tokenId => sale price in XRPL tokens. 0 => not for sale.
    mapping(uint256 => uint256) public creditsForSale;

    // Keep track of which tokenIds are “actively” listed (price > 0).
    uint256[] private _listedTokens;
    mapping(uint256 => bool) private _isListed;

    // Used in getAllListings to return structured data
    struct MarketItem {
        uint256 tokenId;
        uint256 price;
    }

    // Events
    event CreditListed(uint256 indexed tokenId, uint256 price);
    event CreditSold(uint256 indexed tokenId, address buyer, uint256 price);

    /**
     * @param carbonCreditAddress The address of the deployed CarbonCredit NFT contract.
     * @param xrplTokenAddress The address of the ERC-20 "XRPL" token contract.
     */
    constructor(address carbonCreditAddress, address xrplTokenAddress) {
        carbonCreditContract = CarbonCredit(carbonCreditAddress);
        xrplToken = IERC20(xrplTokenAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    /**
     * @notice List a carbon credit for sale in XRPL tokens.
     * @param tokenId The ID of the carbon credit NFT.
     * @param price The minimum price (in XRPL tokens).
     */
    function listCreditForSale(uint256 tokenId, uint256 price) external onlyOwner {
        // Marketplace must own the NFT to sell it
        require(
            carbonCreditContract.ownerOf(tokenId) == address(this),
            "Marketplace does not own this credit"
        );

        creditsForSale[tokenId] = price;

        // If it's newly listed, track it
        if (!_isListed[tokenId]) {
            _listedTokens.push(tokenId);
            _isListed[tokenId] = true;
        }

        emit CreditListed(tokenId, price);
    }

    /**
     * @notice Buy a carbon credit using XRPL tokens.
     * @dev The buyer must have approved this marketplace to spend `offerPrice` XRPL tokens beforehand.
     * @param tokenId The ID of the carbon credit NFT.
     * @param offerPrice The amount (in XRPL tokens) the buyer is offering to pay.
     */
    function buyCredit(uint256 tokenId, uint256 offerPrice) external {
        uint256 listingPrice = creditsForSale[tokenId];
        require(listingPrice > 0, "Credit not for sale");
        require(offerPrice >= listingPrice, "Offer price is too low");

        // Transfer XRPL tokens from the buyer to this contract
        bool success = xrplToken.transferFrom(msg.sender, address(this), offerPrice);
        require(success, "XRPL token transfer failed");

        // Transfer the NFT to the buyer
        carbonCreditContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Remove the sale listing
        creditsForSale[tokenId] = 0;
        _removeTokenFromList(tokenId);

        emit CreditSold(tokenId, msg.sender, offerPrice);
    }

    /**
     * @notice Withdraw XRPL tokens from the contract to the owner.
     * @param amount The amount of XRPL tokens to withdraw.
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(xrplToken.balanceOf(address(this)) >= amount, "Not enough XRPL tokens in contract");

        bool success = xrplToken.transfer(owner, amount);
        require(success, "Withdraw transfer failed");
    }

    /**
     * @notice Returns how many NFTs the marketplace currently holds (regardless of listing status).
     */
    function marketplaceBalance() external view returns (uint256) {
        return carbonCreditContract.balanceOf(address(this));
    }

    /**
     * @notice View function to get all active listings sorted by price (ascending).
     * @dev Sorting on-chain can be expensive, but it is a view function so no gas cost to the caller.
     */
    function getAllListingsSortedByPrice() external view returns (MarketItem[] memory) {
        uint256 activeCount;
        for (uint256 i = 0; i < _listedTokens.length; i++) {
            if (creditsForSale[_listedTokens[i]] > 0) {
                activeCount++;
            }
        }

        MarketItem[] memory items = new MarketItem[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < _listedTokens.length; i++) {
            uint256 tid = _listedTokens[i];
            uint256 p = creditsForSale[tid];
            if (p > 0) {
                items[index] = MarketItem({ tokenId: tid, price: p });
                index++;
            }
        }

        _sortMarketItemsByPrice(items);
        return items;
    }

    /**
     * @dev Internal function to remove a token from the _listedTokens array once sold/delisted.
     */
    function _removeTokenFromList(uint256 tokenId) internal {
        _isListed[tokenId] = false;

        for (uint256 i = 0; i < _listedTokens.length; i++) {
            if (_listedTokens[i] == tokenId) {
                _listedTokens[i] = _listedTokens[_listedTokens.length - 1];
                _listedTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Simple in-memory insertion sort of MarketItem[] by ascending price.
     */
    function _sortMarketItemsByPrice(MarketItem[] memory items) internal pure {
        for (uint256 i = 1; i < items.length; i++) {
            MarketItem memory current = items[i];
            uint256 j = i;
            while (j > 0 && items[j - 1].price > current.price) {
                items[j] = items[j - 1];
                j--;
            }
            items[j] = current;
        }
    }

    /**
     * @notice Required callback for receiving ERC-721 tokens via safeTransferFrom.
     */
    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint256 /*tokenId*/,
        bytes calldata /*data*/
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
