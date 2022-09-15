import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { deployIPFSCloudCardFixture } from "./utils";

describe("Mintable && burnable && transferable", () => {

  it("Mintable and burnable", async () => {
    const { ipfsCloudCard, Alice, Bob } = await loadFixture(deployIPFSCloudCardFixture);

    const prevTotalSupply = (await ipfsCloudCard.totalSupply()).toNumber();
    const prevBalance = (await ipfsCloudCard.balanceOf(Alice.address)).toNumber();

    const tokenId = 0;
    await expect(ipfsCloudCard.safeMint(Alice.address))
      .to.emit(ipfsCloudCard, 'Transfer')
      .withArgs(anyValue, Alice.address, tokenId);

    const owner = await ipfsCloudCard.ownerOf(tokenId)
    expect(owner).to.equal(Alice.address, 'Unmatched owner address after mint')

    const totalSupply = (await ipfsCloudCard.totalSupply()).toNumber();
    const balance = (await ipfsCloudCard.balanceOf(Alice.address)).toNumber();
    expect(prevTotalSupply + 1).to.equal(totalSupply, 'Total supply should be increased');
    expect(prevBalance + 1).to.equal(balance, 'Account balance should be increased');

    // burn
    await ipfsCloudCard.burn(tokenId);

    const totalSupplyAfterBurn = (await ipfsCloudCard.totalSupply()).toNumber();
    const balanceAfterBurn = (await ipfsCloudCard.balanceOf(Alice.address)).toNumber();

    expect(totalSupplyAfterBurn).to.equal(totalSupply - 1, 'Total supply should be decreased after burn');
    expect(balanceAfterBurn).to.equal(balance - 1, 'Account balance should be decreased after burn');
  });

  it('Batch mintable', async () => {
    const { ipfsCloudCard, Alice, Bob, Caro, Dave } = await loadFixture(deployIPFSCloudCardFixture);

    const batchSize = 50;
    await expect(ipfsCloudCard.connect(Bob).safeBatchMint(Bob.address, batchSize))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to batch mint tokens'
      );

    await expect(ipfsCloudCard.connect(Alice).safeBatchMint(Dave.address, batchSize))
      .not.to.be.reverted;

    expect(await ipfsCloudCard.balanceOf(Dave.address)).to.equal(batchSize, 'Balance check should pass after batch mint');

    const minterRole = await ipfsCloudCard.MINTER_ROLE();
    await ipfsCloudCard.connect(Alice).grantRole(minterRole, Bob.address);
    await expect(ipfsCloudCard.connect(Bob).safeBatchMint(Dave.address, batchSize))
      .not.to.be.reverted;
    expect(await ipfsCloudCard.balanceOf(Dave.address)).to.equal(batchSize * 2, 'Balance check should pass after batch mint again');
  });

  it('Transferable', async () => {
    const { ipfsCloudCard, Alice, Bob } = await loadFixture(deployIPFSCloudCardFixture);

    const tokenId = 0;
    await expect(ipfsCloudCard.safeMint(Alice.address))
      .to.emit(ipfsCloudCard, 'Transfer')
      .withArgs(anyValue, Alice.address, tokenId);

    await expect(ipfsCloudCard.transferFrom(Alice.address, Bob.address, tokenId))
      .not.to.be.reverted;
    expect(await ipfsCloudCard.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be transferred to Bob');
    
    // Note how to call overloaded function `safeTransferFrom` with etherjs
    await expect(ipfsCloudCard.connect(Bob)["safeTransferFrom(address,address,uint256)"](Bob.address, Alice.address, tokenId))
      .not.to.be.reverted;
    expect(await ipfsCloudCard.ownerOf(tokenId)).to.equal(Alice.address, 'Token should be transferred back to Alice');

    await expect(ipfsCloudCard.connect(Bob)["safeTransferFrom(address,address,uint256)"](Alice.address, Bob.address, tokenId))
      .to.be.reverted;

    await expect(ipfsCloudCard.connect(Alice).approve(Bob.address, tokenId))
      .not.to.be.reverted;
    // Note the inner `await` here. Not quite sure why it's needed yet, but otherwise next asset of `ownerOf` will fail
    await expect(await ipfsCloudCard.connect(Bob)["safeTransferFrom(address,address,uint256)"](Alice.address, Bob.address, tokenId));
    expect(await ipfsCloudCard.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be transferred to Bob after approved');
  });

});