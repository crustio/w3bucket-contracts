import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployIPFSCloudCardFixture } from "./utils";

describe("Access Control", () => {

  it("Pausable", async () => {
    const { ipfsCloudCard, Alice, Bob, Caro } = await loadFixture(deployIPFSCloudCardFixture);

    const tokenId = 0;
    await expect(ipfsCloudCard.safeMint(Bob.address))
      .to.emit(ipfsCloudCard, 'Transfer')
      .withArgs(anyValue, Bob.address, tokenId);
    
    await expect(ipfsCloudCard.connect(Bob).transferFrom(Bob.address, Caro.address, tokenId))
      .not.to.be.reverted;

    await expect(ipfsCloudCard.pause())
      .not.to.be.reverted;
    
    await expect(ipfsCloudCard.connect(Alice).safeMint(Bob.address))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to mint tokens after paused'
      );
    await expect(ipfsCloudCard.connect(Caro).transferFrom(Caro.address, Bob.address, tokenId))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to transfer tokens after paused'
      );
    await expect(ipfsCloudCard.connect(Caro).burn(tokenId))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to burn tokens after paused'
      );
    
    await expect(ipfsCloudCard.unpause())
      .not.to.be.reverted;
  });

  it("Mint Role", async () => {
    const { ipfsCloudCard, Alice, Bob, Caro } = await loadFixture(deployIPFSCloudCardFixture);

    await expect(ipfsCloudCard.connect(Bob).safeMint(Bob.address))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to mint tokens'
      );

    const minterRole = await ipfsCloudCard.MINTER_ROLE();
    await expect(ipfsCloudCard.grantRole(minterRole, Bob.address))
      .not.to.be.reverted;
    await expect(ipfsCloudCard.connect(Bob).safeMint(Bob.address))
      .not.to.be.reverted;

    await expect(ipfsCloudCard.connect(Bob).renounceRole(minterRole, Bob.address))
      .not.to.be.reverted;
    await expect(ipfsCloudCard.connect(Bob).safeMint(Bob.address))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to mint tokens after renouncing MINTER_ROLE'
      );

    await expect(ipfsCloudCard.grantRole(minterRole, Caro.address))
      .not.to.be.reverted;
    await expect(ipfsCloudCard.connect(Caro).safeMint(Caro.address))
      .not.to.be.reverted;
    await expect(ipfsCloudCard.connect(Alice).revokeRole(minterRole, Caro.address))
      .not.to.be.reverted;
    await expect(ipfsCloudCard.connect(Caro).safeMint(Caro.address))
      .to.be.rejectedWith(
        /AccessControl/,
        'Caro should not be able to mint tokens after MINTER_ROLE is revoked'
      );
  });

});