import _ from 'lodash';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { nativeTokenAddress, deployW3BucketFixture, deployW3BucketWithEditionsFixture } from './utils';
import { BucketEditionUpgradable } from '../typechain/contracts/W3Bucket';

describe('Bucket Editions', () => {

  it('Basic scenario works', async () => {
    const { w3Bucket, testERC20, Alice, Bob } = await loadFixture(deployW3BucketFixture);

    await w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 1, maxMintableSupply: 1_000_000 },
      { editionId: 2, maxMintableSupply: 100_000 },
    ]);
  
    const testERC20Decimal = await testERC20.decimals();
    await w3Bucket.connect(Alice).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('5', testERC20Decimal) },
    ]);

    const bucketEditions = _.sortBy(await w3Bucket.getBucketEditions(true), 'editionId');
    expect(bucketEditions.length).to.equal(2);
    expect(bucketEditions[0].maxMintableSupply).to.equal(1_000_000);
    expect(bucketEditions[1].maxMintableSupply).to.equal(100_000);

    const secondEditionPrices = _.reduce(await w3Bucket.getBucketEditionPrices(2), (map: { [key: string]: number }, priceObj: BucketEditionUpgradable.EditionPriceStructOutput) => {
      const currency = priceObj.currency;
      if (currency === nativeTokenAddress) {
        map[currency] = _.toNumber(ethers.utils.formatEther(priceObj.price));
      } else if (currency === testERC20.address) {
        map[currency] = _.toNumber(ethers.utils.formatUnits(priceObj.price, testERC20Decimal));
      }
      return map;
    }, {});
    const nativeTokenPrice = 0.5;
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(nativeTokenPrice));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-nativeTokenPrice));
    expect(secondEditionPrices[nativeTokenAddress]).to.equal(nativeTokenPrice);

    const testERC20TokenPrice = 5;
    const testERC20TokenPriceBN = ethers.utils.parseUnits(_.toString(testERC20TokenPrice), testERC20Decimal);
    const testERC20TokenNegativePriceBN = ethers.utils.parseUnits(_.toString(-testERC20TokenPrice), testERC20Decimal);
    expect(secondEditionPrices[testERC20.address]).to.equal(testERC20TokenPrice);

    // mint a Bucket with native ether
    const prevBobBucketBalance = (await w3Bucket.balanceOf(Bob.address)).toNumber();
    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 2, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);

    expect(await w3Bucket.balanceOf(Bob.address)).to.equal(prevBobBucketBalance + 1);

    const tokenId1 = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, prevBobBucketBalance)).toNumber();
    expect(await w3Bucket.tokenURI(tokenId1)).to.equal(tokenURI1);

    // mint another Bucket with TestERC20
    const tokenURI2 = 'ipfs://<METADATA_CID_2>';
    await testERC20.connect(Alice).mint(Bob.address, testERC20TokenPriceBN);
    await testERC20.connect(Bob).approve(w3Bucket.address, testERC20TokenPriceBN);
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 2, testERC20.address, tokenURI2))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeTokenBalances(testERC20, [Bob.address, w3Bucket.address], [testERC20TokenNegativePriceBN, testERC20TokenPriceBN]);
      expect(await w3Bucket.balanceOf(Bob.address)).to.equal(prevBobBucketBalance + 2);
    const tokenId2 = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, prevBobBucketBalance + 1)).toNumber();
    expect(await w3Bucket.tokenURI(tokenId2)).to.equal(tokenURI2);
  });


});