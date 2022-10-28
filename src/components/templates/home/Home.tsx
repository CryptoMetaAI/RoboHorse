import { Heading, VStack } from '@chakra-ui/react';
import { Container, Button, Tabs, TabList, TabPanels, Tab, TabPanel, Tooltip } from '@chakra-ui/react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React } from "@web3-react/core";
import { XProxy } from 'components/templates/xenExtension/xProxy';
import { XNFTs } from 'components/templates/xenExtension/xNFT';
import { XEN } from 'components/templates/xenExtension/xen';
import { chainId2NetworkName } from 'utils/config';

const Home = () => {
  const { active, account, library, chainId, activate, deactivate } = useWeb3React()
  
  const injected = new InjectedConnector({
    supportedChainIds: [1, 56, 97, 137, 80001, 42170],
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
        <Tooltip label={'Current supported network: BSC-Testnet, and the mainnet of Ethereum, BSC and Polygon will be supported soon.'}>
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
          {/* <TabPanel>
            <Container maxW="100%" width="150%"  p={3} marginTop={100} as="main" minH="70vh">
              
            </Container>
          </TabPanel> */}
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default Home;