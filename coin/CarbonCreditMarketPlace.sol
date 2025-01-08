// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract CarbonCreditMarketplace is IERC721Receiver {

    CarbonCredit public carbonCreditContract;
    address public owner;

    // Mapping of tokenId => sale price. 0 means not for sale.
    mapping(uint256 => uint256) public creditsForSale;

    // Keep track of which tokenIds are “actively” listed (price > 0).
    // This helps us iterate to build a list of current listings.
    uint256[] private _listedTokens;
    // We'll also use a secondary mapping for quick “is listed” checks
    // so we can safely remove from _listedTokens, etc.
    mapping(uint256 => bool) private _isListed;

    // Used in getAllListings to return structured data
    struct MarketItem {
        uint256 tokenId;
        uint256 price;
    }

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
     * @param price The minimum price (in wei).
     */
    function listCreditForSale(uint256 tokenId, uint256 price) external onlyOwner {
        require(carbonCreditContract.ownerOf(tokenId) == address(this),
            "Marketplace does not own this credit"
        );

        creditsForSale[tokenId] = price;

        // If it’s newly listed, add to _listedTokens
        if (!_isListed[tokenId]) {
            _listedTokens.push(tokenId);
            _isListed[tokenId] = true;
        }

        emit CreditListed(tokenId, price);
    }

    /**
     * @notice Buy a carbon credit from the marketplace by making an offer.
     * @dev The buyer sends `offerPrice` in `msg.value`.
     *      If `offerPrice >= creditsForSale[tokenId]`, the sale is accepted automatically.
     * @param tokenId The ID of the carbon credit NFT.
     * @param offerPrice The amount (in wei) the buyer is offering to pay.
     */
    function buyCredit(uint256 tokenId, uint256 offerPrice) external payable {
        uint256 listingPrice = creditsForSale[tokenId];
        require(listingPrice > 0, "Credit not for sale");
        require(offerPrice >= listingPrice, "Offer price is too low");

        // Transfer the NFT to the buyer
        carbonCreditContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Mark it as no longer for sale
        creditsForSale[tokenId] = 0;

        // Remove tokenId from the active listings array
        _removeTokenFromList(tokenId);

        emit CreditSold(tokenId, msg.sender, offerPrice);
    }

    /**
     * @notice Withdraw all marketplace funds (ETH) to the owner.
     */
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Returns how many NFTs the marketplace currently holds (regardless of listing status).
     */
    function marketplaceBalance() external view returns (uint256) {
        return carbonCreditContract.balanceOf(address(this));
    }

    /**
     * @notice View function to get all active listings sorted by price (ascending).
     * @dev Sorting on-chain can be expensive, but since this is a view function,
     *      you can call it off-chain for free (except for node resources).
     */
    function getAllListingsSortedByPrice() external view returns (MarketItem[] memory) {
        // First, build an array of the items that are actually for sale (price > 0).
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
                items[index] = MarketItem({
                    tokenId: tid,
                    price: p
                });
                index++;
            }
        }

        // Now sort the MarketItem[] by price ascending
        _sortMarketItemsByPrice(items);

        return items;
    }

    /**
     * @notice Remove a token from the _listedTokens array (i.e., once sold or delisted).
     */
    function _removeTokenFromList(uint256 tokenId) internal {
        // Mark not listed
        _isListed[tokenId] = false;

        // Find it in _listedTokens; remove it by swapping with the last, then pop.
        for (uint256 i = 0; i < _listedTokens.length; i++) {
            if (_listedTokens[i] == tokenId) {
                _listedTokens[i] = _listedTokens[_listedTokens.length - 1];
                _listedTokens.pop();
                break;
            }
        }
    }

    /**
     * @notice Simple in-memory insertion sort of MarketItem[] by ascending price.
     */
    function _sortMarketItemsByPrice(MarketItem[] memory items) internal pure {
        // Insertion sort
        for (uint256 i = 1; i < items.length; i++) {
            MarketItem memory current = items[i];
            uint256 j = i;
            // Move elements of items[0..i-1], that are greater than current.price, to one position ahead.
            while (j > 0 && items[j - 1].price > current.price) {
                items[j] = items[j - 1];
                j--;
            }
            items[j] = current;
        }
    }

    /**
     * @notice ERC721Receiver callback function. Required for safeTransferFrom to this contract.
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
