// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISimpleDEX {
    function addLiquidity(uint256 amountA, uint256 amountB) external;
    function removeLiquidity(uint256 amountA, uint256 amountB) external;
    function swapAforB(uint256 amountAIn) external;
    function swapBforA(uint256 amountBIn) external;
    function getPrice(address _token) external view returns (uint256);
}

contract SimpleDEX is ISimpleDEX, Ownable, ReentrancyGuard {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(uint256 amountA, uint256 amountB);
    event LiquidityRemoved(uint256 amountA, uint256 amountB);
    event SwappedAforB(uint256 amountAIn, uint256 amountBOut);
    event SwappedBforA(uint256 amountBIn, uint256 amountAOut);

    constructor(address _tokenA, address _tokenB) Ownable(msg.sender) {
        require(_tokenA != _tokenB, "Tokens must be different");
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        reserveA += amountA;
        reserveB += amountB;
        require(tokenA.transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
        require(tokenB.transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");
        emit LiquidityAdded(amountA, amountB);
    }



    function removeLiquidity(uint256 amountA, uint256 amountB) external onlyOwner {
        require(amountA <= reserveA && amountB <= reserveB, "Insufficient reserves");
        reserveA -= amountA;
        reserveB -= amountB;
        require(tokenA.transfer(msg.sender, amountA), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountB), "TokenB transfer failed");
        emit LiquidityRemoved(amountA, amountB);
    }

    function swapAforB(uint256 amountAIn) external {
        require(amountAIn > 0, "Invalid amount");
        require(tokenA.transferFrom(msg.sender, address(this), amountAIn), "TokenA transfer failed");
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut <= reserveB, "Not enough TokenB in reserve");
        reserveA += amountAIn;
        reserveB -= amountBOut;
        require(tokenB.transfer(msg.sender, amountBOut), "TokenB transfer failed");
        emit SwappedAforB(amountAIn, amountBOut);
    }

    function swapBforA(uint256 amountBIn) external {
        require(amountBIn > 0, "Invalid amount");
        require(tokenB.transferFrom(msg.sender, address(this), amountBIn), "TokenB transfer failed");
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut <= reserveA, "Not enough TokenA in reserve");
        reserveB += amountBIn;
        reserveA -= amountAOut;
        require(tokenA.transfer(msg.sender, amountAOut), "TokenA transfer failed");
        emit SwappedBforA(amountBIn, amountAOut);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid reserves or amount");
        return (amountIn * reserveOut) / (reserveIn + amountIn);
    }

    function getPrice(address _token) external view returns (uint256) {
        if (_token == address(tokenA)) {
            return (reserveB * 1e18) / reserveA;
        } else if (_token == address(tokenB)) {
            return (reserveA * 1e18) / reserveB;
        } else {
            revert("Invalid token address");
        }
    }
}
