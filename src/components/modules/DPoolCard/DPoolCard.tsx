import { 
  Box, HStack, Text, SimpleGrid, useColorModeValue, Tooltip, Button,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import BigNumber from 'bignumber.js';
import { Icon } from '@chakra-ui/react';
import { SiExpertsexchange } from 'react-icons/si';
import { GoArrowRight } from 'react-icons/go';
import { Eth } from '@web3uikit/icons';
import React, { FC, useEffect, useState} from 'react';
import moment from 'moment';

type XNFTInfo = {
  account: string;
  web3: any;
  xNFT: any;
  dPool: any;
  chainId: number;
  poolInfo: any;
}

const NFTCard: FC<XNFTInfo> = ({ account, web3, dPool, poolInfo }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [pendingDividend, setPendingDividend] = useState<number>(0);
  const [curPoolInfo, setCurPoolInfo] = useState<any>(poolInfo);
  const [userInfo, setUserInfo] = useState<any>({});

  const toast = useToast();

  useEffect(() => {
    if (dPool != null) {     
      refresh(); 
    }
  }, [])
  
  const getPendingDividend = () => {
    const contractFunc = dPool.methods['pendingDividend'];
    contractFunc(poolInfo.index, account).call({from: account}).then((amount: number) => {
      setPendingDividend(amount);
    })
  }
  
  const getUserInfo = () => {
    const contractFunc = dPool.methods['userInfo'];
    contractFunc(poolInfo.index, account).call({from: account}).then((user: number) => {
      setUserInfo(user);
    })
  }

  const updatePoolInfo = () => {
    const contractFunc = dPool.methods['poolList'];
    contractFunc(poolInfo.index).call({from: account}).then((poolInfoObj: any) => {
      setCurPoolInfo(poolInfoObj);
      console.log(poolInfoObj);
    });
  }

  const refresh = () => {
    if (dPool != null) {     
      getPendingDividend(); 
      getUserInfo();
      updatePoolInfo(); 
    }
  }

  const claimDividend = () => {
    const contractFunc = dPool.methods['claimDividend']; 
    const data = contractFunc(poolInfo.index).encodeABI();
    const tx = {
        from: account,
        to: dPool._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(poolInfo.index).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsClaiming(true);
          })
          .on('receipt', () => {
            setIsClaiming(false);
            refresh();
          })
          .on('error', () => {
            setIsClaiming(false);
            toast({
              title: 'Failed',
              description: "Claim dividend failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }


    const redeemDNFT = () => {
      const contractFunc = dPool.methods['redeemAll']; 
      const data = contractFunc(poolInfo.index).encodeABI();
      const tx = {
          from: account,
          to: dPool._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(poolInfo.index).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsRedeeming(true);
            })
            .on('receipt', () => {
              setIsRedeeming(false);
              refresh();
            })
            .on('error', () => {
              setIsRedeeming(false);
              toast({
                title: 'Failed',
                description: "Redeem DNFT failed",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    }

  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
        <HStack alignItems={'center'} justify={"space-between"}>
          <HStack alignItems={'center'} justify={"space-between"}>
            <VStack>
              <Text fontSize='md' color='white'>Earn ETH</Text>
              <Text fontSize='sm' color='gray'>Burn XEN</Text>
            </VStack>
            <VStack>
              <Text fontSize='md' as='b' color='white'>{new BigNumber(poolInfo.accDividendPerShare).shiftedBy(-8).toFixed(2).toString()}</Text>
              <Text fontSize='sm' color='gray'>10000</Text>
            </VStack>
          </HStack>
          <VStack>
            <Text fontSize='md' as='b' color='white'>{poolInfo.index}</Text>
            <Text fontSize='sm' color='gray'>Peroid</Text>
          </VStack>
          <HStack alignItems={'center'} justify={"space-between"}>
            <Icon as={SiExpertsexchange} fontSize="30px" color='gray.400'/>
            <Icon as={GoArrowRight} fontSize="20px" color='gray.400'/>
            <Eth fontSize="40px"/>
          </HStack>
        </HStack>
      </SimpleGrid>
      <SimpleGrid columns={1} spacing={4} spacingX={0} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
         <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <Tooltip label={'Has Minted Out / Total Dividend'}><QuestionOutlineIcon w={3} h={3} marginRight='2px'/></Tooltip><strong>Dividend:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {new BigNumber(curPoolInfo.mintedOutDividend).shiftedBy(-18).toFixed(3)} / {new BigNumber(curPoolInfo.totalDividend).shiftedBy(-18).toFixed(3)} ETH
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <Tooltip label={'Your Burned / Total Burned'}><QuestionOutlineIcon w={3} h={3} marginRight='2px'/></Tooltip><strong>Burned:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
              {new BigNumber(userInfo.weight).shiftedBy(-18).toFixed(2)} / {new BigNumber(curPoolInfo.totalWeightOfNFT).shiftedBy(-18).toFixed(2)} XEN
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>Pending Dividend:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
              {new BigNumber(pendingDividend).shiftedBy(-18).toFixed(3)} ETH
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <Text fontSize='sm' as='b' color='white'>Dividend <Text fontSize='xs' as='b' color='gray'>/ Second</Text>:</Text>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
              {new BigNumber(curPoolInfo.dividendPerSecond).shiftedBy(-18).toFixed(6)} ETH
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <Text fontSize='sm' as='b' color='white'>End Time:</Text>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
              {parseInt(curPoolInfo.endTime) === 0 ? 'Not Started' : moment(new Date(parseInt(curPoolInfo.endTime) * 1000)).format('YYYY/MM/DD HH:mm:ss')}
              </Box>
            </HStack>
          </Box>
      </SimpleGrid>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
        <Box>
          <HStack alignItems={'center'} justify='space-between'>
            <Button colorScheme='teal' variant='outline' onClick={claimDividend} isLoading={isClaiming} loadingText={'Claiming'}>Claim Dividend</Button>
            <Button colorScheme='teal' variant='outline' onClick={redeemDNFT} isLoading={isRedeeming} loadingText={'Redeeming'}>Redeem DNFT</Button>
            <Button colorScheme='teal' variant='outline' onClick={refresh}>Refresh</Button>
          </HStack>
        </Box>
      </SimpleGrid>
    </Box>
    </>
  );
};

export default NFTCard;
