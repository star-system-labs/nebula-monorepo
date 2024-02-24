// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IPrimordialPePe is IERC20 {
    function burnFrom(address account, uint256 amount) external;

    function mint(address to, uint256 amount) external;
}