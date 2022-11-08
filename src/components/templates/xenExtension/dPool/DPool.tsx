import { Box, SimpleGrid, Heading, HStack, Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
  Tooltip,
  Text
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon, RepeatIcon } from '@chakra-ui/icons';
import { DPoolCard } from 'components/modules';
import React, { FC, useEffect, useState } from 'react';
import DNFT from 'abi/dNFT.json';
import DPoolABI from 'abi/dPool.json';
import {xNFTAddr, dPoolAddr} from 'utils/config';

type Web3Info = {
  account: string;
  web3: any;
  chainId: number;
}

const DPool: FC<Web3Info> = ({ account, web3, chainId }) => {

  const [dPoolList, setDPoolList] = useState<any[]>([]);
  const [dNFT, setDNFT] =useState<any>(null);
  const [dPool, setDPool] =useState<any>(null);
  const [dPoolPeroid, setDPoolPeroid] = useState<number>(0);
  const [curPage, setCurPage] = useState<number>(0);
  const [pageSize] = useState<number>(9);


  useEffect(() => {
    if (web3 != null) {
      setDNFT(new web3.eth.Contract(DNFT, xNFTAddr[chainId]));
      setDPool(new web3.eth.Contract(DPoolABI, dPoolAddr[chainId]));
    }
  }, [web3])

  useEffect(() => {
    if (dPool != null) {            
      getAllPools();
    }
  }, [dPool])

  const getAllPools = () => {
    let contractFunc = dPool.methods['getCurrentPeriodIndex'];
    contractFunc().call({from: account}).then((result: number) => {
      console.log('current peroid', result);
      let peroid: number = parseInt(result.toString());
      if (peroid > 1000) {
        peroid = 1;
      } else {
        peroid += 1;
      }
      
      setDPoolPeroid(peroid);  
      const poolInfoList: any[] = [];
      contractFunc = dPool.methods['poolList'];
      for (let i = 0; i < peroid; i++) {
        contractFunc(i).call({from: account}).then((poolInfo: any) => {
          poolInfo.index = i;
          poolInfoList.push(poolInfo);
          console.log(poolInfo);
          if (poolInfoList.length == peroid) {
            setDPoolList(poolInfoList.filter((info: any) => info.endTime > 0 || info.index + 1 == peroid).sort((a: any, b: any) => b.index - a.index));
          }
        })
      }
    });
  }


  const refresh = () => {
    getAllPools();
  }


  // AiOutlineFilter
  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Current Pool: <Text fontSize='md' as='b' color='gray'>Period = {dPoolPeroid - 1}</Text></div>       
          </HStack>
          <Button colorScheme='teal' variant='outline' onClick={() => refresh()}><RepeatIcon /></Button>
        </HStack>
      </Heading>
      {dPoolList?.length ? (
        <SimpleGrid  columns={3} spacing={10}>
          {dPoolList.filter((info: any) => info.index + 1 == dPoolPeroid).map((poolInfo, key) => (
            <DPoolCard poolInfo={poolInfo} key={key} account={account} web3={web3} dNFT={dNFT} dPool={dPool} chainId={chainId}/>
          ))}
        </SimpleGrid>
      ) : (
        <Box>Looks Like there are no dividend pool</Box>
      )}
      <Heading size="lg" marginTop={10} marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>History Pools:</div>       
          </HStack>
          <HStack spacing='18px'>
            <Tooltip label={'Last Page'}>
              <Button colorScheme='teal' variant='outline' onClick={() => setCurPage(curPage > 0 ? curPage - 1 : 0)}><ArrowLeftIcon /></Button>
            </Tooltip>
            <NumberInput value={curPage} size='sm' maxW='100px' mr='2rem'>
              <NumberInputField />
              <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
            </NumberInput>
            <Tooltip label={'Next Page'}>
              <Button colorScheme='teal' variant='outline' onClick={() => setCurPage((curPage + 1) * pageSize >= dPoolPeroid ? curPage : curPage + 1)}><ArrowRightIcon /></Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {dPoolList?.length ? (
        <SimpleGrid  columns={3} spacing={10}>
          {dPoolList.filter((info: any) => info.index + 1 != dPoolPeroid).map((poolInfo, key) => (
            <DPoolCard poolInfo={poolInfo} key={key} account={account} web3={web3} dNFT={dNFT} dPool={dPool} chainId={chainId}/>
          ))}
        </SimpleGrid>
      ) : (
        <Box>Looks Like there are no dividend pool</Box>
      )}
    </>
  );
};

export default DPool;
