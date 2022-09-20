import { ethers, upgrades } from "hardhat";

export async function deployW3BucketFixture() {
  const W3Bucket = await ethers.getContractFactory("W3Bucket");
  const w3Bucket = await upgrades.deployProxy(W3Bucket, ["IPFS Cloud Card", "ICC"]);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  return { w3Bucket, Alice, Bob, Caro, Dave };
}