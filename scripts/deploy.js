const { ethers } = require("hardhat");

async function main() {
    const TokenA = await ethers.getContractFactory("TokenA");
    const TokenB = await ethers.getContractFactory("TokenB");
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");

    const tokenA = await TokenA.deploy(5000);
    const tokenB = await TokenB.deploy(5000);
    const simpleDEX = await SimpleDEX.deploy(tokenA.target, tokenB.target);

    console.log("Token A deployed to:", tokenA.target);
    console.log("Token B deployed to:", tokenB.target);
    console.log("Simple DEX deployed to:", simpleDEX.target);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error("Error deploying contracts:", error);
    process.exit(1);
});