import _ from 'lodash';
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, upgrades } from "hardhat";
import { nativeTokenAddress, deployW3BucketWithEditionsFixture } from "./utils";

const { provider } = ethers;

describe("Upgradable", () => {
  it('Upgradable', async () => {

    const { w3Bucket, testData, Alice, Bob } = await loadFixture(deployW3BucketWithEditionsFixture);

    // mint
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(testData.edition.prices.nativeEther.price));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-testData.edition.prices.nativeEther.price));
    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    await expect(w3Bucket.connect(Bob).mint(Bob.address, testData.edition.id, nativeTokenAddress, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);

    const bobBalance = (await w3Bucket.balanceOf(Bob.address)).toNumber();
    const tokenId = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, bobBalance - 1)).toNumber();
    const contractBalanceEther = (await provider.getBalance(nativeTokenAddress)).toNumber();

    // upgrade
    const TestW3BucketV2 = await ethers.getContractFactory("TestW3BucketV2");
    const w3BucketV2 = await upgrades.upgradeProxy(w3Bucket.address, TestW3BucketV2);

    expect(w3BucketV2.address).to.equal(w3Bucket.address, 'Should keep same address after upgrade');

    // bucket editions should be kept
    const bucketEditions = _.sortBy(_.map(
      await w3BucketV2.getBucketEditions(true),
      edition => _.pick(edition, ['editionId', 'active', 'capacityInGigabytes', 'maxMintableSupply', 'currentSupplyMinted'])
    ), e => e.editionId.toNumber());
    expect(bucketEditions).to.deep.equal([
      { editionId: 6, active: true, capacityInGigabytes: 666, maxMintableSupply: 666, currentSupplyMinted: 0 },
      { editionId: 8, active: true, capacityInGigabytes: 888, maxMintableSupply: 888, currentSupplyMinted: 1 },
      { editionId: 9, active: true, capacityInGigabytes: 999, maxMintableSupply: 999, currentSupplyMinted: 0 },
    ]);

    // bucket prices should be kept
    const bucketEditionsPrices = _.sortBy(_.map(
      await w3BucketV2.getBucketEditionPrices(testData.edition.id),
      price => _.pick(price, ['currency', 'price'])
    ), 'currency');
    expect(bucketEditionsPrices).to.deep.equal([
      { currency: nativeTokenAddress, price: ethers.utils.parseEther(_.toString(testData.edition.prices.nativeEther.price)) },
      { currency: testData.edition.prices.erc20.address, price: ethers.utils.parseUnits(_.toString(testData.edition.prices.erc20.price), testData.edition.prices.erc20.decimals) },
    ]);

    // contract's asset should be kept
    expect(await provider.getBalance(nativeTokenAddress)).to.equal(contractBalanceEther);

    // user's minted tokens should be kept
    expect(await w3BucketV2.ownerOf(tokenId)).to.equal(Bob.address, `Bob's token should be kept after upgrade`);

    // upgrade logic takes effect
    expect(await w3BucketV2.funcV2()).to.equal(true, 'Upgraded logic contract works');
  })
});