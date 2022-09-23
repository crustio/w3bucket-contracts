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
  const testERC20Proxy = await upgrades.deployProxy(TestERC20, ['TestERC20', 'TEC']);
  const testERC20 = TestERC20__factory.connect(testERC20Proxy.address, provider);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  return { w3Bucket, testERC20, Alice, Bob, Caro, Dave };
}

export async function deployW3BucketWithEditionsFixture() {
  const W3Bucket = await ethers.getContractFactory('W3Bucket');
  const w3BucketProxy = await upgrades.deployProxy(W3Bucket, ['W3Bucket', 'BK3']);
  const w3Bucket = W3Bucket__factory.connect(w3BucketProxy.address, provider);

  const TestERC20 = await ethers.getContractFactory('TestERC20');
  const testERC20Proxy = await upgrades.deployProxy(TestERC20, ['TestERC20', 'TEC']);
  const testERC20 = TestERC20__factory.connect(testERC20Proxy.address, provider);

  const  [Alice, Bob, Caro, Dave]  = await ethers.getSigners();

  await w3Bucket.connect(Alice).setBucketEditions([
    { editionId: 1, maxMintableSupply: 1_000_000 },
    { editionId: 2, maxMintableSupply: 100_000 },
    { editionId: 3, maxMintableSupply: 5_000 },
  ]);

  const testERC20Decimal = await testERC20.decimals();
  await w3Bucket.connect(Alice).setBucketEditionPrices(1, [
    { currency: testERC20.address, price: ethers.utils.parseUnits('1', testERC20Decimal) },
  ]);
  await w3Bucket.connect(Alice).setBucketEditionPrices(2, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('0.5') },
    { currency: testERC20.address, price: ethers.utils.parseUnits('5', testERC20Decimal) },
  ]);
  await w3Bucket.connect(Alice).setBucketEditionPrices(3, [
    { currency: nativeTokenAddress, price: ethers.utils.parseEther('1.5') },
  ]);


  return { w3Bucket, testERC20, Alice, Bob, Caro, Dave };
}