# W3Bucket Contracts

## Quick start

Cloning repository and install dependencies:

```sh
$ git https://github.com/decooio/w3bucket-contracts.git
$ cd w3bucket-contracts
$ yarn
```

Run Hardhat's testing network:

```sh
# Use `hardhat-shorthand`:
$ hh node

# Use `yarn`:
$ yarn run hardhat node

# Use `npx`:
$ npx hardhat node
```

Then, on a new terminal, go to the repository's root folder and run this to deploy the contract:

```sh
# Use `hardhat-shorthand`:
$ hh scripts/deploy.js --network localhost

# Use `yarn`:
$ yarn run hardhat run scripts/deploy.js --network localhost

# Use `npx`:
$ npx hardhat run scripts/deploy.js --network localhost
```

To run test,

```sh
# Use `hardhat-shorthand`:
$ REPORT_GAS=true hh test
```

To deploy to remote network

```sh
# Use `hardhat-shorthand`:
$ hh run scripts/deploy.ts --network [mainnet/rinkeby/goerli]
```

To verify:

```sh
# Use `hardhat-shorthand`:
$ hh verify --network [mainnet/rinkeby/goerli] <address>
```