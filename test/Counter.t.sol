// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;
    string internal configFilePath;
    Chain internal chain;

    function setUp() public {
        chain = getChain(block.chainid);
        console.log("Chain ALIAS:", chain.chainAlias);
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function test_SetNumber() public {
        counter = new Counter();
        string memory root = vm.projectRoot();
        configFilePath = string.concat(root, "/config/", chain.chainAlias, ".json");
        string memory newWbtc = string.concat(
            "{'address':", vm.toString(address(counter)), ", 'lastUpdate': ", vm.toString(block.timestamp), "}"
        );
        vm.writeJson(newWbtc, configFilePath, ".Staking");
    }
}
