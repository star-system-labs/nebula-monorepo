const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const LP_TOKEN_ADDRESS_PEPE = "0x27dF660eE7D634401A37de335946472B8928A10E"; 
  const REWARD_TOKEN_ADDRESS_PEPE = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc";

  await deploy("LPStakingPePe", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_PEPE, REWARD_TOKEN_ADDRESS_PEPE],
    log: true,
  });

  const LP_TOKEN_ADDRESS_SHIBA = "0xA0DB56d00465c2665acD333A848C5BDEF9D8FD19"; 
  const REWARD_TOKEN_ADDRESS_SHIBA = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc"; 

  await deploy("LPStakingShiba", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_SHIBA, REWARD_TOKEN_ADDRESS_SHIBA],
    log: true,
  });
};

module.exports.tags = ["MultipleLPStaking", "LPStakingPePe", "LPStakingShiba"];

