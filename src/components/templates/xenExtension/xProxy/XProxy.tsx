import {
  Button,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  VStack,
  Heading,
  Box,
  Tooltip,
  HStack,
  useColorModeValue,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { getEllipsisTxt } from 'utils/format';
import XEN from 'abi/xen.json';
import XProxyABI from 'abi/xProxy.json';
import XNFT from 'abi/dNFT.json';
import RewardCalculator from 'abi/rewardCalculator.json';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import {xenAddr, xNFTAddr, rewardCalculatorAddr} from 'utils/config';
import copy from 'copy-to-clipboard';


type Web3Info = {
  account: string;
  web3: any;
  chainId: number;
}

const XProxy: FC<Web3Info> = ({ account, web3, chainId }) => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()
  const xProxyPopover = useDisclosure()

  const [proxyList, setProxyList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<any>({});
  const [isMinting, setIsMinting] = useState<any>({});
  const [xen, setXen] =useState<any>(null);
  const [xNFT, setXNFT] =useState<any>(null);
  const [rewardCalculator, setRewardCalculator] =useState<any>(null);
  const [globalRank, setGlobalRank] = useState<number>(0);
  const [mintFee, setMintFee] = useState<number>(0);
  
  const toast = useToast();

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  let proxyNumber = '';
  let termPerProxy = '';

  useEffect(() => {
    if (web3 != null) {
      setXen(new web3.eth.Contract(XEN, xenAddr[chainId]));
      setXNFT(new web3.eth.Contract(XNFT, xNFTAddr[chainId]));
      setRewardCalculator(new web3.eth.Contract(RewardCalculator, rewardCalculatorAddr[chainId]));
      xProxyPopover.onOpen();
    }
  }, [web3])

  const getGlobalRank = () => {
    const contractFunc = xen.methods['globalRank'];        
      contractFunc().call({from: account}).then((result: any) => {
        setGlobalRank(result);
      });
  }

  useEffect(() => {
    if (xen != null) {
      getGlobalRank();
      getMintFee();
    }
  }, [xen])

  useEffect(() => {
    if (xNFT != null) {
      getAllProxies();
    }
  }, [xNFT])

  const handleProxyNumberChange = (e: any) => {
    proxyNumber = e.target.value;    
  }

  const handleTermPerProxyChange = (e: any) => {
    termPerProxy = e.target.value;
  }

  const getOneProxy = (proxyAddr: string, callback: (proxyInfo: any) => void) => {
    const xProxy = new web3.eth.Contract(XProxyABI, proxyAddr);
    let contractFunc = xProxy.methods['getUserMint'];  
    contractFunc().call({from: account}).then((mintInfo: any) => {
      contractFunc = rewardCalculator.methods["calculateMintReward"];
      contractFunc(mintInfo.rank, mintInfo.term, mintInfo.maturityTs, mintInfo.amplifier, mintInfo.eaaRate).call({from: account}).then((reward: any) => {
        contractFunc = xProxy.methods['mintedAmount'];
        contractFunc().call({from: account}).then((mintedAmount: any) => {
          contractFunc = xNFT.methods["allTokensInSlot"];
          contractFunc(proxyAddr).call({from: account}).then((allNFTIds: any) => {
            contractFunc = xen.methods["balanceOf"];
            contractFunc(proxyAddr).call({from: account}).then((balance: any) => {
              const proxyInfo: any = {};
              proxyInfo.address = proxyAddr;
              proxyInfo.rank = mintInfo.rank;
              proxyInfo.reward = mintedAmount > 0 ? mintedAmount : reward;
              proxyInfo.term = mintInfo.term;
              proxyInfo.maturityTs = mintInfo.maturityTs;
              proxyInfo.claimed = mintedAmount > 0 || mintInfo.term === '0';
              proxyInfo.xNFTIds = allNFTIds;
              proxyInfo.balance = new BigNumber(balance).shiftedBy(-18).toNumber();
              callback(proxyInfo);
            });
          });
        });
      });
    });
  }
  const getAllProxies = () => {
    const contractFunc = xNFT.methods['getProxies'];
    let count: number = 0;
    contractFunc(account).call({from: account}).then((proxyAddrs: any) => {
      const proxiesInfo: any[] = [];
      const callbackFunc = (proxyInfo: any) => {
        count++;
        proxiesInfo.push(proxyInfo);
        if (count === proxyAddrs.length) {
          proxiesInfo.sort((a: any, b: any) => {
            let aInt = parseInt(a.maturityTs);
            let bInt = parseInt(b.maturityTs);
            if (aInt === 0) {
              aInt = 10000000000000;
            }
            if (bInt === 0) {
              bInt = 10000000000000;
            }
            return aInt - bInt;
          });
          console.log(proxiesInfo);
          setProxyList(proxiesInfo);
        }
      }

      if (proxyAddrs.length === 0) {
        xProxyPopover.onOpen();
      }
      proxyAddrs.forEach((proxyAddr: string) => {
        getOneProxy(proxyAddr, callbackFunc);
      });
    });
  }

  const createProxies = () => {
    const contractFunc = xNFT.methods['batchCreateProxy']; 
    const data = contractFunc(proxyNumber, termPerProxy).encodeABI();
    const totalMintFee = `0x${new BigNumber(mintFee).multipliedBy(new BigNumber(proxyNumber)).toString(16)}`;
    const tx = {
        from: account,
        to: xNFTAddr[chainId],
        data,
        value: totalMintFee,
        gasLimit: 0
    }
    contractFunc(proxyNumber, termPerProxy).estimateGas({from: account, value: totalMintFee}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsLoading(true);
          })
          .on('receipt', () => {
            onClose();
            setIsLoading(false);
            getAllProxies();
          })
          .on('error', () => {
            setIsLoading(false);
            toast({
              title: 'Create Proxies Failed',
              description: "Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const getMintFee = () => {
    const contractFunc = xen.methods['MintFee'];        
      contractFunc().call({from: account}).then((result: any) => {
        setMintFee(result);
        console.log(result);
      });
  }

  const burnMintDNFT = (proxyInfo: any) => {
    if (!proxyInfo.claimed) {
      toast({
        title: 'Warning',
        description: "Claim mint reward firstly.",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    const contractFunc = xNFT.methods['burnXenInXProxy']; 
    const data = contractFunc(proxyInfo.address).encodeABI();
    const tx = {
        from: account,
        to: xNFTAddr[chainId],
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(proxyInfo.address).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setMintInfo(proxyInfo.address, true);
          })
          .on('receipt', () => {
            onClose();
            setMintInfo(proxyInfo.address, false);
            getOneProxy(proxyInfo.address, updateOneProxy);
          })
          .on('error', () => {
            setMintInfo(proxyInfo.address, false);
            toast({
              title: 'Failed',
              description: "Mint xNFT Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }
  
  const claimMintReward = (proxyInfo: any) => {
    if (parseInt(proxyInfo.maturityTs) * 1000 > new Date().getTime()) {
      toast({
        title: 'Warning',
        description: "It's not time yet",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    if (proxyInfo.claimed) {
      toast({
        title: 'Warning',
        description: "Have been claimed",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    if (proxyInfo.reward === '0' || proxyInfo.reward === 0) {
      toast({
        title: 'Warning',
        description: "No reward could be claimed",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    const xProxy = new web3.eth.Contract(XProxyABI, proxyInfo.address);
    const contractFunc = xProxy.methods['claimMintReward'];  
    const data = contractFunc().encodeABI();
    const tx = {
        from: account,
        to: proxyInfo.address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc().estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setClaimInfo(proxyInfo.address, true);
          })
          .on('receipt', () => {
            onClose();
            setClaimInfo(proxyInfo.address, false);
            getOneProxy(proxyInfo.address, updateOneProxy);
          })
          .on('error', () => {
            setClaimInfo(proxyInfo.address, false);
            toast({
              title: 'Failed',
              description: "Claim failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const claimReward = (proxyInfo: any) => {
    const contractFunc = xNFT.methods['claimReward'];  
    const data = contractFunc(proxyInfo.address).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(proxyInfo.address).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setClaimInfo(proxyInfo.address, true);
          })
          .on('receipt', () => {
            onClose();
            setClaimInfo(proxyInfo.address, false);
            getOneProxy(proxyInfo.address, updateOneProxy);
          })
          .on('error', () => {
            setClaimInfo(proxyInfo.address, false);
            toast({
              title: 'Failed',
              description: "Claim failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const setClaimInfo = (address: string, bClaiming: boolean) => {
    const claimingInfo: any = {}
    claimingInfo[address] = bClaiming;
    setIsClaiming(claimingInfo);
  }

  const setMintInfo = (address: string, bMinting: boolean) => {
    const mintingInfo: any = {}
    mintingInfo[address] = bMinting;
    setIsMinting(mintingInfo);
  }

  const updateOneProxy = (proxyInfo: any) => {
    const updatedProxyList = proxyList.map((proxy: any) => {
      if (proxy.address === proxyInfo.address) {
        return proxyInfo;
      }
      return proxy;
    })
    setProxyList(updatedProxyList);
  }

  const updateReward = (proxyAddress: string) => {
    getOneProxy(proxyAddress, updateOneProxy);
  }

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Your Batch Minted Rank</div>
            <Tooltip label={'click to refresh the value'}>
              <Button colorScheme='teal' variant='outline' onClick={getGlobalRank}>globalRank = {globalRank}</Button>
            </Tooltip>
          </HStack>
          <HStack spacing='18px'>
            <Button colorScheme='teal' variant='outline' onClick={getAllProxies}>Refresh</Button>
            <Tooltip label={'Using proxy contract, you can mint multiple times using same account(EOA).'}>
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Batch Mint</Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {proxyList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th isNumeric>Address</Th>
                  <Th>Rank</Th>
                  <Th>Term</Th>
                  <Th>MaturityTs</Th>
                  <Th>Left / Reward</Th>
                  <Th>Status</Th>
                  <Th>Number of xNFTs</Th>
                  <Th>Operators</Th>
                </Tr>
              </Thead>
              <Tbody>
                {proxyList?.map((proxy, key) => (
                  <Tr key={`${proxy.address}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer">                    
                    <Td isNumeric>
                      <Tooltip label={`${proxy.address}, click to copy`}>
                        <div onClick={() => {
                          copy(proxy.address);
                          toast({
                            title: 'Success',
                            description: "Address has been copied",
                            status: 'success',
                            position: 'bottom-right',
                            isClosable: true,
                          })
                        }}>
                          {getEllipsisTxt(proxy.address || '')}
                        </div>
                      </Tooltip>
                    </Td>                
                    <Td isNumeric>{proxy.rank === '0' ? '/' : proxy.rank}</Td>            
                    <Td isNumeric>{proxy.term === '0' ? '/' : proxy.term}</Td>         
                    <Td isNumeric>{proxy.maturityTs === '0' ? '/' : moment(new Date(parseInt(proxy.maturityTs) * 1000)).format('YYYY/MM/DD HH:mm:ss')}</Td>
                    <Td isNumeric>
                      {proxy.claimed ? 
                        <Tooltip label={'the final value of reward claimed'}>
                          <Button colorScheme='teal' variant='ghost'>{proxy.balance} / {new BigNumber(proxy.reward).shiftedBy(-18).toNumber()}</Button>
                        </Tooltip>
                          : 
                        <Tooltip label={'click to refresh the value'}>
                          <Button colorScheme='teal' variant='ghost' onClick={() => updateReward(proxy.address)}>{proxy.balance} / {proxy.reward}</Button>
                        </Tooltip>
                      }
                    </Td>
                    <Td color={proxy.claimed ? 'teal': ''}>{proxy.claimed ? 'Claimed' : 'Not Claimed'}</Td>
                    <Td isNumeric>{proxy.xNFTIds.length}</Td>
                    <Td>
                      <VStack spacing={4} align='center'>
                        {
                          proxy.claimed ? 
                            proxy.xNFTIds.length === 0 && proxy.balance > 0 ? 
                              <Tooltip label={'Token will be claimed to your account from proxy contract'}>
                                <Button colorScheme='teal' variant='outline' isLoading={isClaiming[proxy.address]} loadingText='Claiming' onClick={() => claimReward(proxy)}>Claim Reward</Button>
                              </Tooltip>
                              :
                              null
                            :
                            <Tooltip label={'Token will be stored in proxy contract when claimed'}>
                              <Button colorScheme='teal' variant='outline' isLoading={isClaiming[proxy.address]} loadingText='Claiming' onClick={() => claimMintReward(proxy)}>Claim Mint Reward</Button>
                            </Tooltip>
                        }
                        {
                          proxy.xNFTIds.length > 0 || proxy.balance === 0 ? 
                            null :
                            <Button colorScheme='teal' variant='outline' isLoading={isMinting[proxy.address]} loadingText='Minting' onClick={() => burnMintDNFT(proxy)}>Burn & Mint DNFT</Button>
                        }
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks Like you do not have any minted rank.</Box>
      )}
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Batch Mint XEN</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Total Mint</FormLabel>
              <Input ref={initialRef} onChange={handleProxyNumberChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Term Per Mint</FormLabel>
              <Input onChange={handleTermPerProxyChange} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={createProxies} isLoading={isLoading} loadingText='Creating'>
              Mint
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default XProxy;
