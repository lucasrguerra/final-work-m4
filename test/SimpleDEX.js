const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDEX", function () {
    let owner, addr1, addr2;
    let TokenA, TokenB, tokenA, tokenB;
    let SimpleDEX, dex;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        TokenA = await ethers.getContractFactory("TokenA");
        TokenB = await ethers.getContractFactory("TokenB");
        tokenA = await TokenA.connect(owner).deploy("5000");
        tokenB = await TokenB.connect(owner).deploy("5000");

        SimpleDEX = await ethers.getContractFactory("SimpleDEX");
        dex = await SimpleDEX.connect(owner).deploy(tokenA.target, tokenB.target);

        await tokenA.transfer(addr1.address, 1000);
        await tokenA.transfer(addr2.address, 1000);
        await tokenA.approve(dex.target, 100);
        
        await tokenB.transfer(addr1.address, 1000);
        await tokenB.transfer(addr2.address, 1000);
        await tokenB.approve(dex.target, 200);
    });

    it("Must add liquidity correctly", async function () {
        await expect(dex.addLiquidity(100, 200)).to.emit(dex, "LiquidityAdded");
        
        const reserveA = await dex.reserveA();
        const reserveB = await dex.reserveB();

        expect(reserveA).to.equal(100);
        expect(reserveB).to.equal(200);
    });

    it("Must remove liquidity correctly", async function () {
        await dex.addLiquidity(100, 200);
        await expect(dex.removeLiquidity(50, 100))
            .to.emit(dex, "LiquidityRemoved");
        const reserveA = await dex.reserveA();
        const reserveB = await dex.reserveB();
        expect(reserveA).to.equal(50);
        expect(reserveB).to.equal(100);
    });

    it("Must allow swapping from A to B", async function () {
        await tokenA.connect(addr1).approve(dex.target, 100);
        await tokenB.connect(addr1).approve(dex.target, 100);

        await dex.addLiquidity(100, 200);
        await expect(dex.connect(addr1).swapAforB(10))
            .to.emit(dex, "SwappedAforB");
    });

    it("Must allow swapping from B to A", async function () {
        await tokenA.connect(addr1).approve(dex.target, 100);
        await tokenB.connect(addr1).approve(dex.target, 100);

        await dex.addLiquidity(100, 200);
        await expect(dex.connect(addr1).swapBforA(10))
            .to.emit(dex, "SwappedBforA");
    });

    it("Must fail to add liquidity with zero values", async function () {
        await expect(dex.addLiquidity(0, 0)).to.be.revertedWith("Invalid amounts");
    });

    it("Must fail if trying to swap without sufficient liquidity", async function () {
        await tokenA.connect(addr1).approve(dex.target, 10);
        await expect(dex.connect(addr1).swapAforB(10)).to.be.reverted;
    });

    it("Must fail if trying to swap with zero input amount", async function () {
        await expect(dex.swapAforB(0)).to.be.revertedWith("Invalid amount");
        await expect(dex.swapBforA(0)).to.be.revertedWith("Invalid amount");
    });

    it("Must fail if non-owner tries to add liquidity", async function () {
        await expect(dex.connect(addr1).addLiquidity(100, 200)).to.be.reverted;
    });

    it("Must fail if non-owner tries to remove liquidity", async function () {
        await expect(dex.connect(addr1).removeLiquidity(100, 200)).to.be.reverted;
    });

    it("Must return the correct price of tokens", async function () {
        await dex.addLiquidity(100, 200);
        const priceA = await dex.getPrice(tokenA.target);
        const priceB = await dex.getPrice(tokenB.target);

        const correctPriceA = BigInt(200 * 1e18) / BigInt(100);
        const correctPriceB = BigInt(100 * 1e18) / BigInt(200);

        expect(priceA).to.equal(correctPriceA);
        expect(priceB).to.equal(correctPriceB);
    });

    it("Must fail if trying to get price of unsupported token", async function () {
        const unsupportedToken = ethers.Wallet.createRandom().address;
        await expect(dex.getPrice(unsupportedToken)).to.be.revertedWith("Invalid token address");
    });

    it("Must allow owner to mint A tokens", async function () {
        await expect(tokenA.mint(addr1.address, 100)).to.emit(tokenA, "Transfer");
    });

    it("Must allow owner to mint B tokens", async function () {
        await expect(tokenB.mint(addr1.address, 100)).to.emit(tokenB, "Transfer");
    });

    it("Must allow owner to burn A tokens", async function () {
        await expect(tokenA.burn(100)).to.emit(tokenA, "Transfer");
        const balance = await tokenA.balanceOf(owner.address);
        expect(balance).to.equal(2900);
    });

    it("Must allow owner to burn B tokens", async function () {
        await expect(tokenB.burn(100)).to.emit(tokenB, "Transfer");
        const balance = await tokenB.balanceOf(owner.address);
        expect(balance).to.equal(2900);
    });
});
