import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployW3BucketFixture } from "./utils";

describe("Access Control", () => {

  it("Pausable", async () => {
    const { w3Bucket, Alice, Bob, Caro } = await loadFixture(deployW3BucketFixture);

    const tokenId = 0;
    await expect(w3Bucket.safeMint(Bob.address, 'ipfs://'))
      .to.emit(w3Bucket, 'Transfer')
      .withArgs(anyValue, Bob.address, tokenId);
    
    await expect(w3Bucket.connect(Bob).transferFrom(Bob.address, Caro.address, tokenId))
      .not.to.be.reverted;

    await expect(w3Bucket.pause())
      .not.to.be.reverted;
    
    await expect(w3Bucket.connect(Alice).safeMint(Bob.address, 'ipfs://'))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to mint tokens after paused'
      );
    await expect(w3Bucket.connect(Caro).transferFrom(Caro.address, Bob.address, tokenId))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to transfer tokens after paused'
      );
    await expect(w3Bucket.connect(Caro).burn(tokenId))
      .to.be.rejectedWith(
        /Pausable: paused/,
        'Should not be able to burn tokens after paused'
      );
    
    await expect(w3Bucket.unpause())
      .not.to.be.reverted;
  });

  it("Mint Role", async () => {
    const { w3Bucket, Alice, Bob, Caro } = await loadFixture(deployW3BucketFixture);

    await expect(w3Bucket.connect(Bob).safeMint(Bob.address, 'ipfs://'))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to mint tokens'
      );

    const minterRole = await w3Bucket.MINTER_ROLE();
    const initMinterRoleMemberCount = (await w3Bucket.getRoleMemberCount(minterRole)).toNumber();
    await expect(w3Bucket.grantRole(minterRole, Bob.address))
      .not.to.be.reverted;
    await expect(w3Bucket.connect(Bob).safeMint(Bob.address, 'ipfs://'))
      .not.to.be.reverted;
    expect((await w3Bucket.getRoleMemberCount(minterRole)).toNumber())
      .to.equal(initMinterRoleMemberCount + 1);
    

    await expect(w3Bucket.connect(Bob).renounceRole(minterRole, Bob.address))
      .not.to.be.reverted;
    await expect(w3Bucket.connect(Bob).safeMint(Bob.address, 'ipfs://'))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to mint tokens after renouncing MINTER_ROLE'
      );

    await expect(w3Bucket.grantRole(minterRole, Caro.address))
      .not.to.be.reverted;
    await expect(w3Bucket.connect(Caro).safeMint(Caro.address, 'ipfs://'))
      .not.to.be.reverted;
    await expect(w3Bucket.connect(Alice).revokeRole(minterRole, Caro.address))
      .not.to.be.reverted;
    await expect(w3Bucket.connect(Caro).safeMint(Caro.address, 'ipfs://'))
      .to.be.rejectedWith(
        /AccessControl/,
        'Caro should not be able to mint tokens after MINTER_ROLE is revoked'
      );
  });

});