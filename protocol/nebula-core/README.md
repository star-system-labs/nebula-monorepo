# Star System Labs Protocol

This project is set up for smart contract development using Hardhat. It's configured with multiple networks, multiple solidity compiler versions, and additional plugins to enhance the development experience.

## Available Commands

You can run the following commands to interact with the project:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Configurations

### Networks

- **localhost**: Configured for unlimited contract size and extended timeout.
- **mainnet**: Connects to the Ethereum mainnet using Infura.
- **sepolia**: Connects to the Sepolia testnet using Infura.

### Solidity Compilers

The project supports multiple compiler versions:

- 0.8.18
- 0.8.15
- 0.8.9
- 0.8.0

All versions are set up with an optimizer enabled for 5000 runs and use the Intermediate Representation (IR) for code generation.

### ABI Exporter

After compilation, ABIs are exported to `./data/abi` in a minimal format. The directory is cleared before each new export to ensure it contains the latest ABIs.

## Getting Started

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up your `.env` file with the necessary private keys for the `mainnet` and `sepolia` networks.
4. Run the desired Hardhat commands as mentioned above.

---

This README provides a clearer picture of your project's configurations and how to interact with it. Adjustments can be made based on any additional features or configurations you add in the future.