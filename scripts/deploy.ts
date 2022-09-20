import { ethers, upgrades } from "hardhat";

async function main() {
  const W3Bucket = await ethers.getContractFactory("W3Bucket");
  const contract = await upgrades.deployProxy(W3Bucket, ["IPFS Cloud Card", "ICC"]);
  console.log(`Deployed W3Bucket to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
