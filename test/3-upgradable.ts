import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, upgrades } from "hardhat";
import { deployW3BucketFixture } from "./utils";

describe("Upgradable", () => {
  it('Upgradable', async () => {
    const { w3Bucket, Alice, Bob } = await loadFixture(deployW3BucketFixture);

    const tokenId = 0;
    await expect(w3Bucket.safeMint(Bob.address, ''))
      .to.emit(w3Bucket, 'Transfer')
      .withArgs(anyValue, Bob.address, tokenId);

    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be minted to Bob');

    const TestW3BucketV2 = await ethers.getContractFactory("TestW3BucketV2");
    const ipfscloudcardV2 = await upgrades.upgradeProxy(w3Bucket.address, TestW3BucketV2);

    expect(ipfscloudcardV2.address).to.equal(w3Bucket.address, 'Should keep same address after upgrade');
    expect(await ipfscloudcardV2.ownerOf(tokenId)).to.equal(Bob.address, `Bob's token should be kept after upgrade`);
    expect(await ipfscloudcardV2.tokenURI(tokenId)).to.equal(`https://api.ipfs.studio/w3bucketv2/${tokenId}`, 'Upgraded logic contract works');
  })
});