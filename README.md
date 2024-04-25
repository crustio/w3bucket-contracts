# W3Bucket Contracts

## Quick start

Cloning repository and install dependencies:

```sh
$ git https://github.com/crustio/w3bucket-contracts.git

$ cd w3bucket-contracts

$ yarn
```
To compile contracts:

```sh
# Use `hardhat-shorthand`:
$ hh compile

# Use `yarn`:
$ yarn run hardhat compile

# Use `npx`:
$ npx hardhat compile
```

To run test cases,

```sh
$ hh test

# To run test cases of a test file:
$ hh test ./test/xxx.ts

# To run all test cases with gas report:
$ REPORT_GAS=true hh test
```

To deploy to remote network

```sh
# Use `hardhat-shorthand`:
$ hh run scripts/deploy.ts --network [mainnet/rinkeby/goerli/op-mainnet/op-sepolia]
```

To verify:

```sh
# Use `hardhat-shorthand`:
$ hh verify --network [mainnet/rinkeby/goerli/op-mainnet/op-sepolia] <address>
```

To initialize:

```sh
# Use `hardhat-shorthand`:
$ hh run scripts/initialize.ts --network [mainnet/rinkeby/goerli/op-mainnet/op-sepolia]
```