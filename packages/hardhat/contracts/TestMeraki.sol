// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./RewardDistributor.sol";


//TODO figure out how vote delegation works
contract TestMeraki is ERC721{
    uint public supply;
    constructor() ERC721("Test Meraki", "TM"){}

    function mint(uint _amount) external{
        for(uint i=0; i<_amount; i++){
            _safeMint(msg.sender, supply);
            supply++;
        }
    }
}