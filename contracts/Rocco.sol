// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Rocco is ERC20("Rocco Token", "RCO") {
    address public owner;
    address public allowedContract;

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 100000000e18);
    }

}
