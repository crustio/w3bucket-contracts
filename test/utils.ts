import { ethers, upgrades } from 'hardhat';
import { W3Bucket__factory } from '../typechain/factories/contracts';
import { TestERC20__factory } from '../typechain/factories/contracts/test/TestERC20__factory';

const { provider } = ethers;

export const nativeTokenAddress = '0x0000000000000000000000000000000000000000';

export async function deployW3BucketFixture() {
  const W3Bucket = await ethers.getContractFactory('W3Bucket');
  const w3BucketProxy = await upgrades.deployProxy(W3Bucket, ['W3Bucket', 'BK3']);
  const w3Bucket = W3Bucket__factory.connect(w3BucketProxy.address, provider);

  const TestERC20 = await ethers.getContractFactory('TestERC20');
  const testERC20Proxy = await upgrades.deployProxy(TestERC20, ['TestERC20', 'TRC']);
  const testERC20 = TestERC20__factory.connect(testERC20Proxy.address, provider);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  return { w3Bucket, testERC20, Alice, Bob, Caro, Dave };
}

export async function deployW3BucketWithEditionsFixture() {
  const W3Bucket = await ethers.getContractFactory('W3Bucket');
  const w3BucketProxy = await upgrades.deployProxy(W3Bucket, ['W3Bucket', 'BK3']);
  const w3Bucket = W3Bucket__factory.connect(w3BucketProxy.address, provider);

  const TestERC20 = await ethers.getContractFactory('TestERC20');
  const testERC20Proxy = await upgrades.deployProxy(TestERC20, ['TestERC20', 'TRC']);
  const testERC20 = TestERC20__factory.connect(testERC20Proxy.address, provider);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  await w3Bucket.connect(Alice).setBucketEditions([
    { editionId: 6, maxMintableSupply: 666 },
    { editionId: 8, maxMintableSupply: 888 },
    { editionId: 9, maxMintableSupply: 999 },
  ]);

  const testERC20Decimal = await testERC20.decimals();
  await w3Bucket.connect(Alice).setBucketEditionPrices(6, [
    { currency: testERC20.address, price: ethers.utils.parseUnits('6.6', testERC20Decimal) },
  ]);
  await w3Bucket.connect(Alice).setBucketEditionPrices(8, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.8') },
    { currency: testERC20.address, price: ethers.utils.parseUnits('8.8', testERC20Decimal) },
  ]);
  await w3Bucket.connect(Alice).setBucketEditionPrices(9, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('9.9') },
  ]);

  const testData = {
    edition: {
      id: 8,
      prices: {
        nativeEther: {
          address: nativeTokenAddress,
          price: 0.8
        },
        erc20: {
          address: testERC20.address,
          decimals: testERC20Decimal,
          price: 8.8
        }
      }
    },
  };

  return { w3Bucket, testData, Alice, Bob, Caro, Dave };
}