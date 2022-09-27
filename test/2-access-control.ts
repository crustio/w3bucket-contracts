import _ from 'lodash';
import { expect } from "chai";
import { ethers } from 'hardhat';
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { nativeTokenAddress, deployW3BucketFixture, deployW3BucketWithEditionsFixture } from "./utils";

describe("Access Control", () => {

  it("Pausable", async () => {
    const { w3Bucket, testData, Alice, Bob, Caro } = await loadFixture(deployW3BucketWithEditionsFixture);

    const tokenURI1 = 'ipfs://<METADATA_CID_1>';
    const nativeTokenPriceBN = ethers.utils.parseEther(_.toString(testData.edition.prices.nativeEther.price));
    const nativeTokenPriceNegativeBN = ethers.utils.parseEther(_.toString(-testData.edition.prices.nativeEther.price));
    await expect(w3Bucket.connect(Bob).mint(Bob.address, testData.edition.id, testData.edition.prices.nativeEther.address, tokenURI1, {value: nativeTokenPriceBN}))
      .to.emit(w3Bucket, 'Transfer').withArgs(anyValue, Bob.address, anyValue)
      .to.changeEtherBalances([Bob.address, w3Bucket.address], [nativeTokenPriceNegativeBN, nativeTokenPriceBN]);
    
    const bobBalance = (await w3Bucket.balanceOf(Bob.address)).toNumber();
    const tokenId = (await w3Bucket.tokenOfOwnerByIndex(Bob.address, bobBalance - 1)).toNumber();
    await expect(w3Bucket.connect(Bob).transferFrom(Bob.address, Caro.address, tokenId))
      .not.to.be.reverted;

    await expect(w3Bucket.connect(Alice).pause())
      .not.to.be.reverted;
    
    await expect(w3Bucket.connect(Bob).mint(Bob.address, testData.edition.id, testData.edition.prices.nativeEther.address, tokenURI1, {value: nativeTokenPriceBN}))
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
    
    await expect(w3Bucket.connect(Alice).unpause())
      .not.to.be.reverted;
  });

  it("EDITIONS_ADMIN_ROLE and WITHDRAWER_ROLE Role", async () => {
    const { w3Bucket, Alice, Bob, Caro } = await loadFixture(deployW3BucketFixture);

    await expect(w3Bucket.connect(Bob).setBucketEditions([
      { editionId: 1, maxMintableSupply: 1_000_000 },
      { editionId: 2, maxMintableSupply: 100_000 },
    ]))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to set bucket editions'
      );
    
    const EDITIONS_ADMIN_ROLE = await w3Bucket.EDITIONS_ADMIN_ROLE();
    await expect(w3Bucket.connect(Alice).grantRole(EDITIONS_ADMIN_ROLE, Bob.address))
      .to.emit(w3Bucket, 'RoleGranted').withArgs(EDITIONS_ADMIN_ROLE, Bob.address, anyValue);
    expect(await w3Bucket.getRoleMember(EDITIONS_ADMIN_ROLE, (await w3Bucket.getRoleMemberCount(EDITIONS_ADMIN_ROLE)).toNumber() - 1))
      .to.equal(Bob.address);
    
    await expect(w3Bucket.connect(Bob).setBucketEditions([
      { editionId: 1, maxMintableSupply: 1_000_000 },
      { editionId: 2, maxMintableSupply: 100_000 },
    ]))
      .to.emit(w3Bucket, 'EditionUpdated').withArgs(1, 1_000_000)
      .to.emit(w3Bucket, 'EditionUpdated').withArgs(2, 100_000);
    
    await expect(w3Bucket.connect(Bob).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    ]))
      .to.emit(w3Bucket, 'EditionPriceUpdated').withArgs(2, nativeTokenAddress, ethers.utils.parseEther('0.5'));

    await expect(w3Bucket.connect(Bob).renounceRole(EDITIONS_ADMIN_ROLE, Bob.address))
      .to.emit(w3Bucket, 'RoleRevoked').withArgs(EDITIONS_ADMIN_ROLE, Bob.address, anyValue);

    await expect(w3Bucket.connect(Bob).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    ]))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to set bucket editions after renouncing EDITIONS_ADMIN_ROLE'
      );
    
    await expect(w3Bucket.connect(Alice).grantRole(EDITIONS_ADMIN_ROLE, Bob.address))
      .to.emit(w3Bucket, 'RoleGranted').withArgs(EDITIONS_ADMIN_ROLE, Bob.address, anyValue);

    await expect(w3Bucket.connect(Bob).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    ]))
      .to.emit(w3Bucket, 'EditionPriceUpdated').withArgs(2, nativeTokenAddress, ethers.utils.parseEther('0.5'));

    await expect(w3Bucket.connect(Alice).revokeRole(EDITIONS_ADMIN_ROLE, Bob.address))
      .to.emit(w3Bucket, 'RoleRevoked').withArgs(EDITIONS_ADMIN_ROLE, Bob.address, anyValue);

    await expect(w3Bucket.connect(Bob).setBucketEditionPrices(2, [
      { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    ]))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to set bucket editions after EDITIONS_ADMIN_ROLE is revoked'
      );

    await expect(w3Bucket.connect(Bob).withdraw(Bob.address, nativeTokenAddress))
      .to.be.rejectedWith(
        /AccessControl/,
        'Bob should not be able to withdraw currency'
      );
    
    const WITHDRAWER_ROLE = await w3Bucket.WITHDRAWER_ROLE();
    await expect(w3Bucket.connect(Alice).grantRole(WITHDRAWER_ROLE, Bob.address))
      .to.emit(w3Bucket, 'RoleGranted').withArgs(WITHDRAWER_ROLE, Bob.address, anyValue);
    
    await expect(w3Bucket.connect(Bob).withdraw(Bob.address, nativeTokenAddress))
      .not.to.rejected;
  });

});