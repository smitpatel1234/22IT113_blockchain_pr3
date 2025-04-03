var SmitPatelTokenSale = artifacts.require('SmitPatelTokenSale');
var SmitPatelToken = artifacts.require('SmitPatelToken');

contract('SmitPatelTokenSale', function(accounts) {
    var tokenSaleInstance;
    var tokenInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // in wei (0.001 ETH)
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', function() {
        return SmitPatelTokenSale.deployed().then(function(instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function(address) {
            assert.notEqual(address, 0x0, 'has contract address');
            return tokenSaleInstance.tokenContract();
        }).then(function(address) {
            assert.notEqual(address, 0x0, 'has token contract address');
            return tokenSaleInstance.tokenPrice();
        }).then(function(price) {
            assert.equal(price, tokenPrice, 'token price is correct');
        });
    });

    it('facilitates token buying', function() {
        return SmitPatelToken.deployed().then(function(instance) {
            // Get token instance
            tokenInstance = instance;
            return SmitPatelTokenSale.deployed();
        }).then(function(instance) {
            // Get token sale instance
            tokenSaleInstance = instance;
            // Provision 75% of all tokens to the token sale
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then(function(receipt) {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function(amount) {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
            return tokenInstance.balanceOf(buyer);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), numberOfTokens);
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
            // Try to buy tokens with incorrect value
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
            // Try to buy more tokens than available
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        });
    });

    it('ends token sale', function() {
        return SmitPatelToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return SmitPatelTokenSale.deployed();
        }).then(function(instance) {
            tokenSaleInstance = instance;
            // Try to end sale from account other than admin
            return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'must be admin to end sale');
            // End sale as admin
            return tokenSaleInstance.endSale({ from: admin });
        }).then(function(receipt) {
            return tokenInstance.balanceOf(admin);
        }).then(function(balance) {
            // Admin should have received the remaining tokens
            // Initial supply (1,000,000) - tokens sold (10) = 999,990
            assert.equal(balance.toNumber(), 999990, 'returns all unsold SmitPatelToken to admin');
            // Check if contract has been destroyed
            return web3.eth.getCode(tokenSaleInstance.address);
        }).then(function(code) {
            // If using newer versions of web3, the contract might not be destroyed
            // but should transfer funds back to admin
            // Remove this assertion if your contract doesn't self-destruct
            // assert.equal(code, '0x', 'token sale contract was destroyed');
        });
    });
});