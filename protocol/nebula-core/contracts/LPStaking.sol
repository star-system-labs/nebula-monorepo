// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPStaking is Ownable, ReentrancyGuard {
    IERC20 public lpToken;
    IERC20 public rewardToken;

    struct StakerInfo {
        uint256 stakedAmount;
        bool lpStaked;
    }

    mapping(address => StakerInfo) public stakers;
    using EnumerableSet for EnumerableSet.UintSet;

    mapping(address => uint256) public lpStakeTimes;
    mapping(address => uint256) public lpClaimTimes;

    event StakeLP(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 rewardAmount);

    constructor(address _lpToken, address _rewardTokenAddress) {
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardTokenAddress);
    }

    function stakeLPToken(uint256 amount) external {
        require(amount > 0, "Cannot stake 0 tokens, for it is truly nothing");
        _stakeLPToken(msg.sender, amount);
    }

    function unstakeLPToken(uint256 _stakedAmount) public {
        require(stakers[msg.sender].stakedAmount > 0, "No staked LP tokens");
        _unstakeLPToken(_stakedAmount, msg.sender);
    }

    function _stakeLPToken(address stakerAddress, uint256 amount) internal onlyLPOwner nonReentrant {
        StakerInfo storage staker = stakers[stakerAddress];
        require(amount > 0, "Cannot stake 0 tokens, for it is truly nothing");

        lpToken.transferFrom(stakerAddress, address(this), amount);
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
            primordialOwed = getBasePrimordialOwed(_stakedAmount, _staker);
        require(rewardToken.balanceOf(address(this)) >= primordialOwed, "Insufficient reward balance");
        rewardToken.transfer(_staker, primordialOwed);
        lpToken.transfer(_staker, staker.stakedAmount);
        staker.stakedAmount -= _stakedAmount;

        if (staker.stakedAmount == 0) {
        staker.lpStaked = false;
        }
        lpClaimTimes[_staker] = block.timestamp;

        emit Claimed(_staker, primordialOwed);
    }

    function claimReward(uint256 _stakedAmount) external nonReentrant {
        StakerInfo storage staker = stakers[msg.sender];
        uint256 reward = getBasePrimordialOwed(_stakedAmount, msg.sender);
        require(reward > 0, "No rewards available");
        require(rewardToken.balanceOf(address(this)) >= reward, "Insufficient reward balance");
        rewardToken.transfer(msg.sender, reward);
        lpClaimTimes[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, reward);
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
            uint256 lpStakeTime, 
            uint256 lpClaimTime
        ) 
        {
        StakerInfo storage staker = stakers[_staker];
        stakedAmount = staker.stakedAmount;
        lpStakeTime = lpStakeTimes[_staker];
        lpClaimTime = lpClaimTimes[_staker];
    }

    function getPrimordialEmission(address _address) public view returns (uint256) {
        uint256 elapsedTime = block.timestamp - lpStakeTimes[_address];
        uint256 elapsedDays = elapsedTime < 1 days ? 0 : elapsedTime / 1 days;
        return _primordialDailyIncrement(elapsedDays);
    }

    function _calculatePrimordial(uint256 _stakedAmount, uint256 _days, uint256 _leftoverSeconds) internal pure returns (uint256) {
        uint256 totalReward = 0;
        uint256 dailyIncrementBasisPoints;

        if (_days > 100) {
            dailyIncrementBasisPoints = _primordialDailyIncrement(100);
            totalReward = (_stakedAmount * dailyIncrementBasisPoints * 100) / 1000000;
            uint256 daysBeyond100 = _days - 100;
            totalReward += (_stakedAmount * dailyIncrementBasisPoints * daysBeyond100) / 1000000;
        } else {
            dailyIncrementBasisPoints = _primordialDailyIncrement(_days);
            totalReward = (_stakedAmount * dailyIncrementBasisPoints * _days) / 1000000;
        }
        if (_leftoverSeconds > 0) {
            uint256 finalDayIncrement = _primordialDailyIncrement(_days >= 100 ? 100 : _days + 1);
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
        if (_days == 0) {
            return 50;
        }
        // Calculate daily increment: 0.005% per day, increasing each day
        return 50 + (_days - 1) * 75; // Each increment is in basis points (0.001% = 1 basis point)
    }

    function setLPToken(address _lpToken) public onlyOwner {
        require(_lpToken != address(0), "Address cannot be zero");
        lpToken = IERC20(_lpToken);
    }

    function setRewardToken(address _rewardTokenAddress) public onlyOwner {
        require(_rewardTokenAddress != address(0), "Address cannot be zero");
        rewardToken = IERC20(_rewardTokenAddress);
    }

    modifier onlyLPOwner() {
        require(lpToken.balanceOf(msg.sender) > 0, "Not an LP owner");
        _;
    }

    modifier onlyLPStaker() {
        require(stakers[msg.sender].stakedAmount > 0, "Not an LP staker");
        _;
    }
}
