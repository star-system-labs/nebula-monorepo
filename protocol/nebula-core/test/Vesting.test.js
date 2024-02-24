    const { expect } = require("chai");
    const { ethers } = require("hardhat");

    describe("Vesting", function () {

    let vesting, vestingToken, pepeToken, planets, impacts, owner, addr1, addr2;

    beforeEach(async function () {
        const VestingToken = await ethers.getContractFactory("MockToken");
        vestingToken = await VestingToken.deploy("MockToken", "MTKN");

        const PepeToken = await ethers.getContractFactory("MockPrimordialPePe");
        pepeToken = await PepeToken.deploy();
        
        const Planets = await ethers.getContractFactory("MockPrimordialPlanet"); 
        planets = await Planets.deploy();

        const Impacts = await ethers.getContractFactory("MockCosmicImpact");
        impacts = await Impacts.deploy();

        const Vesting = await ethers.getContractFactory("Vesting");
        vesting = await Vesting.deploy(vestingToken.address, pepeToken.address);

        [owner, addr1, addr2] = await ethers.getSigners();

        await vesting.connect(owner).setPrimordialPePeToken(pepeToken.address);
        await vesting.connect(owner).setPrimordialPlanets(planets.address);
        await vesting.connect(owner).setCosmicImpacts(impacts.address);
        await pepeToken.connect(owner).grantMinterRole(vesting.address);
    });

    it("should allow staking and unstaking Planets & Impacts", async function () {
        const planetId = 0;
        const impactId = 0;
        await planets.connect(owner).mint(addr1.address);
        await impacts.connect(owner).mint(addr1.address);

        await planets.connect(addr1).approve(vesting.address, planetId);
        await vesting.connect(addr1).stakePlanet(planetId);

        expect(await planets.ownerOf(planetId)).to.equal(vesting.address);

        await vesting.connect(addr1).unstakePlanet();  
        expect(await planets.ownerOf(planetId)).to.equal(addr1.address);

        await impacts.connect(addr1).approve(vesting.address, impactId);
        await vesting.connect(addr1).stakeImpact(impactId);

        expect(await impacts.ownerOf(impactId)).to.equal(vesting.address);

        await vesting.connect(addr1).unstakeImpact();  
        expect(await impacts.ownerOf(impactId)).to.equal(addr1.address);
    });

    it("should vest 10 million tokens and claim rewards", async function () {
        const amount = ethers.utils.parseUnits("10000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        const addr1BalanceBefore = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(addr1BalanceBefore, 18)} vestingTokens before claiming rewards`);
        expect(addr1BalanceBefore).to.equal(amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        console.log(`Address addr1 has approved ${ethers.utils.formatUnits(allowance, 18)} vestingTokens for the Vesting contract`);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0); 

        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
        await ethers.provider.send("evm_mine");

        await vesting.connect(addr1).claimRewards(0);
        const rewards = await pepeToken.balanceOf(addr1.address);
        const balance = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has claimed ${ethers.utils.formatUnits(rewards, 18)} pepeTokens`);
        const vestingTokenBalanceAfterClaim = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(vestingTokenBalanceAfterClaim, 18)} vestingTokens after claiming rewards`);
        expect(balance).to.equal(amount);
    });

    it("should vest 10 billion tokens and claim rewards", async function () {
        const amount = ethers.utils.parseUnits("10000000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        const addr1BalanceBefore = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(addr1BalanceBefore, 18)} vestingTokens before claiming rewards`);
        expect(addr1BalanceBefore).to.equal(amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        console.log(`Address addr1 has approved ${ethers.utils.formatUnits(allowance, 18)} vestingTokens for the Vesting contract`);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0); 

        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
        await ethers.provider.send("evm_mine");

        await vesting.connect(addr1).claimRewards(0);
        const rewards = await pepeToken.balanceOf(addr1.address);
        const balance = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has claimed ${ethers.utils.formatUnits(rewards, 18)} pepeTokens`);
        const vestingTokenBalanceAfterClaim = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(vestingTokenBalanceAfterClaim, 18)} vestingTokens after claiming rewards`);
        expect(balance).to.equal(amount);
    });

    it("should vest 1 trillion tokens and claim rewards", async function () {
        const amount = ethers.utils.parseUnits("1000000000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        const addr1BalanceBefore = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(addr1BalanceBefore, 18)} vestingTokens before claiming rewards`);
        expect(addr1BalanceBefore).to.equal(amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        console.log(`Address addr1 has approved ${ethers.utils.formatUnits(allowance, 18)} vestingTokens for the Vesting contract`);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0); 

        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
        await ethers.provider.send("evm_mine");

        await vesting.connect(addr1).claimRewards(0);
        const rewards = await pepeToken.balanceOf(addr1.address);
        const balance = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has claimed ${ethers.utils.formatUnits(rewards, 18)} pepeTokens`);
        const vestingTokenBalanceAfterClaim = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(vestingTokenBalanceAfterClaim, 18)} vestingTokens after claiming rewards`);
        expect(balance).to.equal(amount);
    });

    it("should vest 10 trillion tokens and claim rewards", async function () {
        const amount = ethers.utils.parseUnits("10000000000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        const addr1BalanceBefore = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(addr1BalanceBefore, 18)} vestingTokens before claiming rewards`);
        expect(addr1BalanceBefore).to.equal(amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        console.log(`Address addr1 has approved ${ethers.utils.formatUnits(allowance, 18)} vestingTokens for the Vesting contract`);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0); 

        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
        await ethers.provider.send("evm_mine");

        await vesting.connect(addr1).claimRewards(0);
        const rewards = await pepeToken.balanceOf(addr1.address);
        const balance = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has claimed ${ethers.utils.formatUnits(rewards, 18)} pepeTokens`);
        const vestingTokenBalanceAfterClaim = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(vestingTokenBalanceAfterClaim, 18)} vestingTokens after claiming rewards`);
        expect(balance).to.equal(amount);
    });

    it("should vest 100 trillion tokens and claim rewards", async function () {
        const amount = ethers.utils.parseUnits("100000000000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        const addr1BalanceBefore = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(addr1BalanceBefore, 18)} vestingTokens before claiming rewards`);
        expect(addr1BalanceBefore).to.equal(amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        console.log(`Address addr1 has approved ${ethers.utils.formatUnits(allowance, 18)} vestingTokens for the Vesting contract`);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0); 

        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
        await ethers.provider.send("evm_mine");

        await vesting.connect(addr1).claimRewards(0);
        const rewards = await pepeToken.balanceOf(addr1.address);
        const balance = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has claimed ${ethers.utils.formatUnits(rewards, 18)} pepeTokens`);
        const vestingTokenBalanceAfterClaim = await vestingToken.balanceOf(addr1.address);
        console.log(`Address addr1 has ${ethers.utils.formatUnits(vestingTokenBalanceAfterClaim, 18)} vestingTokens after claiming rewards`);
        expect(balance).to.equal(amount);
    });

    it("should allow emergency withdraw", async function () {
        const amount = ethers.utils.parseUnits("10000000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);

        await vestingToken.connect(addr1).approve(vesting.address, amount);

        const allowance = await vestingToken.allowance(addr1.address, vesting.address);
        expect(allowance).to.equal(amount);

        await vesting.connect(addr1).vestTokens(amount, 0);

        const vestingContractBalance = await vestingToken.balanceOf(vesting.address);
        expect(vestingContractBalance).to.equal(amount);

        await vesting.connect(addr1).emergencyWithdraw(0);

        const addr1FinalBalance = await vestingToken.balanceOf(addr1.address);
        expect(addr1FinalBalance).to.equal(amount);
    });

    it("should set the vesting token by owner", async function () {
        const newToken = await ethers.getContractFactory("MockToken");
        const newTokenDeployed = await newToken.deploy("NewMockToken", "NMTKN");
        
        await expect(vesting.connect(owner).setVestingToken(newTokenDeployed.address));
        expect(await vesting.vestingToken()).to.equal(newTokenDeployed.address);
    });
      
    it("should only allow the owner to set the vesting token", async function () {
        const newToken = await ethers.getContractFactory("MockToken");
        const newTokenDeployed = await newToken.deploy("NewMockToken", "NMTKN");
        
        await expect(vesting.connect(addr1).setVestingToken(newTokenDeployed.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should return correct vests count for a user", async function () {
        const vestAmount1 = ethers.utils.parseUnits("100", 18);
        const vestAmount2 = ethers.utils.parseUnits("200", 18);
    
        await vestingToken.connect(owner).mint(addr1.address, vestAmount1.add(vestAmount2));
    
        await vestingToken.connect(addr1).approve(vesting.address, vestAmount1.add(vestAmount2));
    
        await vesting.connect(addr1).vestTokens(vestAmount1, 0);
        await vesting.connect(addr1).vestTokens(vestAmount2, 1);
        
        expect(await vesting.getVestCount(addr1.address)).to.equal(2);
    });    
      
    it("should return a specific vest for a user", async function () {
        const vestAmount = ethers.utils.parseUnits("100", 18);
    
        await vestingToken.connect(owner).mint(addr1.address, vestAmount);
        await vestingToken.connect(addr1).approve(vesting.address, vestAmount);
        await vesting.connect(addr1).vestTokens(vestAmount, 0);
        
        const vest = await vesting.getVest(addr1.address, 0);
        expect(vest.amount).to.equal(vestAmount);
    });    
      
    it("should return all vests for a user", async function () {
        const vestAmount1 = ethers.utils.parseUnits("1000000", 18);
        const vestAmount2 = ethers.utils.parseUnits("2000000", 18);
    
        await vestingToken.connect(owner).mint(addr1.address, vestAmount1.add(vestAmount2));
        await vestingToken.connect(addr1).approve(vesting.address, vestAmount1.add(vestAmount2));
        await vesting.connect(addr1).vestTokens(vestAmount1, 0);
        await vesting.connect(addr1).vestTokens(vestAmount2, 1);
        
        const vests = await vesting.getAllVests(addr1.address);
        expect(vests.length).to.equal(2);
    });    
    
    it("should find the correct time bracket index", async function () {
        const days = 45;
        const secondsPerDay = 86400;
        const timeInSeconds = days * secondsPerDay;
        const timeBracketIndex = await vesting.findTimeBracketIndex(timeInSeconds);
        expect(timeBracketIndex).to.equal(1); 
    });

    it("should toggle the reward booster contract", async function () {
        const RewardBooster = await ethers.getContractFactory("MockRewardBooster");
        const rewardBooster = await RewardBooster.deploy();
        
        await vesting.connect(owner).toggleRewardBooster(rewardBooster.address);
        expect(await vesting.rewardBoosterContract()).to.equal(rewardBooster.address);
    });
      
    it("should only allow the owner to toggle the reward booster contract", async function () {
        const RewardBooster = await ethers.getContractFactory("MockRewardBooster");
        const rewardBooster = await RewardBooster.deploy();
        
        await expect(vesting.connect(addr1).toggleRewardBooster(rewardBooster.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
    });

    });