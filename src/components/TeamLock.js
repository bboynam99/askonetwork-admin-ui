import React, { useState, useEffect } from "react";
import addresses from "../contracts/addresses";
import abis from "../contracts/abis";
import {Text, Button } from "@chakra-ui/core"


export default function TeamLock({web3, address}) {

  const toBN = web3.utils.toBN
  const toWei = web3.utils.toWei
  const fromWei = web3.utils.fromWei

  const [requestReleaseToAddressAmount, setRequestReleaseToAddressAmount] = useState(0)
  const [requestReleaseToAddressAccount, setRequestReleaseToAddressAccount] = useState("0x0")
  const [requestAuthorizeToAddressAmount, setRequestAuthorizeToAddressAmount] = useState(0)

  const [claimAmount, setClaimAmount] = useState("0")

  const [askoTokenSC, setAskoTokenSC] = useState(null)
  const [askoTeamLockSC, setAskoTeamLockSC] = useState(null)

  const handleClaim = async () =>{
    if(!web3 || !address || !askoTeamLockSC || !askoTokenSC) {
      alert("You are not connected. Connect and try again.")
      return
    }
    await askoTeamLockSC.methods.claim().send({from:address})
    alert("Claim sent. Check your wallet to see when it has confirmed.")
  }

  useEffect(()=>{
    if(!web3) return
    if(!address) return

    const askoTokenSC = new web3.eth.Contract(abis.askoToken, addresses.askoToken)
    const askoTeamLockSC = new web3.eth.Contract(abis.askoTeamLock, addresses.askoTeamLock)
    if (!askoTokenSC) return
    if (!askoTeamLockSC) return


    let fetchData = async(web3,address,askoTokenSC,askoTeamLockSC)=>{
      const [
        currentCycle,
        teamMemberClaimed
      ] = await Promise.all([
        askoTeamLockSC.methods.getCurrentCycleCount().call(),
        askoTeamLockSC.methods.teamMemberClaimed(address).call()
      ])

      console.log("currentCycle",currentCycle)
      console.log("teamMemberClaimed",teamMemberClaimed)

      setClaimAmount(
        toBN(currentCycle).mul(toBN(toWei("250000"))).sub(toBN(teamMemberClaimed))
      )

    }

    setAskoTokenSC(askoTokenSC)
    setAskoTeamLockSC(askoTeamLockSC)

    fetchData(web3,address,askoTokenSC,askoTeamLockSC)

    let interval;
    if(window.web3){
      interval = setInterval((web3,address,askoTokenSC,askoTeamLockSC)=>{
        if(!web3 || !address || !askoTokenSC || !askoTeamLockSC) return
        fetchData(web3,address,askoTokenSC,askoTeamLockSC)
      },3000)
    }else{
      interval = setInterval((web3,address,askoTokenSC,askoTeamLockSC)=>{
        if(!web3 || !address || !askoTokenSC || !askoTeamLockSC) return
        fetchData(web3,address,askoTokenSC,askoTeamLockSC)
      },10000)
    }

    return (interval)=>clearInterval(interval)

  },[web3,address])

  return (<>
    <Text color="gray.500" display="block" fontSize="2xl" p="10px" pb="0px" textAlign="center">
      Team Lock (10m, 2.5m/member, 250k/30 days)
    </Text>
    <Text mb="10px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
      TeamMembers: <br/>
      {addresses.team[0]} <br/>
      {addresses.team[1]} <br/>
      {addresses.team[2]} <br/>
      {addresses.team[3]} <br/>
    </Text>
    <Text mb="40px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
      isTeamMember? {addresses.team.includes(address) ? "yes" : "no"} <br/>
    </Text>
    { addresses.team.includes(address) &&
      (<>
        <Button color="gray.300" display="block" ml="auto" mr="auto" onClick={handleClaim} bg="blue.700" fg="gray.200">Claim</Button>
        <Text m="10px" color="gray.600"  ml="auto" mr="auto" textAlign="center" fontSize="sm">
          Available to claim: {fromWei(claimAmount)} <br/>
        </Text>
      </>)
    }
  </>)
}
