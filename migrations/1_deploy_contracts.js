
const SmitPatelToken = artifacts.require("SmitPatelToken");
module.exports = function(deployer) {
  deployer.deploy(SmitPatelToken,1000000);
};
