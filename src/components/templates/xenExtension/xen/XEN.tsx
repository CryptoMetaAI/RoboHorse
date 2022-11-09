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
  InputGroup,
  InputRightAddon,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import XENABI from 'abi/xen.json';
import DNFT from 'abi/dNFT.json';
import RewardCalculator from 'abi/rewardCalculator.json';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import {xenAddr, xNFTAddr, rewardCalculatorAddr} from 'utils/config';
import {wssUrl} from 'utils/config';
import Web3 from 'web3';


type Web3Info = {
  account: string;
  web3: any;
  chainId: number;
}

const XProxy: FC<Web3Info> = ({ account, web3, chainId }) => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const burnPopover = useDisclosure();

  const [mintInfoList, setMintInfoList] = useState<any[]>([]);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [xen, setXen] =useState<any>(null);
  const [xNFT, setXNFT] =useState<any>(null);
  const [rewardCalculator, setRewardCalculator] =useState<any>(null);
  const [globalRank, setGlobalRank] = useState<number>(0);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [myXENBalance, setMyXENBalance] = useState<number>(0);
  const [myXENBurned, setMyXENBurned] = useState<number>(0);
  const [mintFee, setMintFee] = useState<number>(0);
  const [userMintInfo, setUserMintInfo] = useState<any>({maturityTs: 0, term: 0});
  const [termOfMint, setTermOfMint] = useState<number>(0);
  const [allowance, setAllowance] = useState<number>(0);
  const [numberOfBurned, setNumberOfBurned] = useState<number>(0);
  const [mintReward, setMintReward] = useState<number>(0);
  
  const toast = useToast();

  const initialRef = React.useRef(null)
  const finalRef = React.useRef(null)

  useEffect(() => {
    if (chainId > 0 && web3 != null) {
      setXen(new web3.eth.Contract(XENABI, xenAddr[chainId]));
      setXNFT(new web3.eth.Contract(DNFT, xNFTAddr[chainId]));
      setRewardCalculator(new web3.eth.Contract(RewardCalculator, rewardCalculatorAddr[chainId]));
    }
  }, [web3])

  const getGlobalRank = () => {
    const contractFunc = xen.methods['globalRank'];        
    contractFunc().call({from: account}).then((result: any) => {
      setGlobalRank(result);
    });
  }

  const getTotalSupply = () => {
    const contractFunc = xen.methods['totalSupply'];        
    contractFunc().call({from: account}).then((result: any) => {
      setTotalSupply(result);
    });
  }

  const getMyBalance = () => {
    const contractFunc = xen.methods['balanceOf'];        
    contractFunc(account).call({from: account}).then((result: any) => {
      setMyXENBalance(result);
    });
  }

  const getMyBurnedXEN = () => {
    const contractFunc = xen.methods['userBurns'];        
    contractFunc(account).call({from: account}).then((result: any) => {
      setMyXENBurned(result);
    });
  }

  const getMintFee = () => {
    const contractFunc = xen.methods['MintFee'];        
    contractFunc().call({from: account}).then((result: any) => {
      setMintFee(result);
      console.log(result);
    });
  }

  const getUserMintInfo = () => {
    let contractFunc = xen.methods['getUserMint'];        
    contractFunc().call({from: account}).then((result: any) => {
      setUserMintInfo(result);
      contractFunc = rewardCalculator.methods['calculateMintReward']; 
      contractFunc(result.rank, result.term, result.maturityTs, result.amplifier, result.eaaRate).call({from: account}).then((reward: any) => {
        setMintReward(reward);
      });
    });
  }

  const getAllowance = () => {
    const contractFunc = xen.methods['allowance'];        
    contractFunc(account, xNFTAddr[chainId]).call({from: account}).then((result: any) => {
      console.log(result);
      setAllowance(result);
    });
  }

  const syncPastEvents = () => {
    web3.eth.getBlockNumber().then((blockNumber: number) => {
      xen.getPastEvents('RankClaimed', {fromBlock: blockNumber - 5000, toBlock: 'latest'}).then((events: any[]) => {
        let mintList: any[] = [];
        events.forEach((event: any) => {
          mintList = [event.returnValues, ...mintList];
        });
        setMintInfoList(mintList);
      })
    })
  }

  const subscribeXENEvent = () => {   
    const wssWeb3 = new Web3(wssUrl[chainId]);
    const wssXEN = new wssWeb3.eth.Contract(XENABI, xenAddr[chainId]);
        
    wssXEN.events.allEvents()
                      .on('data', (event: any) => {
                        console.log(event);
                        const eventName = event.returnValues.event;
                        if (eventName === 'RankClaimed') {
                          const returnValues = event.returnValues;
                          setGlobalRank(returnValues.rank);
                          let mintList = JSON.parse(JSON.stringify(mintInfoList));
                          mintList = [returnValues, ...mintList].slice(0, 100);
                          setMintInfoList(mintList);
                        }
                      })
                     .on('changed', (changed: any) => console.log('changed', changed))
                     .on('error', (err: any) => console.log(err))
                     .on('connected', (subscriptionId: number) => console.log('subscriptionId', subscriptionId));
  }

  useEffect(() => {
    if (chainId > 0 && xen != null) {
      getGlobalRank();
      getTotalSupply();
      getMintFee();
      syncPastEvents();
      subscribeXENEvent();
    }
  }, [xen])

  useEffect(() => {
    if (chainId > 0 && xen != null && account != null) {
      getUserMintInfo();
      getMyBalance();
      getAllowance();
      getMyBurnedXEN();
    }
  }, [xen, account])

  const handleTermOfMint = (e: any) => {
    setTermOfMint(parseInt(e.target.value));
  }

  const handleBurnedNumber = (e: any) => {
    setNumberOfBurned(e.target.value);
  }
  
  const claimRank = () => {
    let spreader = window.localStorage.getItem('s');
    if (!web3.utils.isAddress(spreader)) {
      spreader = '0x0000000000000000000000000000000000000000';
    }
    const contractFunc = xen.methods['claimRank']; 
    const data = contractFunc(termOfMint, spreader).encodeABI();
    const tx = {
        from: account,
        to: xenAddr[chainId],
        data,
        value: `0x${new BigNumber(mintFee).toString(16)}`,
        gasLimit: 0
    }
    contractFunc(termOfMint, spreader).estimateGas({from: account, value: `0x${new BigNumber(mintFee).toString(16)}`}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsMinting(true);
          })
          .on('receipt', () => {
            onClose();
            setIsMinting(false);
            getUserMintInfo();
          })
          .on('error', () => {
            setIsMinting(false);
            toast({
              title: 'Claim Rank Failed',
              description: "Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const claimMintReward = () => {
    const contractFunc = xen.methods['claimMintReward']; 
    const data = contractFunc().encodeABI();
    const tx = {
        from: account,
        to: xenAddr[chainId],
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc().estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsMinting(true);
          })
          .on('receipt', () => {
            onClose();
            setIsMinting(false);
            getUserMintInfo();
            getMyBalance();
          })
          .on('error', () => {
            setIsMinting(false);
            toast({
              title: 'Claim Mint Reward Failed',
              description: "Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const approve = () => {
    const contractFunc = xen.methods['approve']; 
    const data = contractFunc(xNFTAddr[chainId], `0x${new BigNumber(1).shiftedBy(30).toString(16)}`).encodeABI();
    const tx = {
        from: account,
        to: xenAddr[chainId],
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(xNFTAddr[chainId], `0x${new BigNumber(1).shiftedBy(30).toString(16)}`).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsApproving(true);
          })
          .on('receipt', () => {
            onClose();
            setIsApproving(false);
          })
          .on('error', () => {
            setIsApproving(false);
            toast({
              title: 'Approve XEN Failed',
              description: "Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const burnXEN = () => {
    const burnedAmount = `0x${new BigNumber(numberOfBurned).shiftedBy(18).toString(16)}`;
    const contractFunc = xNFT.methods['burnXen']; 
    const data = contractFunc(burnedAmount).encodeABI();
    const tx = {
        from: account,
        to: xNFTAddr[chainId],
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(burnedAmount).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsBurning(true);
          })
          .on('receipt', () => {
            onClose();
            setIsBurning(false);
            getMyBalance();
            getMyBurnedXEN();
          })
          .on('error', () => {
            setIsBurning(false);
            toast({
              title: 'Failed',
              description: "Burn XEN Failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <Tooltip label={'click to refresh the value'}>
              <Button colorScheme='teal' variant='outline' onClick={getGlobalRank}>globalRank = {globalRank}</Button>
            </Tooltip>
            <Tooltip label={'click to refresh the value'}>
              <Button colorScheme='teal' variant='outline' onClick={getTotalSupply}>totalSupply = {new BigNumber(totalSupply).shiftedBy(-18).toString()}</Button>
            </Tooltip>
            <Tooltip label={'click to refresh the value'}>
              <Button colorScheme='teal' variant='outline' onClick={getMyBalance}>My XEN Balance = {new BigNumber(myXENBalance).shiftedBy(-18).toString()}</Button>
            </Tooltip>
            <Tooltip label={'click to refresh the value'}>
              <Button colorScheme='teal' variant='outline' onClick={getMyBurnedXEN}>My XEN Burned= {new BigNumber(myXENBurned).shiftedBy(-18).toString()}</Button>
            </Tooltip>
          </HStack>
          <HStack spacing='18px' display={"none"}>
            {
              userMintInfo && 
                (parseInt(userMintInfo.maturityTs) * 1000 > new Date().getTime() || userMintInfo.term == 0 ? 
                <Tooltip label={userMintInfo.term > 0 ? `Maturity: ${moment(new Date(parseInt(userMintInfo.maturityTs) * 1000)).format('YYYY/MM/DD HH:mm:ss')}, Mint Reward: ${mintReward} XEN` : ''}>
                  <Button colorScheme='teal' variant='outline' onClick={() => { if (userMintInfo.term == 0) { onOpen(); } }}>{userMintInfo.term > 0 ? 'My Minting' : 'Mint'}</Button>
                </Tooltip>
                :
                <Tooltip label={`Maturity: ${moment(new Date(parseInt(userMintInfo.maturityTs) * 1000)).format('YYYY/MM/DD HH:mm:ss')}, Mint Reward: ${mintReward} XEN`}>
                  <Button colorScheme='teal' variant='outline' onClick={claimMintReward}>Claim Mint Reward</Button>
                </Tooltip>)
            }
            
          </HStack>
          <Tooltip label={`When you burn your XEN, you will get an NFT which could be deposited in dividend pool to share dividend with others.`}>
            <Button colorScheme='teal' variant='outline' onClick={burnPopover.onOpen}>Burn To Earn</Button>
          </Tooltip>
        </HStack>
      </Heading>
      <HStack spacing='18px' marginBottom='10px'>
        <div>Recent Mint Info (include yours and others):</div>       
      </HStack>
      {mintInfoList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th>Address</Th>
                  <Th>Rank</Th>
                  <Th>Term</Th>
                </Tr>
              </Thead>
              <Tbody>
                {mintInfoList?.map((mintInfo, key) => (
                  <Tr key={`${mintInfo.user}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer">                    
                    <Td>{mintInfo.user}</Td>                
                    <Td>{mintInfo.rank}</Td>            
                    <Td>{mintInfo.term}</Td>  
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks like there is no rank minted after you get here.</Box>
      )}
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mint XEN</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Term of Mint</FormLabel>
              <InputGroup>
                <Input onChange={handleTermOfMint} />
                <InputRightAddon children='Days' />
              </InputGroup>
              <FormLabel>{new BigNumber(mintFee).shiftedBy(-18).toString()} ETH / Mint</FormLabel>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={claimRank} isLoading={isMinting} loadingText='Minting'>
              Mint
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
        isOpen={burnPopover.isOpen}
        onClose={burnPopover.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Burn XEN</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>XEN number to be burned</FormLabel>
              <InputGroup>
                <Input onChange={handleBurnedNumber} />
                <InputRightAddon children='XEN' />
              </InputGroup>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            {
              new BigNumber(allowance).gte(new BigNumber(numberOfBurned).shiftedBy(18)) ?
               null
               :
               <Button colorScheme='blue' mr={3} onClick={approve} isLoading={isApproving} loadingText='Approving'>
                 Approve
               </Button>
            }
            <Button colorScheme='blue' mr={3} onClick={burnXEN} isLoading={isBurning} loadingText='Burning'>
              Burn
            </Button>
            <Button onClick={burnPopover.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default XProxy;
