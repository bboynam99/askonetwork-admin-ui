import React, { useState, useEffect } from "react";
import addresses from "../contracts/addresses";
import abis from "../contracts/abis";
import {Text, Input, InputGroup, InputLeftAddon } from "@chakra-ui/core"
import TxAmountButtonGroup from "./TxAmountButtonGroup"


export default function PromoFund({web3, address}) {

  const toBN = web3.utils.toBN
  const toWei = web3.utils.toWei
  const fromWei = web3.utils.fromWei

  const [requestReleaseToAddressAmount, setRequestReleaseToAddressAmount] = useState(0)
  const [requestReleaseToAddressAccount, setRequestReleaseToAddressAccount] = useState("0x0")
  const [requestAuthorizeToAddressAmount, setRequestAuthorizeToAddressAmount] = useState(0)

  const [totalAuthorized, setTotalAuthorized] = useState("0")
  const [totalReleased, setTotalReleased] = useState("0")
  const [authorizor, setAuthorizor] = useState("0x0")
  const [releaser, setReleaser] = useState("0x0")

  const [askoTokenSC, setAskoTokenSC] = useState(null)
  const [askoPromoFundSC, setAskoPromoFundSC] = useState(null)

  const handleRequestReleaseToAddress = async () =>{
    if(!web3 || !address || !askoPromoFundSC || !askoTokenSC) {
      alert("You are not connected. Connect and try again.")
      return
    }
    console.log("account",requestReleaseToAddressAccount)
    await askoPromoFundSC.methods.releaseToAddress(
      requestReleaseToAddressAccount,
      toWei(requestReleaseToAddressAmount.toString())
    ).send({from:address})
    alert("Release to address sent. Check your wallet to see when it has confirmed.")
  }

  const handleRequestAuthorize = async () => {
    if(!web3 || !address || !askoPromoFundSC || !askoTokenSC) {
      alert("You are not connected. Connect and try again.")
      return
    }
    await askoPromoFundSC.methods.authorize(
      toWei(requestAuthorizeToAddressAmount.toString())
    ).send({from:address})
    alert("Authorization sent. Check your wallet to see when it has confirmed.")
  }

  useEffect(()=>{
    if(!web3) return
    if(!address) return

    const askoTokenSC = new web3.eth.Contract(abis.askoToken, addresses.askoToken)
    const askoPromoFundSC = new web3.eth.Contract(abis.askoPromoFund, addresses.askoPromoFund)
    if (!askoTokenSC) return
    if (!askoPromoFundSC) return


    let fetchData = async(web3,address,askoTokenSC,askoPromoFundSC)=>{
      const [
        totalAuthorized,
        totalReleased,
        authorizor,
        releaser
      ] = await Promise.all([
        askoPromoFundSC.methods.totalAuthorized().call(),
        askoPromoFundSC.methods.totalReleased().call(),
        askoPromoFundSC.methods.authorizor().call(),
        askoPromoFundSC.methods.releaser().call()
      ])
      console.log(totalAuthorized)
      setTotalAuthorized(totalAuthorized)
      setTotalReleased(totalReleased)
      setAuthorizor(authorizor)
      setReleaser(releaser)
    }

    setAskoTokenSC(askoTokenSC)
    setAskoPromoFundSC(askoPromoFundSC)

    fetchData(web3,address,askoTokenSC,askoPromoFundSC)

    let interval;
    if(window.web3){
      interval = setInterval((web3,address,askoTokenSC,askoPromoFundSC)=>{
        if(!web3 || !address || !askoTokenSC || !askoPromoFundSC) return
        fetchData(web3,address,askoTokenSC,askoPromoFundSC)
      },3000)
    }else{
      interval = setInterval((web3,address,askoTokenSC,askoPromoFundSC)=>{
        if(!web3 || !address || !askoTokenSC || !askoPromoFundSC) return
        fetchData(web3,address,askoTokenSC,askoPromoFundSC)
      },10000)
    }

    return (interval)=>clearInterval(interval)

  },[web3,address])

  return (<>
    <Text color="gray.500" display="block" fontSize="2xl" p="10px" pb="0px" textAlign="center">
      Promo+Airdrop (10m ASKO, authorize - release pattern)
    </Text>
    <Text mb="10px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
      PromoFund Releaser: {releaser} <br/>
      PromoFund Authorizor: {authorizor}
    </Text>
    <Text mb="40px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
      isReleaser? {releaser.toString() === address.toString() ? "yes" : "no"} <br/>
      isAuthorizor? {authorizor.toString() === address.toString() ? "yes" : "no"}
    </Text>
    { releaser.toString() === address.toString() &&
      (<>
        <TxAmountButtonGroup
          web3={web3}
          cap={toBN(totalAuthorized).sub(toBN(totalReleased))}
          setVal={setRequestReleaseToAddressAmount}
          val={requestReleaseToAddressAmount}
          handleClick={handleRequestReleaseToAddress}
          name="Send"
        >
          <Text color="gray.400" >Release Tokens from Promo Fund</Text>
          <InputGroup ml="auto" mr="auto" mt="20px" mb="5px" w="267px">
            <InputLeftAddon color="gray.200" bg="gray.700"  children="Addr"  />
            <Input placeholder="0x123..." w="200px" color="gray.700" bg="gray.200" value={requestReleaseToAddressAccount} onChange={e => setRequestReleaseToAddressAccount(e.target.value)} />
          </InputGroup>
        </TxAmountButtonGroup>
      </>)
    }
    { authorizor.toString() === address.toString() &&
      (<>
        <TxAmountButtonGroup
          web3={web3}
          cap={toBN(toWei("10000000")).sub(toBN(totalAuthorized))}
          setVal={setRequestAuthorizeToAddressAmount}
          val={requestAuthorizeToAddressAmount}
          handleClick={handleRequestAuthorize}
          name="Send"
        >
          <Text color="gray.400" >Authorize Tokens from Promo Fund</Text>
        </TxAmountButtonGroup>
      </>)
    }
  </>)
}
