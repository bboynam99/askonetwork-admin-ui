import React, { useState, useEffect } from "react";
import addresses from "./contracts/addresses";
import abis from "./contracts/abis";
import { ThemeProvider, CSSReset, Box, SimpleGrid, Image, Heading, Flex, Text, Link, Button, Tabs, Tab, TabList, TabPanels, TabPanel, Input, InputGroup, InputLeftAddon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,  } from "@chakra-ui/core"
import theme from "@chakra-ui/theme"
import "./App.css";

import Web3 from "web3";
import Web3Modal from "web3modal";

import WalletConnectProvider from "@walletconnect/web3-provider";
import Fortmatic from "fortmatic";
import Torus from "@toruslabs/torus-embed";
import Authereum from "authereum";
import UniLogin from "@unilogin/provider";
import Portis from "@portis/web3";
import Squarelink from "squarelink";
import Arkane from "@arkane-network/web3-arkane-provider";
import MewConnect from "@myetherwallet/mewconnect-web-client";
import DcentProvider from "dcent-provider";

import CountDown from "./components/CountDown"
import Footer from "./components/Footer"
import Header from "./components/Header"
import TxAmountButtonGroup from "./components/TxAmountButtonGroup"


const INFURA_ID = "f7400d35bb95446ebe055f70cde7ab19"

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID // required
    }
  },
  fortmatic: {
    package: Fortmatic, // required
    options: {
      key: "pk_live_522E2B32F46FB16A" // required
    }
  },
  torus: {
    package: Torus, // required
  },
  authereum: {
    package: Authereum // required
  },
  unilogin: {
    package: UniLogin // required
  },
  portis: {
    package: Portis, // required
    options: {
      id: "12f64063-f3e7-4bed-bb31-8c6dd697867b" // required
    }
  },
  squarelink: {
    package: Squarelink, // required
    options: {
      id: "88f1885b8489c400f03b" // required
    }
  },
  mewconnect: {
    package: MewConnect, // required
    options: {
      infuraId: INFURA_ID // required
    }
  }
};

function shortenDecimal(decimalString) {
  decimalString = decimalString.toString()
  if(!decimalString.includes('.')) return decimalString
  return decimalString.substring(0,decimalString.indexOf('.'))
}

console.log(Web3Modal)

const web3Modal = new Web3Modal({
  network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions // required
});



function App() {

  const [address, setAddress] = useState("")
  const [provider, setProvider] = useState(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/'+INFURA_ID))
  const [web3, setWeb3] = useState(new Web3(provider))

  const toBN = web3.utils.toBN
  const toWei = web3.utils.toWei
  const fromWei = web3.utils.fromWei

  const [connected, setConnected] = useState(false)
  const [chainId, setChainId] = useState(1)
  const [networkId, setNetworkId] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const [requestReleaseToAddressAmount, setRequestReleaseToAddressAmount] = useState(0)
  const [requestReleaseToAddressAccount, setRequestReleaseToAddressAccount] = useState("0x0")
  const [requestAuthorizeToAddressAmount, setRequestAuthorizeToAddressAmount] = useState(0)

  const [totalAuthorized, setTotalAuthorized] = useState("0")
  const [totalReleased, setTotalReleased] = useState("0")
  const [authorizor, setAuthorizor] = useState("0x0")
  const [releaser, setReleaser] = useState("0x0")

  const [askoTokenSC, setAskoTokenSC] = useState(null)
  const [askoPromoFundSC, setAskoPromoFundSC] = useState(null)

  const initWeb3 = async (provider) => {
    const web3 = new Web3(provider);

    web3.eth.extend({
      methods: [
        {
          name: "chainId",
          call: "eth_chainId",
          outputFormatter: web3.utils.hexToNumber
        }
      ]
    });

    return web3;
  }


  const resetApp = async () => {
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    await web3Modal.clearCachedProvider();
    setAddress("")
    setWeb3(null)
    setProvider(null)
    setConnected(false)
    setChainId(1)
    setNetworkId(1)
    setShowModal(false)
  };

  const subscribeProvider = async (provider,web3) => {
      if (!provider.on) {
        return
      }
      provider.on("close", () => resetApp(web3));
      provider.on("accountsChanged", async (accounts) => {
        setAddress(accounts[0])
      });
      provider.on("chainChanged", async (chainId) => {
        const networkId = await web3.eth.net.getId()
        setChainId(chainId)
        setNetworkId(networkId)
      });
      provider.on("networkChanged", async (networkId) => {
        const chainId = await web3.eth.chainId();
        setChainId(chainId)
        setNetworkId(networkId)
      });
    };

  const onConnect = async () => {
    const provider = await web3Modal.connect()
    const web3 = await initWeb3(provider)
    await subscribeProvider(provider,web3)
    const accounts = await web3.eth.getAccounts()
    const address = accounts[0]
    const networkId = await web3.eth.net.getId()
    const chainId = await web3.eth.chainId()

    setConnected(true)
    setAddress(address)
    setChainId(chainId)
    setNetworkId(networkId)
    setProvider(provider)
    setWeb3(web3)
  }

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
    if(window.web3) onConnect()
  },[])

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
        releaser,
        accountApproved
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

    setAskoTokenSC(askoTokenSC)
    setAskoPromoFundSC(askoPromoFundSC)

    return (interval)=>clearInterval(interval)

  },[web3,address])


  return (
    <ThemeProvider theme={theme} >
      <CSSReset />
      <Box w="100%" minH="100vh" bg="gray.800" color="gray.100" position="relative"  p="20px" pb="160px" >
        <Header web3={web3} address={address} onConnect={onConnect} />
        { address ? (<>
          <Text mb="10px" mt="40px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
            Account connected.
          </Text>
          <Text mb="10px" mt="40px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
            version 0.1.0
          </Text>
        </>) : (
          <Text mb="10px" mt="40px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
            No Ethereum wallet connected.
          </Text>
        )}
        <Text mb="10px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
          Releaser: {releaser} <br/>
          Authorizor: {authorizor}
        </Text>
        <Text mb="40px" mt="10px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
          isReleaser? {authorizor.toString() === address.toString() ? "yes" : "no"} <br/>
          isAuthorizor? {releaser.toString() === address.toString() ? "yes" : "no"}
        </Text>
        <Box width="250px" height="1px" bg="gray.700" ml="auto" mr="auto" mt="10px" mb="10px" />
        <Text color="gray.500" display="block" fontSize="2xl" p="10px" pb="0px" textAlign="center">
          Promo+Airdrop (10m ASKO, authorize - release pattern)
        </Text>
        { authorizor.toString() === address.toString() &&
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
        { releaser.toString() === address.toString() &&
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
        <Box width="250px" height="1px" bg="gray.700" ml="auto" mr="auto" mt="10px" mb="10px" />
        </Box>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
