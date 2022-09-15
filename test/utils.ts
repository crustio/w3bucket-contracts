import { ethers, upgrades } from "hardhat";

export async function deployIPFSCloudCardFixture() {
  const IPFSCloudCard = await ethers.getContractFactory("IPFSCloudCard");
  const ipfsCloudCard = await upgrades.deployProxy(IPFSCloudCard, ["IPFS Cloud Card", "ICC"]);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  return { ipfsCloudCard, Alice, Bob, Caro, Dave };
}