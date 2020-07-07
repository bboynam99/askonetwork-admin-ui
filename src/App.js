import React, { useState, useEffect } from "react";
import { ThemeProvider, CSSReset, Box, Text  } from "@chakra-ui/core"
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
import MewConnect from "@myetherwallet/mewconnect-web-client";

import Footer from "./components/Footer"
import Header from "./components/Header"
import PromoFund from "./components/PromoFund"
import TeamLock from "./components/TeamLock"


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



  useEffect(()=>{
    if(window.web3) onConnect()
  },[])



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
            version 0.1.2
          </Text>
        </>) : (
          <Text mb="10px" mt="40px" color="gray.300" display="block" fontSize="sm" p="10px" pb="0px" textAlign="center">
            No Ethereum wallet connected.
          </Text>
        )}
        <Box width="250px" height="1px" bg="gray.700" ml="auto" mr="auto" mt="10px" mb="10px" />
        <TeamLock web3={web3} address={address} />
        <Box width="250px" height="1px" bg="gray.700" ml="auto" mr="auto" mt="10px" mb="10px" />
        <PromoFund web3={web3} address={address} />
        <Box width="250px" height="1px" bg="gray.700" ml="auto" mr="auto" mt="10px" mb="10px" />
        </Box>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
