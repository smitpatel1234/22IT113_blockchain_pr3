// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./SmitPatelToken.sol";

contract SmitPatelTokenSale {
    address admin;
    SmitPatelToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor(SmitPatelToken _tokenContract, uint256 _tokenPrice) {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    // multiply function to prevent integer overflow
    function multiply(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "Multiplication overflow");
        return z;
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        // Check that the value sent is enough to buy the tokens
        require(msg.value == multiply(_numberOfTokens, tokenPrice), "Value must equal price * tokens");
        
        // Check that the contract has enough tokens
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens, "Not enough tokens available");
        
        // Transfer tokens to the buyer
        require(tokenContract.transfer(msg.sender, _numberOfTokens), "Token transfer failed");
        
        // Increment tokens sold
        tokensSold += _numberOfTokens;
        
        // Trigger sell event
        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, "Only admin can end sale");
        
        // Transfer remaining tokens back to admin
        uint256 remainingTokens = tokenContract.balanceOf(address(this));
        require(tokenContract.transfer(admin, remainingTokens), "Transfer failed");
        
        // Transfer the balance to the admin
        payable(admin).transfer(address(this).balance);
    }
}