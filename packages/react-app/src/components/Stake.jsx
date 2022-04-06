import { Skeleton, Typography, Card, Divider,Statistic, Row, Col, Radio, Input, Button } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Blockies from "react-blockies";
import { useLookupAddress } from "eth-hooks/dapps/ens";
import {
    useBalance,
    useContractLoader,
    useContractReader,
    useGasPrice,
    useOnBlock,
    useUserProviderAndSigner,
  } from "eth-hooks";

export default function Stake({
    signer,
    provider,
    contractConfig,
    chainId,
    address,
    tx,
}) {
    const readContracts = useContractLoader(provider, contractConfig);
    const writeContracts = useContractLoader(signer, contractConfig, chainId);

    let userBal = useContractReader(readContracts, "TestMeraki", "balanceOf", [address]);
    userBal = userBal ? userBal.toNumber() : 0;

    let totalStaked = useContractReader(readContracts, "Olympus", "totalAmountDeposited");
    totalStaked = totalStaked ? totalStaked.toNumber() : 0;
    console.log("***STAKE CHILD*** Total Staked Token Balance: ", totalStaked);

    let userStake = useContractReader(readContracts, "Olympus", "userBalance", [address]);
    userStake = userStake ? userStake.toNumber() : 0;
    console.log("***STAKE CHILD*** Staked Token Balance: ", userStake);

    let share = 100*userStake / totalStaked;
    share = share.toFixed(2);

    const olympusAddress = readContracts && readContracts.Olympus && readContracts.Olympus.address;

    const olympusApproval = useContractReader(readContracts, "TestMeraki", "isApprovedForAll", [
        address, olympusAddress
    ]);

    const stakedBal = useContractReader(readContracts, "Olympus", "balanceOf", [address]);
    console.log("Staked Token Balance: ", stakedBal);

    const [idsToStake, setIdsToStake] = useState({
        valid: false,
        value: ''
      });
      const [isOlympusApproved, setIsOlympusApproved] = useState();
      useEffect(()=>{
        console.log("idsToStake",idsToStake.value)
        setIsOlympusApproved(olympusApproval && idsToStake.value && olympusApproval)
      },[idsToStake, readContracts])
      console.log("isOlympusApproved",isOlympusApproved)
    
      const [requestOut, setRequestOut] = useState({
        valid: false,
        value: ''
      });
      const [isRequestValid, setIsRequestValid] = useState();
    
      useEffect(()=>{
        console.log("requestOut",requestOut.value)
        const requestOutBN = requestOut.valid ? requestOut.value : 0;
        console.log("requestOutBN",requestOutBN)
        setIsRequestValid(stakedBal && stakedBal != '' && stakedBal.gte(requestOutBN))
      },[requestOut, readContracts])
      console.log("isRequestValid",isRequestValid)

      const [buying, setBuying] = useState();

      const [choice, setChoice] = useState();

      function handleChoice(e) {
          setChoice(e.target.value);
          console.log("Choice is set to: ", e.target.value);
      }

    return(
        <Card title="Overview">
            <Row gutter={16}>
                <Col span={8}>
                    <Statistic title="Total sMRKI" value={totalStaked} />
                </Col>
                <Col span={8}>
                    <Statistic title="My sMRKI" value={userStake} />
                </Col>
                <Col span={8} >
                    <Statistic title="My Share" value={share} suffix="%" />
                </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
                <Col span={14}>
                    <Radio.Group value={choice} onChange={handleChoice}>
                        <Radio.Button value={true}>Stake</Radio.Button>
                        <Radio.Button value={false}>Unstake</Radio.Button>
                    </Radio.Group>
                </Col>
                <Col span={10}>
                    {
                        choice?
                            <div>
                                Can Stake {userBal} sMRKI
                            </div>
                        :
                        <div>
                            Can Unstake {stakedBal ? stakedBal.toNumber() : 0} sMRKI
                        </div>
                    }
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={24}>
                    {choice?
                        <div style={{ padding: 8 }}>
                          <Input
                            style={{ textAlign: "center" }}
                            placeholder={"Token Ids to stake"}
                            value={idsToStake.value}
                            onChange={e => {
                              const newValue = e.target.value;
                              const ids = {
                                value: newValue,
                                valid: true
                              }
                              setIdsToStake(ids)
                            }}
                          />
                        </div>
                        :
                        <div style={{ padding: 8 }}>
                          <Input
                            style={{ textAlign: "center" }}
                            placeholder={"Amount of tokens to remove"}
                            value={requestOut.value}
                            onChange={e => {
                              const newValue = e.target.value;
                              const req = {
                                value: newValue,
                                valid: /^\d*\.?\d+$/.test(newValue)//wtf does this do?
                              }
                              setRequestOut(req)
                            }}
                          />
                        </div>
                    }
                    {!choice && isRequestValid?
                        <div style={{ padding: 8 }}>
                          <Button
                            type={"primary"}
                            loading={buying}
                            onClick={async () => {
                              setBuying(true);
                              await tx(writeContracts.Olympus.unstake(requestOut.value));
                              setBuying(false);
                              setRequestOut('');
                            }}
                            disabled={!requestOut.valid}
                          >
                            Unstake Tokens
                          </Button>
                        </div>
                        : !choice?
                        <div style={{ padding: 8 }}>
                          <Button
                            disabled={true}
                            type={"primary"}
                          >
                            Unstake Tokens
                          </Button>
                        </div>
                        : choice && !isOlympusApproved?
                        <div style={{ padding: 8 }}>
                          <Button
                            type={"primary"}
                            loading={buying}
                            onClick={async () => {
                              setBuying(true);
                              await tx(writeContracts.TestMeraki.setApprovalForAll(readContracts.Olympus.address, true));
                              setBuying(false);
                              let resetAmount = idsToStake
                              setIdsToStake('');
                              setTimeout(()=>{
                                setIdsToStake(resetAmount)
                              },1500)
                            }}
                            disabled={!idsToStake.valid}
                            >
                            Approve All
                          </Button>
                        </div>
                        : choice && isOlympusApproved?
                        <div style={{ padding: 8 }}>
                          <Button
                            type={"primary"}
                            loading={buying}
                            onClick={async () => {
                              setBuying(true);
                              await tx(writeContracts.Olympus.stake(idsToStake.value.split(",")));
                              setBuying(false);
                              setIdsToStake([]);
                            }}
                            disabled={!idsToStake.valid}
                          >
                            Stake Tokens
                          </Button>
                        </div>
                        :
                        <Button
                          disabled={true}
                          type={"primary"}
                        >
                          Loading
                        </Button>
                    }
                </Col>
            </Row>
        </Card>
    );

  
}
