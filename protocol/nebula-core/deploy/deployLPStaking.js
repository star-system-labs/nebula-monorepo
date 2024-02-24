const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const LP_TOKEN_ADDRESS_PEPE = "0xAb85Bb8D21Ca506F7beA2479bD26C58EAf4C6020"; 
  const REWARD_TOKEN_ADDRESS_PEPE = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc";

  await deploy("LPStakingPePe", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_PEPE, REWARD_TOKEN_ADDRESS_PEPE],
    log: true,
  });

  const LP_TOKEN_ADDRESS_SHIBA = "0xC89787E000DCd572e54514511bAa1e80FbfFB160"; 
  const REWARD_TOKEN_ADDRESS_SHIBA = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc"; 

  await deploy("LPStakingShiba", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_SHIBA, REWARD_TOKEN_ADDRESS_SHIBA],
    log: true,
  });
};

module.exports.tags = ["MultipleLPStaking", "LPStakingPePe", "LPStakingShiba"];

