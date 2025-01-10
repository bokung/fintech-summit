// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract CarbonCredit is ERC721URIStorage, Ownable {
    struct CreditInfo {
        bool used;
        string usedOn;
    }

    mapping (uint256 => CreditInfo) public credits;
    uint256 public nextTokenId;

    constructor(address initialOwner) ERC721("CarbonCredit", "CREDIT") Ownable(initialOwner) {
        nextTokenId = 1;
    }

    function mintCarbonCreditsBatch(
        address to,
        uint256 numberOfCredits,
        string calldata baseTokenURI
    )
        external
        onlyOwner
    {
        require(numberOfCredits > 0, "Number of credits must be > 0");
        for (uint256 i = 0; i < numberOfCredits; i++) {
            uint256 currentTokenId = nextTokenId;
            _mintSingleCredit(to, currentTokenId, baseTokenURI);
            nextTokenId++;
        }
    }

    function _mintSingleCredit(
        address to,
        uint256 tokenId,
        string calldata uri
    )
        internal
    {
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        credits[tokenId] = CreditInfo({
            used: false,
            usedOn: ""
        });
    }

    function mintCarbonCredit(
        address to,
        uint256 tokenId,
        string calldata tokenURI
    )
        external
        onlyOwner
    {
        _mintSingleCredit(to, tokenId, tokenURI);
        if (tokenId >= nextTokenId) {
            nextTokenId = tokenId + 1;
        }
    }

    function redeemCarbonCredit(uint256 tokenId, string calldata emissionId) external {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner of this credit");
        require(!credits[tokenId].used, "Carbon credit already used");
        credits[tokenId].used = true;
        credits[tokenId].usedOn = emissionId;
    }

    function isUsed(uint256 tokenId) external view returns (bool) {
        return credits[tokenId].used;
    }

    function usedOnDetails(uint256 tokenId) external view returns (string memory) {
        return credits[tokenId].usedOn;
    }

    function getTokenIdsOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 idx = 0;
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (ownerOf(tokenId) == _owner) {
                tokenIds[idx] = tokenId;
                idx++;
                if (idx == balance) {
                    break;
                }
            }
        }
        return tokenIds;
    }

    function getTokenIdsInMarketplace(address marketplaceAddress) external view returns (uint256[] memory) {
        return this.getTokenIdsOfOwner(marketplaceAddress);
    }
}
