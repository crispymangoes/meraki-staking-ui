// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "./RewardDistributor.sol";


//TODO figure out how vote delegation works
contract Olympus is RewardDistributor, ERC721Holder{

    uint constant BASE_DECIMALS = 10000;
    uint constant MAX_SUPPLY = 100000;

    //user variables
    mapping(address => address) public delegateVoteTo;
    mapping(address => uint[]) public userNFTIds;

    //founder variables
    mapping(address => uint) public founderBalance;
    uint public totalFounderDeposits;
    address[] public founderList;
    uint public founderDepositCap;

    //reward tracking
    uint public totalDeposits;//total amount of deposits in pool

    //beneficiary information
    address public beneficiary;
    uint public beneficiaryCut = 1000;
    uint constant public MAX_BENEFICIARY_CUT = 2000;

    IERC721 MerakiToken;

    constructor(address _merakiToken, uint _founderTokenCap) RewardDistributor("Staked Meraki Token", "sMRKI"){
        MerakiToken = IERC721(_merakiToken);
        founderDepositCap = _founderTokenCap;
        totalDeposits = founderDepositCap;
    }

    /****************************external onlyOwner *************************************/
    function setBeneficiary(address _newBeneficiary) external onlyOwner{
        for(uint i=0; i<founderList.length; i++){
            _updateRewards(founderList[i]);
        }
        _updateRewards(_newBeneficiary);//update rewards for new beneficiary
        _updateRewards(beneficiary);//update rewards for old beneficiary
        beneficiary  = _newBeneficiary;
    }

    /**
     * @dev if _newCut results in founder balances having decimals, there will be wasted reward tokens, that the founders will not get
     */
    function changeBeneficiaryCut(uint _newCut) external onlyOwner{
        require(_newCut <= MAX_BENEFICIARY_CUT, "Meraki: _newCut is larger then MAX_BENEFICIARY_CUT");
        for(uint i=0; i<founderList.length; i++){
            _updateRewards(founderList[i]);
        }
        _updateRewards(beneficiary);
        beneficiaryCut = _newCut;
    }

    function adjustFounderInfo(address[] memory _founders, uint[] memory _balances, bool _lowerCap) external onlyOwner{
        require(_founders.length == _balances.length, "Meraki: Inputs mismatched length");
        //reset all founder balances
        for(uint i=0; i<founderList.length; i++){
            _updateRewards(founderList[i]);
            founderBalance[founderList[i]] = 0;
        }
        _updateRewards(beneficiary);

        founderList = _founders;
        uint total;
        for(uint i=0; i<founderList.length; i++){
            require(founderList[i] != address(0), "Meraki: address(0) cannnot be a founder");
            founderBalance[founderList[i]] = _balances[i];
            total += _balances[i];
        }
        require(total <= founderDepositCap, "Meraki: _balances sum excedes founderDepositCap");

        if(total < founderDepositCap){
            require(_lowerCap, "Meraki: Sum of _balances is lower than existing founderDepositCap, so _lowerCap must be true");
            totalDeposits = totalDeposits - founderDepositCap + total;
            founderDepositCap =  total;
        }
    }

    /****************************external mutative *************************************/
    function stake(uint[] memory _ids) external checkPause{
        require(_ids.length > 0, "Meraki: _ids is empty");
        //update reward info
        _updateRewards(msg.sender);
        for(uint i=0; i<_ids.length; i++){
            MerakiToken.safeTransferFrom(msg.sender, address(this), _ids[i], "");
            userNFTIds[msg.sender].push(_ids[i]);
        }
        totalDeposits += _ids.length;
        _mint(msg.sender,  _ids.length);
    }

    function unstake(uint _amount) external{
        require(_amount > 0, "Meraki: _amount is zero");
        //update reward info
        _updateRewards(msg.sender);
        totalDeposits -= _amount;
        _burn(msg.sender, _amount);
        //send user their NFTs
        uint initialBal = userNFTIds[msg.sender].length;
        require(_amount <= initialBal, "_amount excedes balance");
        for(uint i=1; i<=_amount; i++){
            MerakiToken.safeTransferFrom(address(this), msg.sender, userNFTIds[msg.sender][initialBal - i]);
            delete userNFTIds[msg.sender][initialBal - i];
        }
        if(_amount ==  initialBal){//completely delete entry if user withdraw completely
            delete userNFTIds[msg.sender];
        }
    }

    /****************************public view *************************************/
    //needs to account for founder less voting power
    function DAOVotingPower(address _user) public view returns(uint){
        return balanceOf(_user) + (founderBalance[_user] * (MAX_SUPPLY - founderDepositCap) / founderDepositCap); //account for founders reduced voting power
    }

    function getRewardTokens() public view returns(address[] memory){
        return rewardTokens;
    }

    function userBalance(address _user) public view override returns(uint){
        if(beneficiary != address(0)){
            if(_user == beneficiary){
                return balanceOf(beneficiary) + founderDepositCap * beneficiaryCut / BASE_DECIMALS;
            }
            else{
                return balanceOf(_user) + (founderBalance[_user] * (BASE_DECIMALS - beneficiaryCut))/BASE_DECIMALS;
            }
        }
        else{
            return balanceOf(_user) + founderBalance[_user];
        }
    }

    function totalAmountDeposited() public view override returns(uint){
        return totalDeposits;
    }
}