const SmitPatelToken = artifacts.require('SmitPatelToken');
const SmitPatelTokenSale = artifacts.require('SmitPatelTokenSale');

module.exports = async function(deployer) {
    try {
        // Deploy Token with initial supply
        await deployer.deploy(SmitPatelToken, 1000000);
        const tokenInstance = await SmitPatelToken.deployed();
        
        // Token price is 0.001 Ether
        const tokenPrice = web3.utils.toBN('1000000000000000');
        
        // Deploy TokenSale
        await deployer.deploy(SmitPatelTokenSale, SmitPatelToken.address, tokenPrice);
        const tokenSaleInstance = await SmitPatelTokenSale.deployed();
        
        // Transfer tokens to TokenSale Contract (75% of total supply)
        await tokenInstance.transfer(
            tokenSaleInstance.address,
            web3.utils.toBN('750000')
        );
        
        console.log('Token deployed at:', tokenInstance.address);
        console.log('TokenSale deployed at:', tokenSaleInstance.address);
        console.log('Tokens transferred to sale contract');
        
    } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
    }
};