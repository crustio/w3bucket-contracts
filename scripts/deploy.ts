import { ethers, upgrades } from "hardhat";

async function main() {
  const IPFSCloudCard = await ethers.getContractFactory("IPFSCloudCard");
  const contract = await upgrades.deployProxy(IPFSCloudCard, ["IPFS Cloud Card", "ICC"]);
  console.log(`Deployed IPFSCloudCard to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
