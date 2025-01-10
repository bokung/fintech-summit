// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCredit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract CarbonCreditMarketplace is IERC721Receiver {
    CarbonCredit public carbonCreditContract;
    IERC20 public xrplToken;
    address public owner;

    mapping(uint256 => uint256) public creditsForSale;
    uint256[] private _listedTokens;
    mapping(uint256 => bool) private _isListed;

    struct MarketItem {
        uint256 tokenId;
        uint256 price;
    }

    event CreditListed(uint256 indexed tokenId, uint256 price);
    event CreditSold(uint256 indexed tokenId, address buyer, uint256 price);

    constructor(address carbonCreditAddress, address xrplTokenAddress) {
        carbonCreditContract = CarbonCredit(carbonCreditAddress);
        xrplToken = IERC20(xrplTokenAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function listCreditForSale(uint256 tokenId, uint256 price) external onlyOwner {
        require(
            carbonCreditContract.ownerOf(tokenId) == address(this),
            "Marketplace does not own this credit"
        );
        creditsForSale[tokenId] = price;
        if (!_isListed[tokenId]) {
            _listedTokens.push(tokenId);
            _isListed[tokenId] = true;
        }
        emit CreditListed(tokenId, price);
    }

    function buyCredit(uint256 tokenId, uint256 offerPrice) external {
        uint256 listingPrice = creditsForSale[tokenId];
        require(listingPrice > 0, "Credit not for sale");
        require(offerPrice >= listingPrice, "Offer price is too low");
        bool success = xrplToken.transferFrom(msg.sender, address(this), offerPrice);
        require(success, "XRPL token transfer failed");
        carbonCreditContract.safeTransferFrom(address(this), msg.sender, tokenId);
        creditsForSale[tokenId] = 0;
        _removeTokenFromList(tokenId);
        emit CreditSold(tokenId, msg.sender, offerPrice);
    }

    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(xrplToken.balanceOf(address(this)) >= amount, "Not enough XRPL tokens in contract");
        bool success = xrplToken.transfer(owner, amount);
        require(success, "Withdraw transfer failed");
    }

    function marketplaceBalance() external view returns (uint256) {
        return carbonCreditContract.balanceOf(address(this));
    }

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

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
