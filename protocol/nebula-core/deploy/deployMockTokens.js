const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const tokens = [
    { name: "PrimordialPePe", symbol: "PPEPE", amount: ethers.utils.parseUnits("100000000", 18) }, // 100 mln
    { name: "PePe", symbol: "PEPE", amount: ethers.utils.parseUnits("100000000000", 18) }, // 100 bln
    { name: "ShibaInu", symbol: "SHIB", amount: ethers.utils.parseUnits("100000000000000", 18) }, // 100 tln
    { name: "LPTokenPePe", symbol: "LPTP", amount: ethers.utils.parseUnits("100000", 18) }, // 100k
    { name: "LPTokenShiba", symbol: "LPTS", amount: ethers.utils.parseUnits("100000", 18) }, // 100k
    { name: "LPTokenPPePe", symbol: "LPTPP", amount: ethers.utils.parseUnits("100000", 18) }, // 100k
    { name: "StarDustDividends", symbol: "SDIV", amount: ethers.utils.parseUnits("100000000", 18) }, // 100 mln
  ];

  for (const token of tokens) {
    const deployedToken = await deploy(token.name, {
      contract: "MockToken",
      from: deployer,
      args: [token.name, token.symbol],
      log: true,
      gasPrice: ethers.utils.parseUnits('25', 'gwei'),
    });

    const tokenContract = await ethers.getContractAt("MockToken", deployedToken.address);
    await tokenContract.mint(deployer, token.amount);
    console.log(`Minted ${token.amount} ${token.symbol} to ${deployer}`);
  }
};

module.exports.tags = ["MockTokens"];