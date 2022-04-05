// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOlympus{
    function getRewardTokens() external view returns(address[] memory);
    function depositReward(address _token, uint _amount) external;
    function inRewardTokens(address _token) external view returns(bool, uint);
}

contract OlympusAggregator is Ownable{

    address public Olympus;

    constructor(address _olympus){
        Olympus = _olympus;
    }

    function sendRewardToOlympus(address _token, uint _amount) external onlyOwner{
        _sendRewardToOlympus(_token, _amount);
    }

    function _sendRewardToOlympus(address _token, uint _amount) internal{
        (bool exists,) = IOlympus(Olympus).inRewardTokens(_token);
        require(exists, "Meraki: _token is not in rewardTokens");
        SafeERC20.safeApprove(IERC20(_token), address(Olympus), _amount);
        IOlympus(Olympus).depositReward(_token, _amount);
    }
}