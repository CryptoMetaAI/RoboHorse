import { Button, Text, HStack, Avatar, Tooltip } from '@chakra-ui/react';
import { getEllipsisTxt } from 'utils/format';
import React from 'react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React, initializeConnector } from "@web3-react/core";
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2';
import { useWeb3Modal, Web3Button, Web3NetworkSwitch } from '@web3modal/react';
import { useAccount, useConnect } from 'wagmi'

const ConnectButton = () => {
  const { isConnected } = useAccount()
  const { open, close } = useWeb3Modal()
 
  return (
    <HStack>
      {
        isConnected ? <Web3NetworkSwitch /> : ''
      }
      <Web3Button /> 
    </HStack> 
  );
};

export default ConnectButton;
