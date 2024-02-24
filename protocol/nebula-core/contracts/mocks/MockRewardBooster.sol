    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    contract MockRewardBooster {
        // This function returns a fixed boost percentage for testing purposes.
        function getBoostPercentage(uint256 tokenId, address nftAddress/*string memory dna*/) external pure returns (uint256) {
            // Mock logic: return a fixed percentage or derive a percentage from the DNA string
            // For simplicity, let's return a fixed value of 5%
            return 5;
        }
    }
