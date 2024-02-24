const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPStaking", function () {
  let LPStaking, lpStaking;
  let MockERC20, mockERC20;
  let MockRewardToken, mockRewardToken;
  let MockPrimordialPlanet, mockPrimordialPlanet;
  let MockCosmicImpact, mockCosmicImpact;
  let MockRewardBooster, mockRewardBooster;
  let owner, user1, user2;
  const primordialPlanetTokenId = 0;
  const cosmicImpactTokenId = 0;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    MockERC20 = await ethers.getContractFactory("MockToken");
    MockRewardToken = await ethers.getContractFactory("MockToken");
    MockPrimordialPlanet = await ethers.getContractFactory("MockPrimordialPlanet");
    MockCosmicImpact = await ethers.getContractFactory("MockCosmicImpact");
    MockRewardBooster = await ethers.getContractFactory("MockRewardBooster");
    LPStaking = await ethers.getContractFactory("LPStaking");

    mockERC20 = await MockERC20.deploy("Mock LP Token", "MLPT");
    mockRewardToken = await MockRewardToken.deploy("Mock Reward Token", "MRT");
    mockPrimordialPlanet = await MockPrimordialPlanet.deploy();
    mockCosmicImpact = await MockCosmicImpact.deploy();
    mockRewardBooster = await MockRewardBooster.deploy();

    lpStaking = await LPStaking.deploy(
      mockERC20.address,
      mockRewardToken.address,
    );
    await mockERC20.mint(user1.address, ethers.utils.parseEther("10000000000000"));
    await mockRewardToken.mint(lpStaking.address, ethers.utils.parseEther("1000000000000"));
    await mockPrimordialPlanet.connect(owner).mint(user1.address);
    await mockCosmicImpact.connect(owner).mint(user2.address);

    await lpStaking.connect(owner).setPrimordialPlanetsContract(mockPrimordialPlanet.address);
    await lpStaking.connect(owner).setCosmicImpactContract(mockCosmicImpact.address);

    await lpStaking.connect(owner).setBoostedRewardCalculator(mockRewardBooster.address);
    await lpStaking.connect(owner).toggleRewardBooster(true);
  });

  describe("Staking LP Tokens", function () {
    it("Should allow users to stake LP tokens and emit an event", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await expect(lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100")))
        .to.emit(lpStaking, 'StakeLP')
        .withArgs(user1.address, ethers.utils.parseEther("100"));
      const stakerInfo = await lpStaking.stakers(user1.address);
      expect(stakerInfo.stakedAmount).to.equal(ethers.utils.parseEther("100"));
    });
  });

  describe("Unstaking LP Tokens", function () {
    it("Should allow users to unstake LP tokens and receive them back", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));  
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).unstakeLPToken(stakerInfo.stakedAmount);
      const userLPBalance = await mockERC20.balanceOf(user1.address);
      expect(userLPBalance).to.equal(ethers.utils.parseEther("10000000000000"));
      const stakerInfoAfterUnstake = await lpStaking.stakers(user1.address);
      expect(stakerInfoAfterUnstake.stakedAmount).to.equal(0);
    });
  });

  describe("Staking NFTs", function () {
    it("Should stake Primordial Planet NFT", async function () {
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user1.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(primordialPlanetTokenId.toString());
    });

    it("Should unstake NFT with Token ID (Primordial Planet):", async function () {
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const stakerInfoBeforeUnstaking = await lpStaking.getStakerInfo(user1.address);
      expect(stakerInfoBeforeUnstaking.nftStaked).to.be.true;
      await lpStaking.connect(user1).unstakeNFTById(primordialPlanetTokenId);
      const stakerInfoAfterUnstaking = await lpStaking.getStakerInfo(user1.address);
      expect(stakerInfoAfterUnstaking.nftStaked).to.equal(false);
    });
  
    it("Should stake Cosmic Impact NFT", async function () {
      await mockCosmicImpact.connect(user2).approve(lpStaking.address, cosmicImpactTokenId);
      await lpStaking.connect(user2).stakeNFTById(cosmicImpactTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user2.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(cosmicImpactTokenId.toString());
    });

    it("Should unstake NFT with Token ID (Cosmic Impact):", async function () {
      await mockCosmicImpact.connect(user2).approve(lpStaking.address, cosmicImpactTokenId);
      await lpStaking.connect(user2).stakeNFTById(cosmicImpactTokenId);
      const stakerInfoBeforeUnstaking = await lpStaking.getStakerInfo(user2.address);
      expect(stakerInfoBeforeUnstaking.nftStaked).to.be.true;
      console.log(`NFT staked before unstaking: ${stakerInfoBeforeUnstaking.nftStaked}`);
      await lpStaking.connect(user2).unstakeNFTById(cosmicImpactTokenId);
      const stakerInfoAfterUnstaking = await lpStaking.getStakerInfo(user2.address);
      console.log(`NFT staked after unstaking: ${stakerInfoAfterUnstaking.nftStaked}`);
      expect(stakerInfoAfterUnstaking.nftStaked).to.equal(false);
    }); 
  });

  describe("Claiming Rewards - 10 days", function () {
    it("Should allow users to claim rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const daysToAdvance = 10;
      const secondsPerDay = 86400;
      await network.provider.send("evm_increaseTime", [daysToAdvance * secondsPerDay]);
      await network.provider.send("evm_mine");
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 100`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Rewards - 100 days", function () {
    it("Should allow users to claim rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const daysToAdvance = 100;
      const secondsPerDay = 86400;
      await network.provider.send("evm_increaseTime", [daysToAdvance * secondsPerDay]);
      await network.provider.send("evm_mine");
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 100`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Boosted Rewards - 10 days", function () {
    it("Should allow users to stake LP tokens, stake an NFT, and claim boosted rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user1.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      console.log(`Staked NFT ID: ${stakedNFTId.toString()}`);
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(primordialPlanetTokenId.toString());
      const daysToAdvance = 10;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const boostPercentage = await mockRewardBooster.getBoostPercentage(primordialPlanetTokenId, mockPrimordialPlanet.address);
      console.log(`Boosted Percentage: ${boostPercentage.toString()}`);
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 100`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Rewards - 10 days with 1000 LP Tokens", function () {
    it("Should allow users to claim rewards for 1000 LP Tokens staked for 10 days", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("1000"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("1000"));
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const daysToAdvance = 10;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 1000`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Rewards - 100 days with 1000 LP Tokens", function () {
    it("Should allow users to claim rewards for 1000 LP Tokens staked for 100 days", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("1000"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("1000"));
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const daysToAdvance = 100;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 1000`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Boosted Rewards - 100 days with 100 LP Tokens", function () {
    it("Should allow users to stake LP tokens, stake an NFT, and claim boosted rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user1.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      console.log(`Staked NFT ID: ${stakedNFTId.toString()}`);
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(primordialPlanetTokenId.toString());
      const daysToAdvance = 100;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const boostPercentage = await mockRewardBooster.getBoostPercentage(primordialPlanetTokenId, mockPrimordialPlanet.address);
      console.log(`Boosted Percentage: ${boostPercentage.toString()}`);
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 100`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Rewards - 365 days with 1000 LP Tokens", function () {
    it("Should allow users to claim rewards for 1000 LP Tokens staked for 100 days", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const daysToAdvance = 365;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 1000`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Boosted Rewards - 365 days", function () {
    it("Should allow users to stake LP tokens, stake an NFT, and claim boosted rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user1.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      console.log(`Staked NFT ID: ${stakedNFTId.toString()}`);
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(primordialPlanetTokenId.toString());
      const daysToAdvance = 365;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const boostPercentage = await mockRewardBooster.getBoostPercentage(primordialPlanetTokenId, mockPrimordialPlanet.address);
      console.log(`Boosted Percentage: ${boostPercentage.toString()}`);
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 100`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Claiming Boosted Rewards - 365 days", function () {
    it("Should allow users to stake LP tokens, stake an NFT, and claim boosted rewards", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("10000000"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("10000000"));
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const lockedNFTInfo = await lpStaking.getLockedNFTInfo(user1.address);
      const stakedNFTId = lockedNFTInfo.stakedNFTId;
      console.log(`Staked NFT ID: ${stakedNFTId.toString()}`);
      expect(lockedNFTInfo.isNFTStaked).to.be.true;
      expect(stakedNFTId.toString()).to.equal(primordialPlanetTokenId.toString());
      const daysToAdvance = 365;
      await network.provider.send("evm_increaseTime", [daysToAdvance * 86400]);
      await network.provider.send("evm_mine");
      const boostPercentage = await mockRewardBooster.getBoostPercentage(primordialPlanetTokenId, mockPrimordialPlanet.address);
      console.log(`Boosted Percentage: ${boostPercentage.toString()}`);
      const initialPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const stakerInfo = await lpStaking.stakers(user1.address);
      await lpStaking.connect(user1).claimReward(stakerInfo.stakedAmount);
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      const rewardAmount = finalPePeBalance.sub(initialPePeBalance);
      console.log(`Staked LP Tokens: 10000000`);
      console.log(`Days Passed: ${daysToAdvance}`);
      console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(rewardAmount)}`);
      expect(rewardAmount).to.be.above(0);
    });
  });

  describe("Should Stake, Claim, Wait, and Claim again", function () {
    it("Should stake for 10 days, claim but leave tokens staking, then claim again after another 10 days", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await advanceTimeAndBlock(10 * 24 * 60 * 60);
      await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
      const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
      await advanceTimeAndBlock(10 * 24 * 60 * 60);
      await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
      const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
      const secondClaimReward = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
      expect(secondClaimReward).to.be.above(balanceAfterFirstClaim);
    });

    it("Should stake for 50 days, claim but leave tokens staking, then claim again after another 50 days", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await advanceTimeAndBlock(50 * 24 * 60 * 60);
      await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
      const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
      await advanceTimeAndBlock(50 * 24 * 60 * 60);
      await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
      const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
      const secondClaimReward = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
      expect(secondClaimReward).to.be.above(balanceAfterFirstClaim);
    });
  });

  describe("Repeated Staking and Claiming Rewards for 10 days", function () {
    it("should stake for 10 days, claim, wait 1 day, and repeat the process once", async function () {
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(10 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
        console.log(`Staked LP Tokens: 100`);
        console.log(`Days Passed: 10`);
        console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(balanceAfterFirstClaim)}`);
        await mockRewardToken.connect(user1).burn(balanceAfterFirstClaim);
        await lpStaking.connect(user1).unstakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(1 * 24 * 60 * 60);
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(10 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
        console.log(`Staked LP Tokens: 100`);
        console.log(`Days Passed: 10`);
        console.log(`Rewarded PPePe Tokens: ${ethers.utils.formatEther(balanceAfterSecondClaim)}`);
        const tolerance = ethers.utils.parseEther("0.0001");
        const balanceDifference = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
        expect(balanceDifference).to.be.at.most(tolerance);
    });
  });
  
  describe("Repeated Staking and Claiming Rewards for 100 days", function () {
    it("should stake for 100 days, claim, wait 1 day, and repeat the process once", async function () {
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(100 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
        await mockRewardToken.connect(user1).burn(balanceAfterFirstClaim);
        await lpStaking.connect(user1).unstakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(1 * 24 * 60 * 60);
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(100 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
        console.log(`First Claim Rewards: ${ethers.utils.formatEther(balanceAfterFirstClaim)}`);
        console.log(`Second Claim Rewards: ${ethers.utils.formatEther(balanceAfterSecondClaim)}`);
        const tolerance = ethers.utils.parseEther("0.0001");
        const balanceDifference = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
        expect(balanceDifference).to.be.at.most(tolerance);
    });
  });

  describe("Repeated Staking and Claiming Rewards for 180 days", function () {
    it("should stake for 180 days, claim, wait 1 day, and repeat the process once", async function () {
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(180 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
        await mockRewardToken.connect(user1).burn(balanceAfterFirstClaim);
        await lpStaking.connect(user1).unstakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(1 * 24 * 60 * 60);
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(180 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
        console.log(`First Claim Rewards: ${ethers.utils.formatEther(balanceAfterFirstClaim)}`);
        console.log(`Second Claim Rewards: ${ethers.utils.formatEther(balanceAfterSecondClaim)}`);
        const tolerance = ethers.utils.parseEther("0.0001");
        const balanceDifference = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
        expect(balanceDifference).to.be.at.most(tolerance);
    });
  });

  describe("Repeated Staking and Claiming Rewards for 365 days", function () {
    it("should stake for 365 days, claim, wait 1 day, and repeat the process once", async function () {
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(365 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterFirstClaim = await mockRewardToken.balanceOf(user1.address);
        await mockRewardToken.connect(user1).burn(balanceAfterFirstClaim);
        await lpStaking.connect(user1).unstakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(1 * 24 * 60 * 60);
        await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
        await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
        await advanceTimeAndBlock(365 * 24 * 60 * 60);
        await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
        const balanceAfterSecondClaim = await mockRewardToken.balanceOf(user1.address);
        console.log(`First Claim Rewards: ${ethers.utils.formatEther(balanceAfterFirstClaim)}`);
        console.log(`Second Claim Rewards: ${ethers.utils.formatEther(balanceAfterSecondClaim)}`);
        const tolerance = ethers.utils.parseEther("0.0001");
        const balanceDifference = balanceAfterSecondClaim.sub(balanceAfterFirstClaim);
        expect(balanceDifference).to.be.at.most(tolerance);
    });
  });

  describe("Staking for 10 days and Restaking for 1 day then Claiming", function () {
    it("should stake tokens, wait 10 days, stake more tokens, wait 1 day, then claim rewards", async function () {
      const initialStakeAmount = ethers.utils.parseEther("100");
      await mockERC20.connect(user1).approve(lpStaking.address, initialStakeAmount);
      await lpStaking.connect(user1).stakeLPToken(initialStakeAmount);
      await advanceTimeAndBlock(10 * 24 * 60 * 60);
      const additionalStakeAmount = ethers.utils.parseEther("100");
      await mockERC20.connect(user1).approve(lpStaking.address, additionalStakeAmount);
      await lpStaking.connect(user1).stakeLPToken(additionalStakeAmount);
      await advanceTimeAndBlock(1 * 24 * 60 * 60);
      await lpStaking.connect(user1).claimReward(initialStakeAmount.add(additionalStakeAmount));
      const finalPePeBalance = await mockRewardToken.balanceOf(user1.address);
      console.log(`Final PePe Token Balance: ${ethers.utils.formatEther(finalPePeBalance)}`);
      expect(finalPePeBalance).to.be.above(0, "Rewards should be greater than 0");
    });  
  });

  describe("getStakerInfo function", function () {
    it("Should return correct staker information", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await mockPrimordialPlanet.connect(user1).approve(lpStaking.address, primordialPlanetTokenId);
      await lpStaking.connect(user1).stakeNFTById(primordialPlanetTokenId);
      const stakerInfo = await lpStaking.getStakerInfo(user1.address);
      console.log(`Staked Amount: ${ethers.utils.formatEther(stakerInfo.stakedAmount)}`);
      console.log(`NFT Staked: ${stakerInfo.nftStaked}`);
      console.log(`Staked NFT ID: ${stakerInfo.stakedNFTId.toString()}`);
      console.log(`LP Stake Time: ${new Date(stakerInfo.lpStakeTime * 1000).toLocaleString()}`);
      console.log(`LP Claim Time: ${new Date(stakerInfo.lpClaimTime * 1000).toLocaleString()}`);
      console.log(`LP Stake Time (exact): ${stakerInfo.lpStakeTime.toString()}`);
      console.log(`LP Claim Time (exact): ${stakerInfo.lpClaimTime.toString()}`);
      expect(stakerInfo.stakedAmount).to.equal(ethers.utils.parseEther("100"));
      expect(stakerInfo.nftStaked).to.equal(true);
      expect(stakerInfo.stakedNFTId).to.equal(primordialPlanetTokenId);
    });
  });
  
  describe("Retrieve staker information after staking for 10 days and claiming", function () {
    it("Should return correct staker information after staking and claiming", async function () {
      await mockERC20.connect(user1).approve(lpStaking.address, ethers.utils.parseEther("100"));
      await lpStaking.connect(user1).stakeLPToken(ethers.utils.parseEther("100"));
      await advanceTimeAndBlock(10 * 86400);
      await lpStaking.connect(user1).claimReward(ethers.utils.parseEther("100"));
      const stakerInfoAfterClaim = await lpStaking.getStakerInfo(user1.address);
      console.log(`Staked Amount: ${ethers.utils.formatEther(stakerInfoAfterClaim.stakedAmount)}`);
      console.log(`NFT Staked: ${stakerInfoAfterClaim.nftStaked}`);
      console.log(`Staked NFT ID: ${stakerInfoAfterClaim.stakedNFTId.toString()}`);
      console.log(`LP Stake Time: ${new Date(stakerInfoAfterClaim.lpStakeTime * 1000).toLocaleString()}`);
      console.log(`LP Claim Time: ${new Date(stakerInfoAfterClaim.lpClaimTime * 1000).toLocaleString()}`);
      console.log(`LP Stake Time (exact): ${stakerInfoAfterClaim.lpStakeTime.toString()}`);
      console.log(`LP Claim Time (exact): ${stakerInfoAfterClaim.lpClaimTime.toString()}`);
      expect(stakerInfoAfterClaim.stakedAmount).to.equal(ethers.utils.parseEther("100"));
    });
  });
  
  describe("Configuration of Boosted Reward Calculator", function () {
    it("Should set a new boosted reward calculator", async function () {
      const NewMockRewardBooster = await ethers.getContractFactory("MockRewardBooster");
      const newMockRewardBooster = await NewMockRewardBooster.deploy();
      const currentBooster = await lpStaking.boostedRewardCalculator();
      await lpStaking.connect(owner).setBoostedRewardCalculator(newMockRewardBooster.address);
      const updatedBooster = await lpStaking.boostedRewardCalculator();
      expect(updatedBooster).to.equal(newMockRewardBooster.address);
      expect(updatedBooster).to.not.equal(currentBooster);
    });    
  });

  describe("Configuration of Primordial Planets Contract", function () {
    it("Should set a new primordial planets contract", async function () {
      const NewMockPrimordialPlanet = await ethers.getContractFactory("MockPrimordialPlanet");
      const newMockPrimordialPlanet = await NewMockPrimordialPlanet.deploy();
      await lpStaking.connect(owner).setPrimordialPlanetsContract(newMockPrimordialPlanet.address);
      const currentPrimordialPlanet = await lpStaking.primordialplanetsAddress();
      expect(currentPrimordialPlanet).to.equal(newMockPrimordialPlanet.address);
    });
  });

  describe("Configuration of Cosmic Impact Contract", function () {
    it("Should set a new cosmic impact contract", async function () {
      const NewMockCosmicImpact = await ethers.getContractFactory("MockCosmicImpact");
      const newMockCosmicImpact = await NewMockCosmicImpact.deploy();
      await lpStaking.connect(owner).setCosmicImpactContract(newMockCosmicImpact.address);
      const currentCosmicImpact = await lpStaking.cosmicimpactsAddress();
      expect(currentCosmicImpact).to.equal(newMockCosmicImpact.address);
    });
  });
  
  describe("Configuration of Staking Token Contract", function () {
    it("Should set a new staking token contract", async function () {
      const NewMockRewardToken = await ethers.getContractFactory("MockToken");
      const newMockRewardToken = await NewMockRewardToken.deploy("New Mock Reward Token", "NMRT");
      await lpStaking.connect(owner).setRewardToken(newMockRewardToken.address);
      const currentPrimordialPePe = await lpStaking.rewardToken();
      expect(currentPrimordialPePe).to.equal(newMockRewardToken.address);
    });
  });

  describe("Toggling Reward Booster", function () {
    it("Should toggle the reward booster", async function () {
      await lpStaking.connect(owner).toggleRewardBooster(false);
      let boosterAddress = await lpStaking.boostedRewardCalculator();
      expect(boosterAddress).to.equal(ethers.constants.AddressZero);
      mockRewardBooster = await MockRewardBooster.deploy();
      await lpStaking.connect(owner).setBoostedRewardCalculator(mockRewardBooster.address);
      await lpStaking.connect(owner).toggleRewardBooster(true);
      boosterAddress = await lpStaking.boostedRewardCalculator();
      expect(boosterAddress).to.not.equal(ethers.constants.AddressZero);
    });
  });  

  async function advanceTimeAndBlock(time) {
    await network.provider.send("evm_increaseTime", [time]);
    await network.provider.send("evm_mine");
  }
  
});