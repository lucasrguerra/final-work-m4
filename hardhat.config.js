/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
	solidity: "0.8.28",
	networks: {
		sepolia: {
			url: API_URL,
			accounts: [`0x${PRIVATE_KEY}`]
		}
	},
};
