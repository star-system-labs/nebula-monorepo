// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPrimordialPlanet is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter = 1;

    constructor() ERC721("MockPrimordialPlanet", "MPLANET") {}

    function mint(address to) public onlyOwner {
        _mint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }

    function mintBatch(address to, uint256 count) public onlyOwner {
        for (uint256 i = 0; i < count; i++) {
            mint(to);
        }
    }
}
