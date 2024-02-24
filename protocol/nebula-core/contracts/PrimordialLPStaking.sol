// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPrimordialPePe.sol";
import "./RewardBooster.sol";
import "hardhat/console.sol";

contract PrimordialLPStaking is Ownable, ReentrancyGuard {
    IERC20 public primordialLPToken;
    address public primordialplanetsAddress;
    address public cosmicimpactsAddress;
    IPrimordialPePe public primordialPePeToken;
    BoostedRewardCalculator public boostedRewardCalculator;

    struct StakerInfo {
        uint256 stakedAmount;
        bool lpStaked;
        bool nftStaked;
    }

    mapping(address => StakerInfo) public stakers;
    using EnumerableSet for EnumerableSet.UintSet;
    mapping(address => EnumerableSet.UintSet) private stakedNFTs;
    mapping(address => address) public nftAddress;

    mapping(address => uint256) public lpStakeTimes;
    mapping(address => uint256) public lpClaimTimes;

    event StakeLP(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 rewardAmount);
    event StakeNFT(address indexed user, address indexed nftAddress, uint256 tokenId);

    constructor(address _primordialLPAddress, 
                address _primordialPePeAddress) {
        primordialLPToken = IERC20(_primordialLPAddress);
        primordialPePeToken = IPrimordialPePe(_primordialPePeAddress);
        boostedRewardCalculator = BoostedRewardCalculator(address(0));
    }

    function stakeLPToken(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        _stakeLPToken(msg.sender, amount);
    }

    function unstakeLPToken(uint256 _stakedAmount) public {
        require(stakers[msg.sender].stakedAmount > 0, "No staked LP tokens");
        _unstakeLPToken(_stakedAmount, msg.sender);
    }

    function _stakeLPToken(address stakerAddress, uint256 amount) internal onlyLPOwner nonReentrant {
        StakerInfo storage staker = stakers[stakerAddress];
        require(amount > 0, "Cannot stake 0");

        primordialLPToken.transferFrom(stakerAddress, address(this), amount);
        staker.stakedAmount += amount;
        lpStakeTimes[stakerAddress] = block.timestamp;

        if (!staker.lpStaked) {
            lpClaimTimes[stakerAddress] = 0;
            staker.lpStaked = true;
        }
        
        emit StakeLP(stakerAddress, amount);
    }

    function _unstakeLPToken(uint256 _stakedAmount, address _staker) internal onlyLPStaker nonReentrant {
        StakerInfo storage staker = stakers[_staker];
        require(staker.stakedAmount > 0, "No staked LP tokens");

        uint256 primordialOwed;
        if (staker.nftStaked) {
            primordialOwed = calculateBoostedPrimordial(_stakedAmount, _staker);
        } else {
            primordialOwed = getBasePrimordialOwed(_stakedAmount, _staker);
        }

        primordialPePeToken.mint(_staker, primordialOwed);
        primordialLPToken.transfer(_staker, staker.stakedAmount);
        staker.stakedAmount -= _stakedAmount;

        if (staker.stakedAmount == 0) {
        staker.lpStaked = false;
        }
        lpClaimTimes[_staker] = block.timestamp;

        emit Claimed(_staker, primordialOwed);
    }

    function stakeNFTById(uint256 _nftId) external {
        require(!stakers[msg.sender].nftStaked, "Already staked an NFT");
        _stakeNFT(_nftId);
    }

    function unstakeNFTById(uint256 _nftId) public {
        require(stakers[msg.sender].nftStaked, "No staked NFT");
        _unstakeNFT(_nftId);
    }

    function _stakeNFT(uint256 _nftId) internal onlyNFTOwner(_nftId) nonReentrant {
        require(!stakers[msg.sender].nftStaked, "Already staked with an NFT");

        address collectionAddress;
        if (IERC721Enumerable(primordialplanetsAddress).ownerOf(_nftId) == msg.sender) {
            collectionAddress = primordialplanetsAddress;
        } else if (IERC721Enumerable(cosmicimpactsAddress).ownerOf(_nftId) == msg.sender) {
            collectionAddress = cosmicimpactsAddress;
        } else {
            revert("NFT does not belong to a supported collection");
        }

        nftAddress[msg.sender] = collectionAddress;

        IERC721Enumerable(collectionAddress).transferFrom(msg.sender, address(this), _nftId);
        stakedNFTs[msg.sender].add(_nftId);
        stakers[msg.sender].nftStaked = true;
        emit StakeNFT(msg.sender, collectionAddress, _nftId);
    }

    function _unstakeNFT(uint256 _nftId) internal onlyNFTStaker(_nftId) nonReentrant {
        require(stakers[msg.sender].nftStaked, "No staked NFT");
        address _nftAddress = nftAddress[msg.sender];
        require(_nftAddress == primordialplanetsAddress || _nftAddress == cosmicimpactsAddress, "Invalid NFT collection");
        
        IERC721Enumerable(_nftAddress).transferFrom(address(this), msg.sender, _nftId);
        stakedNFTs[msg.sender].remove(_nftId);
        nftAddress[msg.sender] = address(0);
        stakers[msg.sender].nftStaked = false;
    }

    function claimReward(uint256 _stakedAmount) external nonReentrant {
        console.log("Claiming reward for address:", msg.sender);
        StakerInfo storage staker = stakers[msg.sender];
        uint256 reward;
        if (staker.nftStaked) {
            console.log("Calculating boosted reward");
            reward = calculateBoostedPrimordial(_stakedAmount, msg.sender);
            console.log("Boosted reward:", reward);
        } else {
            reward = getBasePrimordialOwed(_stakedAmount, msg.sender);
        }

        require(reward > 0, "No rewards available");
        console.log("Minting reward");
        primordialPePeToken.mint(msg.sender, reward);
        console.log("Reward minted");
        console.log("reward minted:", reward);
        lpClaimTimes[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, reward);
    }

    function calculateBoostedPrimordial(uint256 _stakedAmount, address _staker) public view returns (uint256) {
        StakerInfo storage staker = stakers[_staker];
        uint256 elapsedTime = block.timestamp - lpStakeTimes[_staker];
        uint256 elapsedDays = elapsedTime < 1 days ? 0 : elapsedTime / 1 days;
        uint256 leftoverSeconds = elapsedTime - elapsedDays * 1 days;
        
        console.log("Elapsed Time:", elapsedTime);
        console.log("Elapsed Days:", elapsedDays);
        console.log("Leftover Seconds:", leftoverSeconds);

        uint256 boostPercentage = 0;
        if (staker.nftStaked) {
            uint256 stakedNFTId = stakedNFTs[_staker].at(0);
            address nftCollectionAddress = nftAddress[_staker];
            boostPercentage = boostedRewardCalculator.getBoostPercentage(stakedNFTId, nftCollectionAddress);

            console.log("Staked NFT ID:", stakedNFTId);
            console.log("NFT Collection Address:", nftCollectionAddress);
            console.log("Boost Percentage:", boostPercentage);
        }

        if (lpClaimTimes[_staker] == 0) {
            return _calculatePrimordialWithBoost(_stakedAmount, elapsedDays, leftoverSeconds, boostPercentage);
        }

        uint256 elapsedTimeSinceClaim = lpClaimTimes[_staker] -
            lpStakeTimes[_staker];
        uint256 elapsedDaysSinceClaim = elapsedTimeSinceClaim < 1 days
            ? 0
            : elapsedTimeSinceClaim / 1 days;
        uint256 leftoverSecondsSinceClaim = elapsedTimeSinceClaim -
            elapsedDaysSinceClaim *
            1 days;

        return
            _calculatePrimordialWithBoost(_stakedAmount, elapsedDays, leftoverSeconds, boostPercentage) - 
            _calculatePrimordialWithBoost(_stakedAmount, elapsedDaysSinceClaim, leftoverSecondsSinceClaim, boostPercentage);        
    }

    function getBasePrimordialOwed(uint256 _stakedAmount, address _staker) public view returns (uint256) {
        uint256 elapsedTime = block.timestamp - lpStakeTimes[_staker];
        uint256 elapsedDays = elapsedTime < 1 days ? 0 : elapsedTime / 1 days;
        uint256 leftoverSeconds = elapsedTime - elapsedDays * 1 days;

        if (lpClaimTimes[_staker] == 0) {
            return _calculatePrimordial(_stakedAmount, elapsedDays, leftoverSeconds);
        }

        uint256 elapsedTimeSinceClaim = lpClaimTimes[_staker] -
            lpStakeTimes[_staker];
        uint256 elapsedDaysSinceClaim = elapsedTimeSinceClaim < 1 days
            ? 0
            : elapsedTimeSinceClaim / 1 days;
        uint256 leftoverSecondsSinceClaim = elapsedTimeSinceClaim -
            elapsedDaysSinceClaim *
            1 days;

        return
            _calculatePrimordial(_stakedAmount, elapsedDays, leftoverSeconds) -
            _calculatePrimordial(_stakedAmount, elapsedDaysSinceClaim, leftoverSecondsSinceClaim);
    }

    function getStakerInfo(address _staker) 
        public 
        view 
        returns (
            uint256 stakedAmount, 
            bool nftStaked, 
            uint256 stakedNFTId, 
            uint256 lpStakeTime, 
            uint256 lpClaimTime
        ) 
        {
        StakerInfo storage staker = stakers[_staker];
        stakedAmount = staker.stakedAmount;
        nftStaked = staker.nftStaked;

        stakedNFTId = 0;
        if (nftStaked) {
            EnumerableSet.UintSet storage stakedNFTSet = stakedNFTs[_staker];
            if (stakedNFTSet.length() > 0) {
                stakedNFTId = stakedNFTSet.at(0);
            }
        }

        lpStakeTime = lpStakeTimes[_staker];
        lpClaimTime = lpClaimTimes[_staker];
    }

    function isNFTStaked(address _user, uint256 _nftId) public view returns (bool) {
        return stakedNFTs[_user].contains(_nftId);
    }

    function getLockedNFTInfo(address _staker) public view returns (address nftCollectionAddress, bool isNFTStaked, uint256 stakedNFTId) {
            nftCollectionAddress = nftAddress[_staker]; // Address of the NFT collection
            isNFTStaked = stakers[_staker].nftStaked; // Check if any NFT is staked

            // Initialize stakedNFTId to an arbitrary value, say max uint256
            stakedNFTId = type(uint256).max; // Indicates no NFT is staked

        if (isNFTStaked && stakedNFTs[_staker].length() > 0) {
            stakedNFTId = stakedNFTs[_staker].at(0); // Retrieve the ID of the staked NFT
        }
    }

    function getPrimordialEmission(address _address) public view returns (uint256) {
        uint256 elapsedTime = block.timestamp - lpStakeTimes[_address];
        uint256 elapsedDays = elapsedTime < 1 days ? 0 : elapsedTime / 1 days;
        return _primordialDailyIncrement(elapsedDays);
    }

    function _calculatePrimordialWithBoost(uint256 _stakedAmount, uint256 _days, uint256 _leftoverSeconds, uint256 _boostPercentage) internal pure returns (uint256) {
        uint256 totalReward = _calculatePrimordial(_stakedAmount, _days, _leftoverSeconds);
        console.log("Total reward before boost:", totalReward);

        // Adjusted formula to avoid rounding errors
        uint256 boostedReward = (totalReward * (100 + _boostPercentage)) / 100;
        console.log("Boosted reward:", boostedReward);

        return boostedReward;
    }

    function _calculatePrimordial(uint256 _stakedAmount, uint256 _days, uint256 _leftoverSeconds) internal pure returns (uint256) {
        uint256 totalReward = 0;

        // Calculate total reward for the number of days
        if (_days > 0) {
            uint256 dailyIncrementBasisPoints = _primordialDailyIncrement(_days);
            totalReward = (_stakedAmount * dailyIncrementBasisPoints * _days) / 1000000; // Dividing by 1000000 to convert basis points to percentage
        }

        // Calculate reward for leftover seconds
        if (_leftoverSeconds > 0) {
            uint256 finalDayIncrement = _primordialDailyIncrement(_days + 1);
            uint256 rewardPerSecond = (_stakedAmount * finalDayIncrement) / (1000000 * 1 days);
            totalReward += rewardPerSecond * _leftoverSeconds;
        }

        return totalReward;
    }

    function _primordialDailyIncrement(uint256 _days)
        internal
        pure
        returns (uint256)
        {
        if (_days > 100) {
            _days = 100;
        }
        // Calculate daily increment: 0.005% per day, increasing each day
        return 50 + (_days - 1) * 75; // Each increment is in basis points (0.001% = 1 basis point)
    }

    function setBoostedRewardCalculator(address _boostedRewardCalculator) public onlyOwner {
        boostedRewardCalculator = BoostedRewardCalculator(_boostedRewardCalculator);
    }

    function setPrimordialPlanetsContract(address _primordialplanetsAddress) public onlyOwner {
        primordialplanetsAddress = _primordialplanetsAddress;
    }

    function setCosmicImpactContract(address _cosmicimpactsAddress) public onlyOwner {
        cosmicimpactsAddress = _cosmicimpactsAddress;
    }

    function setPrimordialLPToken(address _primordialLPAddress) public onlyOwner {
        require(_primordialLPAddress != address(0), "Address cannot be zero");
        primordialLPToken = IERC20(_primordialLPAddress);
    }

    function setPrimordialPePe(address _primordialPePeAddress) public onlyOwner {
        require(_primordialPePeAddress != address(0), "Address cannot be zero");
        primordialPePeToken = IPrimordialPePe(_primordialPePeAddress);
    }

    function toggleRewardBooster(bool _enabled) external onlyOwner {
        console.log("BoostedRewardCalculator address;", address(boostedRewardCalculator));
        if (_enabled) {
            require(address(boostedRewardCalculator) != address(0), "Reward booster address not set");
        }
        boostedRewardCalculator = _enabled ? boostedRewardCalculator : BoostedRewardCalculator(address(0));
    }

    function isRewardBoosterEnabled() public view returns (bool) {
        return address(boostedRewardCalculator) != address(0);
    }

    modifier onlyLPOwner() {
        require(primordialLPToken.balanceOf(msg.sender) > 0, "Not an LP owner");
        _;
    }

    modifier onlyLPStaker() {
        require(stakers[msg.sender].stakedAmount > 0, "Not an LP staker");
        _;
    }

    modifier onlyNFTOwner(uint256 _nftId) {
        require(
            IERC721Enumerable(primordialplanetsAddress).ownerOf(_nftId) == msg.sender ||
            IERC721Enumerable(cosmicimpactsAddress).ownerOf(_nftId) == msg.sender,
            "Can only stake NFTs you own!"
        );
        _;
    }

    modifier onlyNFTStaker(uint256 _nftId) {
        require(
            stakedNFTs[msg.sender].contains(_nftId),
            "Can only unstake NFTs locked in your pool!"
        );
        _;
    }

}
