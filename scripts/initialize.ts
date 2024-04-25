import _ from 'lodash';
import fs from 'fs';
import hre, { ethers } from 'hardhat';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { W3Bucket__factory } from '../typechain/factories/contracts';

export const nativeTokenAddress = '0x0000000000000000000000000000000000000000';

// const w3BucketAddress = "0x7aE8066d7e630f08a7dd60C6f067d93Ef5EA8a39"; // op-sepolia
const w3BucketAddress = "0x7aE8066d7e630f08a7dd60C6f067d93Ef5EA8a39";  // op-mainnet

async function main() {
  // const uupsDeployInfo = JSON.parse(fs.readFileSync(`./.openzeppelin/${hre.network.name}.json`, 'utf8'));
  // const w3BucketAddress = uupsDeployInfo.proxies[0].address;
  console.log(`W3Bucket contract address: ${w3BucketAddress}`);

  const [signer]: SignerWithAddress[] = await ethers.getSigners();
  const w3Bucket = W3Bucket__factory.connect(w3BucketAddress, signer);
  console.log(`Signer address: ${signer.address}`);

  console.log(`Setting bucket editions.`);
  let tx = await w3Bucket.setBucketEditions([
    { editionId: 1, capacityInGigabytes: 10, maxMintableSupply: 1_000_000 },
    { editionId: 2, capacityInGigabytes: 100, maxMintableSupply: 1_000_000 },
    { editionId: 3, capacityInGigabytes: 1024, maxMintableSupply: 1_000_000 },
  ]);
  await tx.wait();
  
  console.log(`Setting price for bucket edition 1`);
  const usdt = {
    // address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // mainnet
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // op-mainnet
    decimals: 6
  };

  tx = await w3Bucket.setBucketEditionPrices(1, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.003') },
    { currency: usdt.address, price: ethers.utils.parseUnits('10', usdt.decimals) },
  ]);
  await tx.wait();

  console.log(`Setting price for bucket edition 2`);
  tx = await w3Bucket.setBucketEditionPrices(2, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.03') },
    { currency: usdt.address, price: ethers.utils.parseUnits('100', usdt.decimals) },
  ]);
  await tx.wait();

  console.log(`Setting price for bucket edition 3`);
  tx = await w3Bucket.setBucketEditionPrices(3, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.3') },
    { currency: usdt.address, price: ethers.utils.parseUnits('1000', usdt.decimals) },
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