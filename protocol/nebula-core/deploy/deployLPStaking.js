const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const LP_TOKEN_ADDRESS_PEPE = "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"; 
  const REWARD_TOKEN_ADDRESS_PEPE = "0x98830a6cc6f8964cec4ffd65f19edebba6fef865";

  await deploy("LPStakingPePe", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_PEPE, REWARD_TOKEN_ADDRESS_PEPE],
    log: true,
  });

  nonce++;

  const LP_TOKEN_ADDRESS_SHIBA = "0x811beed0119b4afce20d2583eb608c6f7af1954f"; 
  const REWARD_TOKEN_ADDRESS_SHIBA = "0x98830a6cc6f8964cec4ffd65f19edebba6fef865"; 

  await deploy("LPStakingShib", {
    contract: "LPStaking",
    from: deployer,
    args: [LP_TOKEN_ADDRESS_SHIBA, REWARD_TOKEN_ADDRESS_SHIBA],
    log: true,
  });
};

module.exports.tags = ["MultipleLPStaking", "LPStakingPePe", "LPStakingShiba"];

