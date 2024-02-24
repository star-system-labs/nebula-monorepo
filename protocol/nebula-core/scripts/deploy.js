const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; 
    const PEPE_ADDRESS = "0x6982508145454Ce325dDbE47a25d4ec3d2311933";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const COSMIC_DISTILLERY_ADDRESS = "0xC11DdC53D75B03Eaa8BaFDdb795572059eCEb324";

    const PrimordialPePe = await hre.ethers.getContractFactory("PrimordialPePe");
    const primordialPePeInstance = await PrimordialPePe.deploy(deployer.address, deployer.address);
    await primordialPePeInstance.deployed();
    console.log("PrimordialPePe deployed to:", primordialPePeInstance.address);

    const MiningRig = await hre.ethers.getContractFactory("MiningRig");
    const miningRigInstance = await MiningRig.deploy(
        NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        primordialPePeInstance.address, 
        PEPE_ADDRESS,
        WETH_ADDRESS,
        COSMIC_DISTILLERY_ADDRESS
    );

    await miningRigInstance.deployed();
    console.log("MiningRig deployed to:", miningRigInstance.address);

    const tx1 = await miningRigInstance.bootUp(2000, { value: hre.ethers.utils.parseEther("0.01") });
    await tx1.wait();
    console.log("Called BootUp function on MiningRig");

    const tx2 = await miningRigInstance.mineLiquidity(2000, { value: hre.ethers.utils.parseEther("0.01") });
    await tx2.wait();
    console.log("Called mineLiquidity function on MiningRig");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
