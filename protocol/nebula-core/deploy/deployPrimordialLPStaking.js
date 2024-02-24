const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const PRIMORDIAL_LP_TOKEN_ADDRESS = "0x60bd6109B4C0E37a23b846f6e9b62b3cB1Bb8813";
  const SDIV_TOKEN_ADDRESS = "0xa9Bc7a237a84b9597736209dB590149b75996841"; 

  await deploy("PrimordialLPStaking", {
    from: deployer,
    args: [PRIMORDIAL_LP_TOKEN_ADDRESS, SDIV_TOKEN_ADDRESS],
    log: true,
  });
};

module.exports.tags = ["PrimordialLPStaking"];