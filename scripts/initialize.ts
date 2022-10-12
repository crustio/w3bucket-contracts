import _ from 'lodash';
import fs from 'fs';
import hre, { ethers } from 'hardhat';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { W3Bucket__factory } from '../typechain/factories/contracts';

export const nativeTokenAddress = '0x0000000000000000000000000000000000000000';

async function main() {
  const uupsDeployInfo = JSON.parse(fs.readFileSync(`./.openzeppelin/${hre.network.name}.json`, 'utf8'));
  const w3BucketAddress = uupsDeployInfo.proxies[0].address;
  console.log(`W3Bucket contract address: ${w3BucketAddress}`);

  const [signer]: SignerWithAddress[] = await ethers.getSigners();
  const w3Bucket = W3Bucket__factory.connect(w3BucketAddress, signer);
  console.log(`Signer address: ${signer.address}`);

  console.log(`Setting bucket editions.`);
  let tx = await w3Bucket.setBucketEditions([
    { editionId: 1, capacityInGigabytes: 1024, maxMintableSupply: 1_000_000 },
    { editionId: 2, capacityInGigabytes: 10240, maxMintableSupply: 100_000 },
  ]);
  await tx.wait();
  
  console.log(`Setting price for bucket edition 1`);
  const weth = {
    address: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
    decimals: 18
  };
  tx = await w3Bucket.setBucketEditionPrices(1, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.1') },
    { currency: weth.address, price: ethers.utils.parseUnits('0.2', weth.decimals) },
  ]);
  await tx.wait();

  console.log(`Setting price for bucket edition 2`);
  tx = await w3Bucket.setBucketEditionPrices(2, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    { currency: weth.address, price: ethers.utils.parseUnits('0.6', weth.decimals) },
  ]);
  await tx.wait();

  console.log(`Finish initialization`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});