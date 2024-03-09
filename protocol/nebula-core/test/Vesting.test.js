    const { expect } = require("chai");
    const { ethers } = require("hardhat");

    describe("Vesting", function () {

    let vesting, vestingToken, pepeToken, owner, addr1, addr2;

    beforeEach(async function () {
        const VestingToken = await ethers.getContractFactory("MockToken");
        vestingToken = await VestingToken.deploy("MockToken", "MTKN");

        const PepeToken = await ethers.getContractFactory("TestSpawn");
        pepeToken = await PepeToken.deploy();

        const Vesting = await ethers.getContractFactory("Vesting");
        vesting = await Vesting.deploy(vestingToken.address, pepeToken.address);

        [owner, addr1, addr2] = await ethers.getSigners();

        await vesting.connect(owner).setPrimordialPePeToken(pepeToken.address);
        await pepeToken.connect(owner).grantMinterRole(vesting.address);
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

    it("should not allow vesting more than 10 instances", async function () {
        const timeBrackets = [
            30 * 24 * 60 * 60,
            60 * 24 * 60 * 60,
            90 * 24 * 60 * 60,
            120 * 24 * 60 * 60,
            150 * 24 * 60 * 60,
            180 * 24 * 60 * 60,
            210 * 24 * 60 * 60,
            240 * 24 * 60 * 60,
            270 * 24 * 60 * 60,
        ];
        const amount = ethers.utils.parseUnits("1", 18); 
        for (let i = 0; i < 10; i++) {
            await vestingToken.connect(owner).mint(addr1.address, amount);
            await vestingToken.connect(addr1).approve(vesting.address, amount);
            await vesting.connect(addr1).vestTokens(amount, i % timeBrackets.length);
        }
    
        await vestingToken.connect(owner).mint(addr1.address, amount);
        await vestingToken.connect(addr1).approve(vesting.address, amount);
        await expect(vesting.connect(addr1).vestTokens(amount, 0))
            .to.be.revertedWith("Max vesting positions reached");
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

    it("should display all vests and slots for a user", async function () {
        const amount = ethers.utils.parseUnits("100", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);
        await vestingToken.connect(addr1).approve(vesting.address, amount);
        await vesting.connect(addr1).vestTokens(amount, 0);
    
        const vests = await vesting.getAllVests(addr1.address);
        const [slotsAvailability, vestsData] = await vesting.getAllSlots(addr1.address);
    
        console.log("Vests:", vests);
        console.log("Slots Availability:", slotsAvailability);
        console.log("Vests Data in Slots:", vestsData);
    
        expect(vests.length).to.be.greaterThan(0);
        expect(slotsAvailability.length).to.equal(10);
        expect(vestsData.length).to.equal(10);
    });
    
    it("should find the correct time bracket index - 45 days", async function () {
        const days = 30;
        const secondsPerDay = 86400;
        const timeInSeconds = days * secondsPerDay;
        const timeBracketIndex = await vesting.findTimeBracketIndex(timeInSeconds);
        expect(timeBracketIndex).to.equal(0); 
    });

    it("should find the correct time bracket index - 120 days", async function () {
        const days = 120;
        const secondsPerDay = 86400;
        const timeInSeconds = days * secondsPerDay;
        const timeBracketIndex = await vesting.findTimeBracketIndex(timeInSeconds);
        expect(timeBracketIndex).to.equal(3); 
    });

    it("should overwrite vest data when reusing a slot", async function () {
        let amount = ethers.utils.parseUnits("1000", 18);
        await vestingToken.connect(owner).mint(addr1.address, amount);
        await vestingToken.connect(addr1).approve(vesting.address, amount);
        await vesting.connect(addr1).vestTokens(amount, 0);
    
        await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await vesting.connect(addr1).claimRewards(0);
    
        amount = ethers.utils.parseUnits("2000", 18); 
        await vestingToken.connect(owner).mint(addr1.address, amount);
        await vestingToken.connect(addr1).approve(vesting.address, amount);
        await vesting.connect(addr1).vestTokens(amount, 1);
    
        const vest = await vesting.getVest(addr1.address, 0);
    
        expect(vest.amount.toString()).to.equal(amount.toString());
    });

    });