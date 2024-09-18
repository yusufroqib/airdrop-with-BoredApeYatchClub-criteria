import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

import { getProofAndRoot } from "../scripts/proofAndRoot";
import { BytesLike } from "ethers";

// SignerWithAddress
describe("TokenAirdropWithNFT", function () {
	async function deployToken() {
		const owner = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";
		const claimer1 = "0xF22742F06e4F6d68A8d0B49b9F270bB56affAB38";
		await helpers.impersonateAccount(owner);
		await helpers.impersonateAccount(claimer1);
		const ownerSigner = await ethers.getSigner(owner);
		const claimer1Signer = await ethers.getSigner(claimer1);

		const Rocco = await ethers.getContractFactory("Rocco");
		const roccoToken = await Rocco.connect(ownerSigner).deploy();
		return { roccoToken, ownerSigner, claimer1Signer };
	}

	async function deployTokenAirdropWithNFT() {
		const { roccoToken, ownerSigner, claimer1Signer } = await loadFixture(
			deployToken
		);
		const { rootHash } = await getProofAndRoot();
		const TokenAirdropWithNFT = await ethers.getContractFactory(
			"TokenAirdropWithNFT"
		);
		const tokenAirdropWithNFT = await TokenAirdropWithNFT.connect(
			ownerSigner
		).deploy(roccoToken, rootHash);
		return { roccoToken, tokenAirdropWithNFT, ownerSigner, claimer1Signer };
	}

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			const { roccoToken, tokenAirdropWithNFT, ownerSigner } =
				await loadFixture(deployTokenAirdropWithNFT);
			await deployTokenAirdropWithNFT();
			expect(await roccoToken.owner()).to.equal(ownerSigner.address);
		});
	});

	describe("Claim", function () {
		it("Should claim Airdrop", async function () {
			const { roccoToken, tokenAirdropWithNFT, ownerSigner, claimer1Signer } =
				await loadFixture(deployTokenAirdropWithNFT);
			const { proof } = await getProofAndRoot(claimer1Signer.address);
			const AirdropPool = ethers.parseUnits("10000", 18);
			await roccoToken
				.connect(ownerSigner)
				.transfer(tokenAirdropWithNFT, AirdropPool);
			const claimedAmt = ethers.parseUnits("100", 18);
			if (proof && proof?.length > 0)
				await tokenAirdropWithNFT.connect(claimer1Signer).claim(proof);
			expect(await roccoToken.balanceOf(claimer1Signer.address)).to.equal(
				claimedAmt
			);
		});
	});
});
