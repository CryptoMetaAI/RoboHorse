import { Box, SimpleGrid, Heading, useDisclosure, HStack, Button,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
  Select,
  useToast,
  Tooltip,
  Checkbox,
  Icon
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';
import { AiOutlineFilter } from "react-icons/ai";
import { NFTCard } from 'components/modules';
import React, { FC, useEffect, useState } from 'react';
import XNFT from 'abi/dNFT.json';
import DPoolABI from 'abi/dPool.json';
import {xNFTAddr, MergeType, dPoolAddr} from 'utils/config';
import * as utils from 'utils/utils';

type Web3Info = {
  account: string;
  web3: any;
  chainId: number;
}

const DPool: FC<Web3Info> = ({ account, web3, chainId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const modal1 = useDisclosure();

  const [dPoolList, setDPoolList] = useState<any[]>([]);
  const [xNFT, setXNFT] =useState<any>(null);
  const [dPool, setDPool] =useState<any>(null);
  const [robotAddress, setRobotAddress] = useState<string>('');
  const [tmpRobotAddress, setTmpRobotAddress] = useState<string>('');
  const [bMineNFT, setBMineNFT] = useState<boolean>(false);
  const [dPoolNumber, setDPoolNumber] = useState<number>(0);
  const [tokensInSlot, setTokensInSlot] = useState<number[]>([]);
  const [myTokens, setMyTokens] = useState<number[]>([]);
  const [finalTokens, setFinalTokens] = useState<number[]>([]);
  const [toTokenId, setToTokenId] = useState<string>('0');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [transferValueFromInfo, setTransferValueFromInfo] = useState<any>({});
  const [transferValueToTokenId, setTransferValueToTokenId] = useState<any>({});
  const [outShareInfo, setOutShareInfo] = useState<string>('');
  const [curPage, setCurPage] = useState<number>(0);
  const [pageSize] = useState<number>(9);

  const toast = useToast();

  useEffect(() => {
    if (web3 != null) {
      setXNFT(new web3.eth.Contract(XNFT, xNFTAddr[chainId]));
      setDPool(new web3.eth.Contract(DPool, dPoolAddr[chainId]));
    }
  }, [web3])

  useEffect(() => {
    if (dPool != null) {      
      getTotalPoolNumber();
    }
  }, [dPool])


  const getTotalPoolNumber = () => {
    const contractFunc = dPool.methods['poolLength'];
    contractFunc().call({from: account}).then((result: number) => {
      setDPoolNumber(parseInt(result.toString()));
    });
  }

  const mergeXNFTValue = () => {
    const tokenIds: number[] = [];
    const shares: number[] = [];
    console.log(toTokenId);
    Object.entries(transferValueFromInfo).forEach((entry: any) => {
      tokenIds.push(entry[0]);
      shares.push(entry[1]);
    })
    const contractFunc = xNFT.methods['merge']; 
    const data = contractFunc(tokenIds, shares, parseInt(toTokenId)).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenIds, shares, parseInt(toTokenId)).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsMerging(true);
          })
          .on('receipt', () => {
            onClose();
            setIsMerging(false);
            refresh(0);
          })
          .on('error', () => {
            setIsMerging(false);
            toast({
              title: 'Failed',
              description: "Merge xNFT's share failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const refresh = (tokenId?: number) => {
    if (tokenId === 0 || tokenId === undefined) {
      getTotalSupply();
    } else {
      let contractFunc = xNFT.methods['tokenURI'];
      contractFunc(tokenId).call({from: account}).then((tokenURI: string) => {
        const xNFTObj = JSON.parse(atob(tokenURI.substr('data:application/json;base64,'.length)));
        contractFunc = xNFT.methods['ownerOf'];
        contractFunc(tokenId).call({from: account}).then((owner: string) => {          
          xNFTObj.tokenId = tokenId;
          xNFTObj.owner = owner;
          const updatedXNFTs = dPoolList.map((nft: any) => {
            if (nft.tokenId === tokenId) {
              return xNFTObj;
            }
            return nft;
          });
          setDPoolList(updatedXNFTs);
        });
      });
    }
  }

  const setMergeInfo = (type: MergeType, tokenId: number, share: number) => {
      console.log(type, tokenId, share);
      switch ( type ) {
        case MergeType.FromAdd:
          transferValueFromInfo[tokenId] = share;
          delete transferValueToTokenId[tokenId];
          break;
        case MergeType.FromRemove:
          delete transferValueFromInfo[tokenId];
          break;
        case MergeType.FromModify:
          break;
        case MergeType.ToAdd:
          transferValueToTokenId[tokenId] = 1;
          delete transferValueFromInfo[tokenId];
          break;
        case MergeType.ToRemove:
          delete transferValueToTokenId[tokenId];
          break;
        case MergeType.Clear:
          delete transferValueFromInfo[tokenId];
          delete transferValueToTokenId[tokenId];
          break;
        default: 
            // 
          break;
      }
      console.log(transferValueFromInfo, transferValueToTokenId);
      setTransferValueFromInfo(JSON.parse(JSON.stringify(transferValueFromInfo)));
      setTransferValueToTokenId(JSON.parse(JSON.stringify(transferValueToTokenId)));
  }

  const getTransferValueFromInfo = () => {
    let shareInfo: string = '';
    Object.entries(transferValueFromInfo).forEach((entry: any) => {
      shareInfo += `{xNFT #${entry[0]}: ${entry[1]}}`;
    })
    return shareInfo;
  }

  const openMergeModal = () => {
    if (Object.entries(transferValueFromInfo).length === 0 || Object.entries(transferValueToTokenId).length === 0) {
      toast({
        title: 'Warning',
        description: "You should select the out and to xNFT for transferring share.",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    setOutShareInfo(getTransferValueFromInfo()); 
    setToTokenId(Object.entries(transferValueToTokenId)[0]?.[0]);
    onOpen();
  }

  // AiOutlineFilter
  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent='space-between'>
          <HStack spacing='18px'>
            <div>Dividend Pool List</div>       
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
              <Button colorScheme='teal' variant='outline' onClick={() => setCurPage((curPage + 1) * pageSize >= dPoolNumber ? curPage : curPage + 1)}><ArrowRightIcon /></Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Heading>
      {dPoolList?.length ? (
        <SimpleGrid  columns={3} spacing={10}>
          {dPoolList.map((xNFTObj, key) => (
            <NFTCard {...xNFTObj} key={key} account={account} web3={web3} xNFT={xNFT} dPool={dPool} setMergeInfo={setMergeInfo} refresh={refresh}/>
          ))}
        </SimpleGrid>
      ) : (
        <Box>Looks Like there are no xNFTs</Box>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Merge xNFT Value</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Out Shares Information</FormLabel>
              <Input disabled value={outShareInfo}/>
            </FormControl>
            <FormControl>
              <FormLabel>To xNFT's TokenID</FormLabel>
              <Select onChange={(e) => setToTokenId(e.target.value)} value={toTokenId}>
                {
                  Object.entries(transferValueToTokenId).map((entry: any) =>
                    <option value={entry[0]}>tokenId = {entry[0]}</option>
                  )
                }
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => mergeXNFTValue()} isLoading={isMerging} loadingText='Merging'>
              Merge
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={modal1.isOpen}
        onClose={modal1.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filter xProxy</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Address of xProxy</FormLabel>
              <Input value={tmpRobotAddress} onChange={(e) => setTmpRobotAddress(e.target.value)}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='red' mr={3} onClick={() => {setRobotAddress(''); setTmpRobotAddress(''); modal1.onClose(); }}>
              Clear
            </Button>
            <Button colorScheme='blue' mr={3} onClick={() => {setRobotAddress(tmpRobotAddress); modal1.onClose(); }}>
              Confirm
            </Button>
            <Button onClick={modal1.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DPool;
