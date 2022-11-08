import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Heading, VStack, Container, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Tooltip } from '@chakra-ui/react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React } from "@web3-react/core";
import { XProxy } from 'components/templates/xenExtension/xProxy';
import { XNFTs } from 'components/templates/xenExtension/xNFT';
import { XEN } from 'components/templates/xenExtension/xen';
import { DPool } from 'components/templates/xenExtension/dPool';
import { chainId2NetworkName } from 'utils/config';
import { isEmptyObj } from 'utils/utils';

const Home = () => {
  const { active, account, library, chainId, activate, deactivate } = useWeb3React()
  const router = useRouter()

  useEffect(() => {
    console.log(router.query);
    const { s } = router.query;
    if (!isEmptyObj(s)) {
      window.localStorage.setItem('spreader', s as string);
    }
  });

  const injected = new InjectedConnector({
    supportedChainIds: [97, 42170],
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

  return (
    <VStack w='full'>
      <Heading size="md" marginBottom={6}>
        <Tooltip label={'Current supported network: Arbitrum-Nova and BSC-Testnet.'}>
          <Button onClick={() => wallet()} colorScheme='teal' variant='outline'>
            {active ? <span>{chainId2NetworkName[chainId || 0]}: <b>{account}</b></span> : <span>Connect to MetaMask</span>}
          </Button>  
        </Tooltip>  
      </Heading>

      
      <Tabs width="150%">
        <TabList>
          <Tab>XEN</Tab>
          <Tab>Batch Mint</Tab>
          <Tab>Dividendable NFT</Tab>
          <Tab>Dividend Pool</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Container maxW="100%" width="150%" p={3} marginTop={100} as="main" minH="70vh">
              <XEN account={account || ''} web3={library} chainId={chainId || 0}/>
            </Container>
          </TabPanel>
          <TabPanel>
            <Container maxW="100%" width="150%" p={3} marginTop={100} as="main" minH="70vh">
              <XProxy account={account || ''} web3={library} chainId={chainId || 0}/>
            </Container>
          </TabPanel>
          <TabPanel>
            <Container maxW="100%" width="150%"  p={3} marginTop={100} as="main" minH="70vh">
              <XNFTs account={account || ''} web3={library} chainId={chainId || 0}/>
            </Container>
          </TabPanel>
          <TabPanel>
            <Container maxW="100%" width="150%"  p={3} marginTop={100} as="main" minH="70vh">
              <DPool account={account || ''} web3={library} chainId={chainId || 0}/>
            </Container>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default Home;