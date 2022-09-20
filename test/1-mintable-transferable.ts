import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployW3BucketFixture } from "./utils";

describe("Mintable && burnable && transferable", () => {

  it("Mintable and burnable", async () => {
    const { w3Bucket, Alice, Bob } = await loadFixture(deployW3BucketFixture);

    const prevTotalSupply = (await w3Bucket.totalSupply()).toNumber();
    const prevBalance = (await w3Bucket.balanceOf(Alice.address)).toNumber();

    const tokenId = 0;
    await expect(w3Bucket.safeMint(Alice.address, 'ipfs://'))
      .to.emit(w3Bucket, 'Transfer')
      .withArgs(anyValue, Alice.address, tokenId);

    const owner = await w3Bucket.ownerOf(tokenId)
    expect(owner).to.equal(Alice.address, 'Unmatched owner address after mint')

    const totalSupply = (await w3Bucket.totalSupply()).toNumber();
    const balance = (await w3Bucket.balanceOf(Alice.address)).toNumber();
    expect(prevTotalSupply + 1).to.equal(totalSupply, 'Total supply should be increased');
    expect(prevBalance + 1).to.equal(balance, 'Account balance should be increased');

    // burn
    await w3Bucket.burn(tokenId);

    const totalSupplyAfterBurn = (await w3Bucket.totalSupply()).toNumber();
    const balanceAfterBurn = (await w3Bucket.balanceOf(Alice.address)).toNumber();

    expect(totalSupplyAfterBurn).to.equal(totalSupply - 1, 'Total supply should be decreased after burn');
    expect(balanceAfterBurn).to.equal(balance - 1, 'Account balance should be decreased after burn');
  });

  it('Transferable', async () => {
    const { w3Bucket, Alice, Bob } = await loadFixture(deployW3BucketFixture);

    const tokenId = 0;
    await expect(w3Bucket.safeMint(Alice.address, 'ipfs://'))
      .to.emit(w3Bucket, 'Transfer')
      .withArgs(anyValue, Alice.address, tokenId);

    await expect(w3Bucket.transferFrom(Alice.address, Bob.address, tokenId))
      .not.to.be.reverted;
    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be transferred to Bob');
    
    // Note how to call overloaded function `safeTransferFrom` with etherjs
    await expect(w3Bucket.connect(Bob)["safeTransferFrom(address,address,uint256)"](Bob.address, Alice.address, tokenId))
      .not.to.be.reverted;
    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Alice.address, 'Token should be transferred back to Alice');

    await expect(w3Bucket.connect(Bob)["safeTransferFrom(address,address,uint256)"](Alice.address, Bob.address, tokenId))
      .to.be.reverted;

    await expect(w3Bucket.connect(Alice).approve(Bob.address, tokenId))
      .not.to.be.reverted;
    // Note the inner `await` here. Not quite sure why it's needed yet, but otherwise next asset of `ownerOf` will fail
    await expect(await w3Bucket.connect(Bob)["safeTransferFrom(address,address,uint256)"](Alice.address, Bob.address, tokenId));
    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be transferred to Bob after approved');
  });

});