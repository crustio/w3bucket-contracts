import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, upgrades } from "hardhat";
import { deployIPFSCloudCardFixture } from "./utils";

describe("Upgradable", () => {
  it('Upgradable', async () => {
    const { ipfsCloudCard, Alice, Bob } = await loadFixture(deployIPFSCloudCardFixture);

    const tokenId = 0;
    await expect(ipfsCloudCard.safeMint(Bob.address))
      .to.emit(ipfsCloudCard, 'Transfer')
      .withArgs(anyValue, Bob.address, tokenId);

    expect(await ipfsCloudCard.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be minted to Bob');

    const TestIPFSCloudCardV2 = await ethers.getContractFactory("TestIPFSCloudCardV2");
    const ipfscloudcardV2 = await upgrades.upgradeProxy(ipfsCloudCard.address, TestIPFSCloudCardV2);

    expect(ipfscloudcardV2.address).to.equal(ipfsCloudCard.address, 'Should keep same address after upgrade');
    expect(await ipfscloudcardV2.ownerOf(tokenId)).to.equal(Bob.address, `Bob's token should be kept after upgrade`);
    expect(await ipfscloudcardV2.tokenURI(tokenId)).to.equal(`https://api.ipfs.studio/ipfscloudcardv2/${tokenId}`, 'Upgraded logic contract works');
  })
});