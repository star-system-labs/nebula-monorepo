require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require('hardhat-abi-exporter');
require("solidity-coverage");
require('hardhat-gas-reporter'); 
require('dotenv').config({ path: '.env' });
require('hardhat-deploy');

module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [`0x${process.env.LOCAL_PRIV_KEY}`],
      saveDeployments: true,
      //gas: 100000000000,
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      timeout: 1800000
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.MAINNET_PRIV_KEY],
      saveDeployments: true,
      gasPrice: 48000000000,
      gas: 10000000,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.SEPOLIA_PRIV_KEY],
      saveDeployments: true,
      gasPrice: 40000000000,
      gas: 12000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 5000
          },
          viaIR: true
        }
      },
    ],
    abiExporter: {
      path: './data/abi',
      runOnCompile: true,
      clear: true,
      flat: true,
      spacing: 2,
      pretty: true,
      format: "minimal",
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    //outputFile: 'gas-report.txt',
    noColors: false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
