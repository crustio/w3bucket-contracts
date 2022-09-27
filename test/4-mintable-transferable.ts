import _ from 'lodash';
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { nativeTokenAddress, deployW3BucketWithEditionsFixture } from "./utils";

describe("Mintable && burnable && transferable", () => {

  it("Mintable and burnable", async () => {
    const { w3Bucket, testData, Alice, Bob } = await loadFixture(deployW3BucketWithEditionsFixture);

    const prevTotalSupply = (await w3Bucket.totalSupply()).toNumber();
    const prevBalance = (await w3Bucket.balanceOf(Bob.address)).toNumber();

    // mint
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(testData.edition.prices.nativeEther.price));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-testData.edition.prices.nativeEther.price));
    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    await expect(w3Bucket.connect(Bob).mint(Bob.address, testData.edition.id, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);

    const totalSupply = (await w3Bucket.totalSupply()).toNumber();
    const balance = (await w3Bucket.balanceOf(Bob.address)).toNumber();
    const tokenId = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, balance - 1)).toNumber();
    expect(prevTotalSupply + 1).to.equal(totalSupply, 'Total supply should be increased');
    expect(prevBalance + 1).to.equal(balance, 'Account balance should be increased');

    // burn
    await w3Bucket.connect(Bob).burn(tokenId);

    const totalSupplyAfterBurn = (await w3Bucket.totalSupply()).toNumber();
    const balanceAfterBurn = (await w3Bucket.balanceOf(Bob.address)).toNumber();

    expect(totalSupplyAfterBurn).to.equal(totalSupply - 1, 'Total supply should be decreased after burn');
    expect(balanceAfterBurn).to.equal(balance - 1, 'Account balance should be decreased after burn');
  });

  it('Transferable', async () => {
    const { w3Bucket, testData, Alice, Bob, Caro } = await loadFixture(deployW3BucketWithEditionsFixture);

    // mint
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(testData.edition.prices.nativeEther.price));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-testData.edition.prices.nativeEther.price));
    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    await expect(w3Bucket.connect(Bob).mint(Bob.address, testData.edition.id, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);

    const balance = (await w3Bucket.balanceOf(Bob.address)).toNumber();
    const tokenId = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, balance - 1)).toNumber();
    await expect(w3Bucket.connect(Bob).transferFrom(Bob.address, Caro.address, tokenId))
      .to.emit(w3Bucket, 'Transfer').withArgs(Bob.address, Caro.address, tokenId);

    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Caro.address, 'Token should be transferred to Caro');
    
    // Note how to call overloaded function `safeTransferFrom` with etherjs
    await expect(w3Bucket.connect(Caro)["safeTransferFrom(address,address,uint256)"](Caro.address, Bob.address, tokenId))
      .to.emit(w3Bucket, 'Transfer').withArgs(Caro.address, Bob.address, tokenId);
    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Bob.address, 'Token should be transferred back to Bob');

    await expect(w3Bucket.connect(Caro)["safeTransferFrom(address,address,uint256)"](Bob.address, Caro.address, tokenId))
      .to.be.reverted;

    await expect(w3Bucket.connect(Bob).approve(Caro.address, tokenId))
      .to.emit(w3Bucket, 'Approval').withArgs(Bob.address, Caro.address, tokenId);
    // Note the inner `await` here. Not quite sure why it's needed yet, but otherwise next asset of `ownerOf` will fail
    await expect(await w3Bucket.connect(Caro)["safeTransferFrom(address,address,uint256)"](Bob.address, Caro.address, tokenId));
    expect(await w3Bucket.ownerOf(tokenId)).to.equal(Caro.address, 'Token should be transferred to Caro after approved');
  });

});