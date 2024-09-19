import { ethers } from "hardhat";
import fs from "fs";
import csv from "csv-parser";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { BytesLike } from "ethers";

const CSV_FILE_PATH = "airdrop/airdrop.csv";

export const getProofAndRoot = async (address?: string) => {
	return new Promise<{ rootHash: string; proof: BytesLike[]  }>(
		(resolve, reject) => {
			let rootHash: string;
			let proof: BytesLike[] = [];
			const leafNodes: Buffer[] = [];

			fs.createReadStream(CSV_FILE_PATH)
				.pipe(csv())
				.on("data", (row: { address: string }) => {
					const address = row.address;
					const leaf = keccak256(ethers.solidityPacked(["address"], [address]));
					leafNodes.push(leaf);
				})
				.on("end", () => {
					const merkleTree = new MerkleTree(leafNodes, keccak256, {
						sortPairs: true,
					});

					rootHash = merkleTree.getHexRoot();
					// console.log("Merkle Root:", rootHash);

					if (address) {
						const leaf = keccak256(
							ethers.solidityPacked(["address"], [address])
						);
						proof = merkleTree.getHexProof(leaf);
						// console.log("Proof:", proof);
					}

					resolve({ rootHash, proof }); // Resolving the promise with rootHash and proof
				})
				.on("error", (error) => {
					reject(error); // In case there's an error while reading the file
				});
		}
	);
};

// const run = async () => {
// 	try {
// 		const res = await getProofAndRoot();
// 		console.log(res);
// 	} catch (error) {
// 		console.error("Error:", error);
// 	}
// };

// run();
