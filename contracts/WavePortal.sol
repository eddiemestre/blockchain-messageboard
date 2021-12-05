// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./safemath.sol";

contract WavePortal {

    // safemath!
    using SafeMath for uint256;
    using SafeMath for uint32;

    // NewWave event
    event NewWave(address indexed from, uint256 timestamp, string message);
    // global total waves of app
    uint256 totalWaves;

    // using this to help generate a random number
    uint256 private seed;

    // cooldown time before address is able to send another wave
    uint256 cooldownTime = 5 seconds;

    // wave struct
    struct Wave {
        address waver;
        string message;
        uint256 timestamp;
    }

    // wave array
    Wave[] waves;

    // mapping to store address and last time that user waved
    mapping (address => uint256) lastWavedAt;

    // constructor
    constructor() payable {
        console.log("I am a wave counter smart contract");

        // set initial seed value
        seed = (block.timestamp + block.difficulty) % 100;
    }


    // wave function
    function wave(string memory _message) public {

        require(
            lastWavedAt[msg.sender] + 0 seconds < block.timestamp, "Wait 10s"
        );

        lastWavedAt[msg.sender] = block.timestamp;

        // if wave is successful, increment total waves by 1
        totalWaves = totalWaves.add(1);

        // push new wave to wave array
        waves.push(Wave(msg.sender, _message, block.timestamp));

        // determine seed
        seed = (block.difficulty + block.timestamp + seed) % 100;

        // determine randomness
        if (seed <= 50) {
            console.log("%s won!", msg.sender);

            uint256 prizeAmount = 0.01 ether;
            require(
                prizeAmount <= address(this).balance,
                "Trying to withdraw more money than the contract has."
            );

            (bool success, ) = (msg.sender).call{value: prizeAmount}("");
            require(success, "Failed to withdraw money from contract.");
        }
        
        emit NewWave(msg.sender, block.timestamp, _message);
    
    }

    // get All Waves returns the struct array, waves
    function getAllWaves() public view returns (Wave[] memory) {
        return waves;
    }

    // returns total global waves
    function getTotalWaves() public view returns (uint256) {
        console.log("We have %d total waves!", totalWaves);
        return totalWaves;
    }

    // get seed number
    function getSeed() public view returns (uint256) {
        return seed;
    }
}