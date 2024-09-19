// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

contract TokenAirdropWithNFT {
    IERC20 public immutable token;
    IERC721Enumerable public constant boredApeYatchClub =
        IERC721Enumerable(0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D);
    bytes32 public immutable merkleRoot;
    uint256 public constant claimableAmt = 100e18;

    address owner;

    mapping(address => bool) public claimed;
    mapping(uint256 => bool) public usedNFTIds;

    event ClaimSucceful(address indexed claimer, uint256 amount);

    constructor(IERC20 _token, bytes32 _merkleRoot) {
        owner = msg.sender;
        token = _token;
        merkleRoot = _merkleRoot;
    }

    function claim(bytes32[] calldata _merkleProof) external {
        require(!claimed[msg.sender], "Already claimed");
        require(
            canClaim(msg.sender, _merkleProof),
            "TokenAirdrop: Address is invalid for claim"
        );
        uint256 contractBalance = token.balanceOf(address(this));
        uint foundNFTId = boredApeYatchClub.tokenOfOwnerByIndex(msg.sender, 0);

        require(
            contractBalance >= claimableAmt,
            "insufficient contract balance"
        );
        usedNFTIds[foundNFTId] = true;
        claimed[msg.sender] = true;
        token.transfer(msg.sender, claimableAmt);
        emit ClaimSucceful(msg.sender, claimableAmt);
    }

    function canClaim(
        address _claimer,
        bytes32[] calldata merkleProof
    ) public view returns (bool) {
        require((boredApeYatchClub.balanceOf(_claimer) >= 1), "No NFT found");
        uint foundNFTId = boredApeYatchClub.tokenOfOwnerByIndex(_claimer, 0);
        return
            !usedNFTIds[foundNFTId] &&
            !claimed[_claimer] &&
            MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(_claimer))
            );
    }

    function checkContractBalance()
        external
        view
        returns (uint256 contractBalance_)
    {
        require(msg.sender != address(0), "Zero address detected");
        require(msg.sender == owner, "Only owner can perform this action");
        contractBalance_ = token.balanceOf(address(this));
    }

    function withdrawLeftOver() external {
        require(msg.sender == owner, "Only owner can perform this action");
        require(msg.sender != address(0), "Zero address detected");
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance > 0, "insufficient amount");
        token.transfer(owner, contractBalance);
    }
}
