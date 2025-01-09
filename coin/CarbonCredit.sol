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
     * @notice Tracks the next token ID to be minted.
     *         This increments each time a credit is minted, so IDs are auto-generated.
     */
    uint256 public nextTokenId;

    /**
     * @dev Sets name and symbol for the NFT collection and initializes the owner.
     * @param initialOwner The address of the initial owner.
     */
    constructor(address initialOwner) ERC721("CarbonCredit", "CREDIT") Ownable(initialOwner) {
        // Owner (deployer) can act as the “environment agency” or registry by default.
        // Optionally start counting at 1 (instead of 0) for user-friendliness.
        nextTokenId = 1;
    }

    /**
     * @notice Mint multiple carbon credits in one transaction. The IDs are auto-generated.
     * @param to The recipient of these new carbon credits.
     * @param numberOfCredits How many credits to mint.
     * @param baseTokenURI Optionally set a URI or URI base for the minted tokens.
     *                     If you want each credit to have a unique URI, you could pass
     *                     an empty string here and set them individually later.
     */
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

            // Mint a single credit
            _mintSingleCredit(to, currentTokenId, baseTokenURI);

            // Increment the token ID tracker for the next credit
            nextTokenId++;
        }
    }

    /**
     * @dev Internal helper to do the actual minting and state initialization.
     */
    function _mintSingleCredit(
        address to,
        uint256 tokenId,
        string calldata uri
    )
        internal
    {
        // Mint the NFT.
        _safeMint(to, tokenId);

        // Optionally set a tokenURI with details about the credit.
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }

        // Initialize the credit as unused.
        credits[tokenId] = CreditInfo({
            used: false,
            usedOn: ""
        });
    }

    // ------------------------------------------------------------------------
    // (Optional) Legacy single-credit mint function
    // ------------------------------------------------------------------------
    /**
     * @notice Mint a single carbon credit NFT, specifying exact `tokenId` manually.
     * @dev This remains for backward compatibility. Feel free to remove if not needed.
     *
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
        _mintSingleCredit(to, tokenId, tokenURI);

        // If manually provided tokenId is >= nextTokenId,
        // ensure nextTokenId doesn't step backwards.
        if (tokenId >= nextTokenId) {
            nextTokenId = tokenId + 1;
        }
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
