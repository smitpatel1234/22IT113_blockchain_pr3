const SmitPatelToken = artifacts.require("SmitPatelToken");

contract("SmitPatelToken", function (accounts) {
    it("sets the total supply upon deployment", async function () {
        let tokenInstance = await SmitPatelToken.deployed();
        let totalSupply = await tokenInstance.totalSupply();
        assert.equal(totalSupply.toNumber(), 8000000, "sets the total supply to 1,000,000");
    });
});
