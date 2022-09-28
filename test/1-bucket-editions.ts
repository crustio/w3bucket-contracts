import _ from 'lodash';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { nativeTokenAddress, deployW3BucketFixture } from './utils';

describe('Bucket Editions', () => {

  it('Basic scenario works', async () => {
    const { w3Bucket, testERC20, Alice, Bob, Caro } = await loadFixture(deployW3BucketFixture);

    await expect(w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 1, maxMintableSupply: 1_000_000 },
      { editionId: 2, maxMintableSupply: 100_000 },
    ]))
      .to.emit(w3Bucket, 'EditionUpdated').withArgs(1, 1_000_000)
      .to.emit(w3Bucket, 'EditionUpdated').withArgs(2, 100_000);
  
    const testERC20Decimal = await testERC20.decimals();
    await expect(w3Bucket.connect(Alice).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('5', testERC20Decimal) },
    ]))
      .to.emit(w3Bucket, 'EditionPriceUpdated').withArgs(2, nativeTokenAddress, ethers.utils.parseEther('0.5'))
      .to.emit(w3Bucket, 'EditionPriceUpdated').withArgs(2, testERC20.address, ethers.utils.parseUnits('5', testERC20Decimal));

    const bucketEditions = _.sortBy(_.map(
      await w3Bucket.getBucketEditions(true),
      edition => _.pick(edition, ['editionId', 'active', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    expect(bucketEditions).to.deep.equal([
      { editionId: 1, active: true, maxMintableSupply: 1_000_000, currentSupplyMinted: 0},
      { editionId: 2, active: true, maxMintableSupply: 100_000, currentSupplyMinted: 0},
    ]);

    const secondEditionPrices = _.sortBy(_.map(
      await w3Bucket.getBucketEditionPrices(2),
      price => _.pick(price, ['currency', 'price'])
    ), 'currency');
    expect(secondEditionPrices).to.deep.equal([
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('5', testERC20Decimal) },
    ]);

    const nativeTokenPrice = 0.5;
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(nativeTokenPrice));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-nativeTokenPrice));

    const testERC20TokenPrice = 5;
    const testERC20TokenPriceBN = ethers.utils.parseUnits(_.toString(testERC20TokenPrice), testERC20Decimal);
    const testERC20TokenNegativePriceBN = ethers.utils.parseUnits(_.toString(-testERC20TokenPrice), testERC20Decimal);

    // mint a Bucket with native token
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

    // withdraw native token
    await expect(w3Bucket.connect(Alice).withdraw(Caro.address, nativeTokenAddress))
      .to.emit(w3Bucket, 'Withdraw').withArgs(Caro.address, nativeTokenAddress, nativeTokenPriceBN)
      .to.changeEtherBalances([w3Bucket.address, Caro.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);

    // withdraw TestERC20
    await expect(w3Bucket.connect(Alice).withdraw(Caro.address, testERC20.address))
      .to.emit(w3Bucket, 'Withdraw').withArgs(Caro.address, testERC20.address, testERC20TokenPriceBN)
      .to.changeTokenBalances(testERC20, [w3Bucket.address, Caro.address], [testERC20TokenNegativePriceBN, testERC20TokenPriceBN]);
  });

  it('Bucket edition updating works', async () => {
    const { w3Bucket, testERC20, Alice, Bob, Caro } = await loadFixture(deployW3BucketFixture);

    await w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 1, maxMintableSupply: 1_000_000 },
      { editionId: 2, maxMintableSupply: 100_000 },
    ]);

    const bucketEditions = _.sortBy(_.map(
      await w3Bucket.getBucketEditions(true),
      edition => _.pick(edition, ['editionId', 'active', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    expect(bucketEditions).to.deep.equal([
      { editionId: 1, active: true, maxMintableSupply: 1_000_000, currentSupplyMinted: 0},
      { editionId: 2, active: true, maxMintableSupply: 100_000, currentSupplyMinted: 0},
    ]);

    // update editions
    await w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 2, maxMintableSupply: 100_000 },
      { editionId: 5, maxMintableSupply: 99_000 },
      { editionId: 10, maxMintableSupply: 888_888 },
      { editionId: 6, maxMintableSupply: 1 },
      { editionId: 9, maxMintableSupply: 999 },
    ]);
    // get active editions
    const bucketEditionsV2 = _.sortBy(_.map(
      await w3Bucket.getBucketEditions(true),
      edition => _.pick(edition, ['editionId', 'active', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    expect(bucketEditionsV2).to.deep.equal([
      { editionId: 2, active: true, maxMintableSupply: 100_000, currentSupplyMinted: 0},
      { editionId: 5, active: true, maxMintableSupply: 99_000, currentSupplyMinted: 0},
      { editionId: 6, active: true, maxMintableSupply: 1, currentSupplyMinted: 0},
      { editionId: 9, active: true, maxMintableSupply: 999, currentSupplyMinted: 0},
      { editionId: 10, active: true, maxMintableSupply: 888_888, currentSupplyMinted: 0}
    ]);

    // set prices to some editions
    const testERC20Decimal = await testERC20.decimals();
    await w3Bucket.connect(Alice).setBucketEditionPrices(6, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('5', testERC20Decimal) },
    ]);

    // trying to mint outdated editon should fail
    const nativeTokenPrice = 0.5;
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(nativeTokenPrice));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-nativeTokenPrice));
    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 1, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.be.rejectedWith(
        /Invalid or inactive edition/,
        'Trying to mint outdated editon should fail'
      );
    
    // trying to mint active edition without price set should fail
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 9, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.be.rejectedWith(
        /Invalid currency/,
        'Trying to mint active edition without price set should fail'
      );

    // trying to mint active edition with unsupported token should fail
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 6, '0x0000000000000000000000000000000000000088', tokenURI1))
      .to.be.rejectedWith(
        /Invalid currency/,
        'Trying to mint active edition with unsupported token should fail'
      );

    // trying to mint active edition with insufficient native token should fail
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 6, nativeTokenAddress, tokenURI1, {value: ethers.utils.parseEther(_.toString(nativeTokenPrice / 2))}))
      .to.be.rejectedWith(
        /Must send required price/,
        'Trying to mint active edition with insufficient native token should fail'
      );
    
    // trying to mint active edition with insufficient erc20 token should fail
    const testERC20TokenPrice = 5;
    const testERC20TokenPriceBN = ethers.utils.parseUnits(_.toString(testERC20TokenPrice), testERC20Decimal);
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 6, testERC20.address, tokenURI1))
      .to.be.rejectedWith(
        /ERC20: insufficient allowance/,
        'Trying to mint active edition with insufficient erc20 token should fail'
      );
    
    // mint
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 6, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);
    
    // trying to mint exceeding maxMintableSupply should fail
    await expect(w3Bucket.connect(Bob).mint(Bob.address, 6, testERC20.address, tokenURI1))
      .to.be.rejectedWith(
        /Exceed max mintable supply/,
        'Trying to mint exceeding maxMintableSupply should fail'
      );
    
    // update editions
    await w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 66, maxMintableSupply: 6666 },
      { editionId: 88, maxMintableSupply: 8888 },
    ]);
    const bucketEditionsV3 = _.sortBy(_.map(
      await w3Bucket.getBucketEditions(false),
      edition => _.pick(edition, ['editionId', 'active', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    // inactive editions with minted buckets should be queryable
    expect(bucketEditionsV3).to.deep.equal([
      { editionId: 6, active: false, maxMintableSupply: 1, currentSupplyMinted: 1},
      { editionId: 66, active: true, maxMintableSupply: 6666, currentSupplyMinted: 0},
      { editionId: 88, active: true, maxMintableSupply: 8888, currentSupplyMinted: 0}
    ]);

    // inactive edition could be activated again
    await w3Bucket.connect(Alice).setBucketEditions([
      { editionId: 6, maxMintableSupply: 6 },
      { editionId: 66, maxMintableSupply: 6666 },
      { editionId: 88, maxMintableSupply: 8888 },
    ]);
    const bucketEditionsV4 = _.sortBy(_.map(
      await w3Bucket.getBucketEditions(true),
      edition => _.pick(edition, ['editionId', 'active', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    // inactive editions with minted buckets should be queryable
    expect(bucketEditionsV4).to.deep.equal([
      { editionId: 6, active: true, maxMintableSupply: 6, currentSupplyMinted: 1},
      { editionId: 66, active: true, maxMintableSupply: 6666, currentSupplyMinted: 0},
      { editionId: 88, active: true, maxMintableSupply: 8888, currentSupplyMinted: 0}
    ]);

    // edition price could be updated
    await w3Bucket.connect(Alice).setBucketEditionPrices(6, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.6') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('6', testERC20Decimal) },
    ]);

    const bucketEditionsV4Prices = _.sortBy(_.map(
      await w3Bucket.getBucketEditionPrices(6),
      price => _.pick(price, ['currency', 'price'])
    ), 'currency');
    expect(bucketEditionsV4Prices).to.deep.equal([
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.6') },
      { currency: testERC20.address, price: ethers.utils.parseUnits('6', testERC20Decimal) },
    ]);

  });

});