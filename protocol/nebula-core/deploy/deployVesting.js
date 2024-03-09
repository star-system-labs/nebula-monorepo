const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const VESTING_TOKEN_ADDRESS_PPEPE = "0x98830a6CC6f8964CeC4FFD65F19EDeBba6fEf865"; 
  const VESTING_TOKEN_ADDRESS_PEPE = "0x6982508145454ce325ddbe47a25d4ec3d2311933";
  const VESTING_TOKEN_ADDRESS_SHIB = "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce";

  const PRIMORDIAL_PEPE_TOKEN_ADDRESS = "0x98830a6CC6f8964CeC4FFD65F19EDeBba6fEf865"; 

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

