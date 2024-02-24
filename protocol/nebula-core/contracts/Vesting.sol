pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPrimordialPePe {
    function mint(address to, uint256 amount) external;
}

interface IRewardBooster {
    function getBoostPercentage(uint256 tokenId, address nftAddress) external view returns (uint256);
}

interface IPrimordialPlanets {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function _tokenIdToHash(uint256 tokenId) external view returns (string memory);
}

interface ICosmicImpacts {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function _tokenIdToHash(uint256 tokenId) external view returns (string memory);
}

contract Vesting is Ownable {
    using SafeERC20 for IERC20;

    struct Vest {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 apr;
        bool withdrawn;
    }

    struct StakePlanet {
        uint256 nftId;
        uint256 startTime;
        bool staked;
    }

    struct StakeImpact {
        uint256 nftId;
        uint256 startTime;
        bool staked;
    }

    IERC20 public vestingToken;
    address public rewardBoosterContract;
    IPrimordialPePe public mintablePrimordialPePeToken;
    IPrimordialPlanets public primordialPlanets;
    ICosmicImpacts public cosmicImpacts;

    uint256[] public timeBrackets = [
        30 days,
        60 days,
        90 days,
        120 days,
        150 days,
        180 days,
        210 days,
        240 days,
        270 days,
        300 days,
        330 days,
        365 days
    ];

    mapping(address => Vest[]) public vests;
    mapping(address => StakePlanet) public nftPlanet;
    mapping(address => StakeImpact) public nftImpact;

    constructor(address _vestingToken, address _primordialPePeToken) {
        vestingToken = IERC20(_vestingToken);
        mintablePrimordialPePeToken = IPrimordialPePe(_primordialPePeToken);
    }

    function stakePlanet(uint256 _nftId) external {
        require(!nftPlanet[msg.sender].staked, "Already staked a PrimordialPlanet");
        require(!nftImpact[msg.sender].staked, "Already staked a CosmicImpact");

        primordialPlanets.transferFrom(msg.sender, address(this), _nftId);

        nftPlanet[msg.sender] = StakePlanet({
            nftId: _nftId,
            startTime: block.timestamp,
            staked: true
        });
    }

    function stakeImpact(uint256 _nftId) external {
        require(!nftPlanet[msg.sender].staked, "Already staked a PrimordialPlanet");
        require(!nftImpact[msg.sender].staked, "Already staked a CosmicImpact");

        cosmicImpacts.transferFrom(msg.sender, address(this), _nftId);

        nftImpact[msg.sender] = StakeImpact({
            nftId: _nftId,
            startTime: block.timestamp,
            staked: true
        });
    }

    function unstakePlanet() external {
        require(nftPlanet[msg.sender].staked, "No Planet staked");

        primordialPlanets.transferFrom(address(this), msg.sender, nftPlanet[msg.sender].nftId);

        nftPlanet[msg.sender].staked = false;
    }

    function unstakeImpact() external {
        require(nftImpact[msg.sender].staked, "No Impact staked");

        cosmicImpacts.transferFrom(address(this), msg.sender, nftImpact[msg.sender].nftId);

        nftImpact[msg.sender].staked = false;
    }

    function vestTokens(uint256 _amount, uint256 _timeIndex) external {
        require(_timeIndex < timeBrackets.length, "Invalid time bracket");
        vestingToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 apr = 2 + _timeIndex;
        uint256 endTime = block.timestamp + timeBrackets[_timeIndex];
        vests[msg.sender].push(Vest(_amount, block.timestamp, endTime, apr, false));
    }

    function claimRewards(uint256 _vestIndex) external {
        require(_vestIndex < vests[msg.sender].length, "Invalid vest index");
        Vest storage vest = vests[msg.sender][_vestIndex];
        require(!vest.withdrawn, "Already withdrawn");
        require(block.timestamp >= vest.endTime, "Vesting period not yet completed");

        uint256 timeBracketIndex = findTimeBracketIndex(vest.endTime - vest.startTime);
        require(timeBracketIndex < timeBrackets.length, "Time bracket not found");

        uint256 dailyAPR = (vest.apr * 1e18) / 36500;
        uint256 daysVested = (vest.endTime - vest.startTime) / 1 days;
        uint256 reward = (vest.amount * dailyAPR / 1e18) * daysVested;

        uint256 boostPercentage = 0;
        if (rewardBoosterContract != address(0)) {
            if (nftPlanet[msg.sender].staked) {
                uint256 nftId = nftPlanet[msg.sender].nftId;
                boostPercentage = IRewardBooster(rewardBoosterContract).getBoostPercentage(nftId, address(primordialPlanets));
            } else if (nftImpact[msg.sender].staked) {
                uint256 nftId = nftImpact[msg.sender].nftId;
                boostPercentage = IRewardBooster(rewardBoosterContract).getBoostPercentage(nftId, address(cosmicImpacts));
            }
        }

    uint256 boostedReward = (reward * (100 + boostPercentage)) / 100;
    reward = boostedReward;

        mintablePrimordialPePeToken.mint(msg.sender, reward);

        vestingToken.safeTransfer(msg.sender, vest.amount);

        vest.withdrawn = true;
    }

    function emergencyWithdraw(uint256 _vestIndex) external {
        require(_vestIndex < vests[msg.sender].length, "Invalid vest index");
        Vest storage vest = vests[msg.sender][_vestIndex];
        require(!vest.withdrawn, "Already withdrawn");


        vestingToken.safeTransfer(msg.sender, vest.amount);
        vest.withdrawn = true;
    }

    function setVestingToken(address _vestingToken) external onlyOwner {
        vestingToken = IERC20(_vestingToken);
    }

    function setPrimordialPePeToken(address _primordialPePeToken) external onlyOwner {
        mintablePrimordialPePeToken = IPrimordialPePe(_primordialPePeToken);
    }

    function setPrimordialPlanets(address _primordialPlanetsContract) external onlyOwner {
        primordialPlanets = IPrimordialPlanets(_primordialPlanetsContract);
    }

    function setCosmicImpacts(address _cosmicImpactsContract) external onlyOwner {
        cosmicImpacts = ICosmicImpacts(_cosmicImpactsContract);
    }

    function getVestCount(address user) external view returns (uint256) {
        return vests[user].length;
    }

    function getVest(address user, uint256 index) external view returns (Vest memory) {
        return vests[user][index];
    }

    function getAllVests(address user) external view returns (Vest[] memory) {
        return vests[user];
    }

    function findTimeBracketIndex(uint256 duration) public view returns (uint256) {
        for (uint256 i = 0; i < timeBrackets.length; i++) {
            if (duration <= timeBrackets[i]) {
                return i;
            }
        }
        revert("Duration does not fit any time bracket");
    }

    function toggleRewardBooster(address _rewardBoosterContract) external onlyOwner {
        rewardBoosterContract = _rewardBoosterContract;
    }

}
