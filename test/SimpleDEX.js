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
        tokenA = await TokenA.deploy();
        await tokenA.deployed();
        tokenB = await TokenB.deploy();
        await tokenB.deployed();

        SimpleDEX = await ethers.getContractFactory("SimpleDEX");
        dex = await SimpleDEX.deploy(tokenA.address, tokenB.address);
        await dex.deployed();

        await tokenA.mint(owner.address, ethers.utils.parseEther("1000"));
        await tokenB.mint(owner.address, ethers.utils.parseEther("1000"));
        await tokenA.mint(addr1.address, ethers.utils.parseEther("500"));
        await tokenB.mint(addr1.address, ethers.utils.parseEther("500"));
    });

    it("Deve adicionar liquidez corretamente", async function () {
        await tokenA.approve(dex.address, ethers.utils.parseEther("100"));
        await tokenB.approve(dex.address, ethers.utils.parseEther("200"));

        await expect(
            dex.addLiquidity(
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("200")
            )
        ).to.emit(dex, "LiquidityAdded");

        const reserves = await dex.getReserves();
        expect(reserves[0]).to.equal(ethers.utils.parseEther("100"));
        expect(reserves[1]).to.equal(ethers.utils.parseEther("200"));
    });

    it("Deve permitir troca de A para B", async function () {
        await tokenA.approve(dex.address, ethers.utils.parseEther("100"));
        await tokenB.approve(dex.address, ethers.utils.parseEther("200"));
        await dex.addLiquidity(
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("200")
        );

        await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("10"));
        await expect(dex.connect(addr1).swapAforB(ethers.utils.parseEther("10")))
            .to.emit(dex, "SwappedAforB");
    });

    it("Deve permitir troca de B para A", async function () {
        await tokenA.approve(dex.address, ethers.utils.parseEther("100"));
        await tokenB.approve(dex.address, ethers.utils.parseEther("200"));
        await dex.addLiquidity(
            ethers.utils.parseEther("100"),
            ethers.utils.parseEther("200")
        );

        await tokenB.connect(addr1).approve(dex.address, ethers.utils.parseEther("10"));
        await expect(dex.connect(addr1).swapBforA(ethers.utils.parseEther("10")))
            .to.emit(dex, "SwappedBforA");
    });

    it("Deve falhar ao adicionar liquidez com valores zero", async function () {
        await expect(dex.addLiquidity(0, 0)).to.be.revertedWith("Valores devem ser > 0");
    });

    it("Deve falhar se tentar trocar sem liquidez suficiente", async function () {
        await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("10"));
        await expect(
            dex.connect(addr1).swapAforB(ethers.utils.parseEther("10"))
        ).to.be.reverted;
    });
});
