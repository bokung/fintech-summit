// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title CarbonCredit
 * @dev A simple ERC-721 NFT contract representing carbon credits.
 * 
 * Each carbon credit has metadata tracking whether the credit is used
 * and, if used, on which emission (identified by a string, e.g., hash).
 * 
 * Once used, a carbon credit cannot be reverted to unused.
 */
contract CarbonCredit is ERC721URIStorage, Ownable {

    /// @dev Stores whether the carbon credit has been used and the usage info (emission hash, etc.)
    struct CreditInfo {
        bool used;             // Whether this carbon credit has been redeemed/used.
        string usedOn;         // Identifier of the emission or the ton-hash for which it was used.
    }

    /// @notice Maps tokenId => credit info
    mapping (uint256 => CreditInfo) public credits;

    /**
     * @dev Sets name and symbol for the NFT collection and initializes the owner.
     * @param initialOwner The address of the initial owner.
     */
    constructor(address initialOwner) ERC721("CarbonCredit", "CREDIT") Ownable(initialOwner) {
        // Owner (deployer) can act as the “environment agency” or registry by default.
    }

    /**
     * @notice Mint a new carbon credit NFT to `to`.
     * @param to Recipient of this new carbon credit.
     * @param tokenId Unique ID for this NFT (must not already exist).
     * @param tokenURI Metadata URI describing the credit (optional, e.g., IPFS link).
     */
    function mintCarbonCredit(
        address to,
        uint256 tokenId,
        string calldata tokenURI
    )
        external
        onlyOwner
    {
        // Mint the NFT.
        _safeMint(to, tokenId);

        // Optionally set a tokenURI with details about the credit.
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        // Initialize it as unused.
        credits[tokenId] = CreditInfo({
            used: false,
            usedOn: ""
        });
    }

    /**
     * @notice Redeem (use) a carbon credit to offset an emission.
     * @param tokenId The ID of the carbon credit NFT.
     * @param emissionId A string identifying the emission (e.g., a ton-hash).
     */
    function redeemCarbonCredit(uint256 tokenId, string calldata emissionId) external {
        // Must be the owner of this credit to redeem it.
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner of this credit");
        // Must not already be used.
        require(!credits[tokenId].used, "Carbon credit already used");

        // Mark the credit as used.
        credits[tokenId].used = true;
        credits[tokenId].usedOn = emissionId;
    }

    /**
     * @notice Return whether a particular token is used.
     * @param tokenId The ID of the carbon credit NFT.
     */
    function isUsed(uint256 tokenId) external view returns (bool) {
        return credits[tokenId].used;
    }

    /**
     * @notice Return the emission-id / usedOn field for a used credit.
     * @param tokenId The ID of the carbon credit NFT.
     */
    function usedOnDetails(uint256 tokenId) external view returns (string memory) {
        return credits[tokenId].usedOn;
    }
}
