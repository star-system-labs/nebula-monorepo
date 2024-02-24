const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrimordialPePe", function() {
	let ppepe, owner, addr1, addr2, mockPlanet;
	const TOKEN_ID_1 = 1;
	const TOKEN_ID_2 = 2;

	beforeEach(async function() {
		const MockPlanet = await ethers.getContractFactory("MockPrimordialPlanet");
		mockPlanet = await MockPlanet.deploy();
		await mockPlanet.deployed();

		const PrimordialPePe = await ethers.getContractFactory("PrimordialPePe");
		ppepe = await PrimordialPePe.deploy();
		await ppepe.deployed();

		await ppepe.setAddresses(mockPlanet.address);

		[owner, addr1, addr2] = await ethers.getSigners();

		await mockPlanet.mint(owner.address);
		await mockPlanet.mint(owner.address);

        STAKE_LIMIT = await ppepe.STAKE_LIMIT();
	});

	it("should stake planets", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);

		expect(await ppepe.tokensStaked(owner.address)).to.deep.equal([TOKEN_ID_1]);
	});

	it("should unstake planets", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		await ppepe.unstakePlanetByIds([TOKEN_ID_1]);

		expect(await ppepe.tokensStaked(owner.address)).to.deep.equal([]);
	});

    it("should stake the maximum number of planets and claim rewards", async function() {
        const planetIds = [];
        for (let i = 1; i <= STAKE_LIMIT; i++) {
            await mockPlanet.mint(owner.address);
            planetIds.push(i);
        }

        for (let i = 0; i < STAKE_LIMIT; i++) {
            await mockPlanet.approve(ppepe.address, planetIds[i]);
        }

        await ppepe.stakePlanetByIds(planetIds);
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");
        await ppepe.claimAllRewards();
        await ppepe.unstakeAll();

        expect(await ppepe.tokensStaked(owner.address)).to.deep.equal([]);
        expect(await ppepe.balanceOf(owner.address)).to.be.above(0);
    });

    it("should not allow staking more than the maximum number of planets", async function() {
        const planetIds = [];
        for (let i = 1; i <= STAKE_LIMIT + 1; i++) {
            await mockPlanet.mint(owner.address);
            planetIds.push(i);
        }

        for (let i = 0; i < STAKE_LIMIT + 1; i++) {
            await mockPlanet.approve(ppepe.address, planetIds[i]);
        }

        await expect(ppepe.stakePlanetByIds(planetIds)).to.be.revertedWith("Can only have a max of 25 planets staked in your solar system!");
    });

    it("should only allow NFT owners to stake their planets", async function() {
        await expect(ppepe.connect(addr1).stakePlanetByIds([TOKEN_ID_1])).to.be.revertedWith("Can only stake planets in your domain!");
    });

    it("should only allow NFT stakers to unstake their planets", async function() {
        await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
        await ppepe.stakePlanetByIds([TOKEN_ID_1]);
        await expect(ppepe.connect(addr1).unstakePlanetByIds([TOKEN_ID_1])).to.be.revertedWith("Can only unstake planets in your solar system!");
    });

    it("should allow minters to mint tokens", async function() {
        const initialBalance = await ppepe.balanceOf(addr1.address);
        await ppepe.connect(owner).grantMinterRole(addr1.address);
        await ppepe.connect(addr1).mint(addr1.address, 1000);
        const finalBalance = await ppepe.balanceOf(addr1.address);
        expect(finalBalance.sub(initialBalance)).to.equal(1000);
    });    

	it("should claim rewards by IDs", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		await ethers.provider.send("evm_increaseTime", [86400]);
		await ethers.provider.send("evm_mine");
		await ppepe.claimRewardsByIds([TOKEN_ID_1]);
		expect(await ppepe.balanceOf(owner.address)).to.be.above(0);
	});

	it("should claim all rewards", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await mockPlanet.approve(ppepe.address, TOKEN_ID_2);
		await ppepe.stakePlanetByIds([TOKEN_ID_1, TOKEN_ID_2]);
		await ethers.provider.send("evm_increaseTime", [86400]);
		await ethers.provider.send("evm_mine");
		await ppepe.claimAllRewards();
		expect(await ppepe.balanceOf(owner.address)).to.be.above(0);
	});

	it("should unstake all planets", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await mockPlanet.approve(ppepe.address, TOKEN_ID_2);
		await ppepe.stakePlanetByIds([TOKEN_ID_1, TOKEN_ID_2]);
		await ppepe.unstakeAll();
		expect(await ppepe.tokensStaked(owner.address)).to.deep.equal([]);
	});

	it("should return staked planet data", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		const data = await ppepe.getStakedPlanetData(owner.address);
		expect(data[0].tokenId).to.equal(TOKEN_ID_1);
	});

	it("should return tokens staked", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		const tokens = await ppepe.tokensStaked(owner.address);
		expect(tokens).to.deep.equal([TOKEN_ID_1]);
	});

	it("should return staked planet quantity", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		const quantity = await ppepe.stakedPlanetQuantity(owner.address);
		expect(quantity).to.equal(1);
	});

	it("should return primordial owed to planet", async function() {
        await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
        await ppepe.stakePlanetByIds([TOKEN_ID_1]);
    
        // Simulate the passage of 1 day
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");
    
        const owed = await ppepe.getPrimordialOwedToThisPlanet(TOKEN_ID_1);
        expect(owed).to.be.above(0);
    });    

	it("should return total rewards for user", async function() {
        await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
        await ppepe.stakePlanetByIds([TOKEN_ID_1]);
    
        // Simulate the passage of 1 day
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");
    
        const total = await ppepe.getTotalRewardsForUser(owner.address);
        expect(total).to.be.above(0);
    });    

	it("should return planet primordial emission", async function() {
		await mockPlanet.approve(ppepe.address, TOKEN_ID_1);
		await ppepe.stakePlanetByIds([TOKEN_ID_1]);
		const emission = await ppepe.getPlanetPrimordialEmission(TOKEN_ID_1);
		expect(emission).to.be.above(0);
	});

	it("should grant and revoke admin role", async function() {
		await ppepe.grantAdminRole(addr1.address);
		expect(await ppepe.hasRole(ppepe.DEFAULT_ADMIN_ROLE(), addr1.address)).to.be.true;

		await ppepe.revokeAdminRole(addr1.address);
		expect(await ppepe.hasRole(ppepe.DEFAULT_ADMIN_ROLE(), addr1.address)).to.be.false;
	});

    it("should allow admin to grant and revoke minter role", async function() {
        await ppepe.connect(owner).grantMinterRole(addr1.address);
        expect(await ppepe.hasRole(ppepe.MINTER_ROLE(), addr1.address)).to.be.true;
    
        await ppepe.connect(owner).revokeMinterRole(addr1.address);
        expect(await ppepe.hasRole(ppepe.MINTER_ROLE(), addr1.address)).to.be.false;
    });    

	it("should not allow non-admin to grant minter role", async function() {
		await expect(ppepe.connect(addr1).grantMinterRole(addr2.address)).to.be.revertedWith("PrimordialPePe: must have admin role to grant minter role");
	});

    it("should correctly enumerate minters and admins", async function() {
        await ppepe.connect(owner).grantMinterRole(addr1.address);
        await ppepe.connect(owner).grantAdminRole(addr2.address);
        expect(await ppepe.getMinter(0)).to.equal(owner.address);
        expect(await ppepe.getMinter(1)).to.equal(addr1.address);
        expect(await ppepe.getAdmin(0)).to.equal(owner.address);
        expect(await ppepe.getAdmin(1)).to.equal(addr2.address);
    });    

	it("should allow owner to set primordial planets address", async function() {
        await ppepe.setAddresses(addr1.address);
        expect(await ppepe.primordialplanetsAddress()).to.equal(addr1.address);
    });    

});
