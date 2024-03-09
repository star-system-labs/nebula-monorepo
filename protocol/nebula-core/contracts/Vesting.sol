// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPrimordialPePe {
    function mint(address to, uint256 amount) external;
}

contract Vesting is Ownable {
    using SafeERC20 for IERC20;

    struct Vest {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 apr;
        bool active;
    }

    IERC20 public vestingToken;
    IPrimordialPePe public mintablePrimordialPePeToken;

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

    mapping(address => mapping(uint256 => Vest)) public userVests;
    mapping(address => uint256) public vestCount;
    mapping(address => bool[10]) private availableSlots;

    constructor(address _vestingToken, address _primordialPePeToken) {
        vestingToken = IERC20(_vestingToken);
        mintablePrimordialPePeToken = IPrimordialPePe(_primordialPePeToken);
    }

    function vestTokens(uint256 _amount, uint256 _timeIndex) external {
        uint256 currentCount = vestCount[msg.sender];
        require(currentCount < 10, "Max vesting positions reached");
        require(_timeIndex < timeBrackets.length, "Invalid time bracket");
        uint256 slot = findAvailableSlot(msg.sender);
        vestingToken.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 apr = 2 + _timeIndex;
        uint256 endTime = block.timestamp + timeBrackets[_timeIndex];
        userVests[msg.sender][slot] = Vest(_amount, block.timestamp, endTime, apr, true);
        availableSlots[msg.sender][slot] = false;
        if (slot == vestCount[msg.sender]) {
            vestCount[msg.sender]++;
        }
    }

    function findAvailableSlot(address user) private view returns (uint256) {
        for (uint256 i = 0; i < 10; i++) {
            if (availableSlots[user][i]) {
                return i;
            }
        }
        return vestCount[user];
    }

    function claimRewards(uint256 _vestIndex) external {
        require(_vestIndex < vestCount[msg.sender], "Invalid vest index");
        Vest storage vest = userVests[msg.sender][_vestIndex];
        require(vest.active, "Vest not active or already claimed");
        require(block.timestamp >= vest.endTime, "Vesting period not yet completed");

        uint256 timeBracketIndex = findTimeBracketIndex(vest.endTime - vest.startTime);
        require(timeBracketIndex < timeBrackets.length, "Time bracket not found");

        uint256 dailyAPR = (vest.apr * 1e18) / 36500;
        uint256 daysVested = (vest.endTime - vest.startTime) / 1 days;
        uint256 reward = (vest.amount * dailyAPR / 1e18) * daysVested;

        mintablePrimordialPePeToken.mint(msg.sender, reward);
        vestingToken.safeTransfer(msg.sender, vest.amount);
        vest.active = false;
        availableSlots[msg.sender][_vestIndex] = true;
    }

    function emergencyWithdraw(uint256 _vestIndex) external {
        require(_vestIndex < vestCount[msg.sender], "Invalid vest index");
        Vest storage vest = userVests[msg.sender][_vestIndex];
        require(vest.active, "Vest not active or already claimed");

        vestingToken.safeTransfer(msg.sender, vest.amount);
        vest.active = false;
        availableSlots[msg.sender][_vestIndex] = true;
    }

    function setVestingToken(address _vestingToken) external onlyOwner {
        vestingToken = IERC20(_vestingToken);
    }

    function setPrimordialPePeToken(address _primordialPePeToken) external onlyOwner {
        mintablePrimordialPePeToken = IPrimordialPePe(_primordialPePeToken);
    }

    function getVestCount(address user) external view returns (uint256) {
        return vestCount[user];
    }

    function getVest(address user, uint256 index) external view returns (Vest memory) {
        require(index < vestCount[user], "Invalid vest index");
        return userVests[user][index];
    }

    function getAllVests(address user) external view returns (Vest[] memory) {
        uint256 count = vestCount[user];
        Vest[] memory vests = new Vest[](count);
        for (uint256 i = 0; i < count; i++) {
            vests[i] = userVests[user][i];
        }
        return vests;
    }

    function getAllSlots(address user) external view returns (bool[10] memory, Vest[] memory) {
        bool[10] memory slotsAvailability = availableSlots[user];
        Vest[] memory vests = new Vest[](10);
        for (uint256 i = 0; i < 10; i++) {
            if (!slotsAvailability[i]) {
                vests[i] = userVests[user][i];
            }
        }
        return (slotsAvailability, vests);
    }

    function findTimeBracketIndex(uint256 duration) public view returns (uint256) {
        for (uint256 i = 0; i < timeBrackets.length; i++) {
            if (duration <= timeBrackets[i]) {
                return i;
            }
        }
        revert("Duration does not fit any time bracket");
    }
}
