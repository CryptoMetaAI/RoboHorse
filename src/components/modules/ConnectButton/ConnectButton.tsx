import { Button, Text, HStack, Avatar, Tooltip } from '@chakra-ui/react';
import { getEllipsisTxt } from 'utils/format';
import React from 'react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React, initializeConnector } from "@web3-react/core";
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2';
import { useWeb3Modal } from '@web3modal/react'

const ConnectButton = () => {
  const { active, account, library, chainId, activate, deactivate } = useWeb3React()
  const { open, close } = useWeb3Modal()
 
  const injected = new InjectedConnector({
    supportedChainIds: [1, 5, 97, 10, 42161, 42170],
  })

  async function connect() {
    try {
      console.log('connect')
      await activate(injected)
    } catch (ex) {
      console.log(ex)
    }
  }

  async function disconnect() {
    try {
      deactivate()
    } catch (ex) {
      console.log(ex)
    }
  }

  function wallet() {
    if (active) {
      disconnect();
    } else {
      connect();
    }
  }

  if (active) {
    return (
      <HStack onClick={disconnect} cursor={'pointer'}>
        <Text fontWeight="medium">{getEllipsisTxt(account as string)}</Text>
      </HStack>
    );
  }

  return (
    <Tooltip label={'Current supported network: Arbitrum-One/Nova, Optimism and BSC-Testnet.'}>
      <Button onClick={() => open()} colorScheme='teal' variant='outline'>
        Connect Wallet
      </Button>  
    </Tooltip>  
  );
};

export default ConnectButton;
