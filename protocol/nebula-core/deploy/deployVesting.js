const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const VESTING_TOKEN_ADDRESS_PPEPE = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc"; 
  const VESTING_TOKEN_ADDRESS_PEPE = "0x27dF660eE7D634401A37de335946472B8928A10E";
  const VESTING_TOKEN_ADDRESS_SHIB = "0xA0DB56d00465c2665acD333A848C5BDEF9D8FD19";

  const PRIMORDIAL_PEPE_TOKEN_ADDRESS = "0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc"; 

  await deploy("VestingPPEPE", {
    contract: "Vesting",
    from: deployer,
    args: [VESTING_TOKEN_ADDRESS_PPEPE, PRIMORDIAL_PEPE_TOKEN_ADDRESS],
    log: true,
  });

  await deploy("VestingPEPE", {
    contract: "Vesting",
    from: deployer,
    args: [VESTING_TOKEN_ADDRESS_PEPE, PRIMORDIAL_PEPE_TOKEN_ADDRESS],
    log: true,
  });

  await deploy("VestingSHIB", {
    contract: "Vesting",
    from: deployer,
    args: [VESTING_TOKEN_ADDRESS_SHIB, PRIMORDIAL_PEPE_TOKEN_ADDRESS],
    log: true,
  });
};

module.exports.tags = ["Vesting", "VestingPPEPE", "VestingPEPE", "VestingSHIB"];

