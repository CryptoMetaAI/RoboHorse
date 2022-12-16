import {
  Button,
  Heading,
  Box,
  Tooltip,
  HStack,
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
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import FansNFT from 'abi/fansNFT.json';
import Erc721 from 'abi/erc721.json';
import { useWeb3React } from "@web3-react/core";
import { useRouter } from 'next/router';
import { utils } from 'ethers';
import { isEmptyObj } from 'utils/utils';
import { ScriptCard } from 'components/modules';
import { getImageInfo } from 'utils/resolveIPFS';

const ScriptList: FC = () => {
  const { account, library: web3 } = useWeb3React();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [scriptList, setScriptList] =useState<any[]>([]);
  const [scriptName, setScriptName] =useState<string>('');
  const [scriptDesc, setScriptDesc] =useState<string>('');

  const [fansNFT, setFansNFT] = useState<any>(null);
  const [nft721, setNft721] = useState<any>(null);
  const [kolNFTList, setKOLNFTList] =useState<any[]>([]);
  const [tokenId, setTokenId] =useState<number>(0);
  const [twitterId, setTwitterId] =useState<string>('');
  const [days, setDays] =useState<number>(30);
  const [maxFansNumber, setMaxFansNumber] =useState<number>(1000);
  const [symbolOfFansNFT, setSymbolOfFansNFT] = useState<string>('');

  const [isIssuing, setIsIssuing] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isTokenIdInvalid, setIsTokenIdInvalid] = useState<boolean>(false);

  const initialRef = React.useRef(null)
  const lsName = 'scriptList';

  useEffect(() => {
    var scriptsInfo = global.localStorage.getItem(lsName);
    if (isEmptyObj(scriptsInfo)) {
      scriptsInfo = '{}';
    }
    var tmpList = Object.entries(JSON.parse(scriptsInfo as string)).map(entry => entry[1]);
    tmpList = tmpList.sort((a: any, b: any) => b.createdTime - a.createdTime);
    setScriptList(tmpList);
  }, []);


  useEffect(() => {
      console.log(router.query);
      const { fansnftaddress, symbol } = router.query;
      setSymbolOfFansNFT(symbol as string);
      if (web3 != null && utils.isAddress(fansnftaddress as string)) {
          setFansNFT(new web3.eth.Contract(FansNFT, fansnftaddress));
      }
  }, [web3]);

  useEffect(() => {
      if (fansNFT != null) {
          getKOLNFTList();
      }
  }, [fansNFT]);

  const getKOLNFTList = () => {     
      const nftList: any[] = []; 
      fansNFT.methods['nft']().call({from: account}).then((nftAddress: string) => {
          const nftContract = new web3.eth.Contract(Erc721, nftAddress);
          setNft721(nftContract);
          fansNFT.methods['slotId']().call({from: account}).then((slotId: number) => {
              for (let i = 1; i < slotId; i++) {
                  fansNFT.methods['slotInfoMap'](i).call({from: account}).then((slotInfo: any) => {
                      nftContract.methods["tokenURI"](slotInfo.nft721Id).call({from: account}).then((tokenURI: string) => {
                          getImageInfo(tokenURI).then((imageInfo: string) => {
                            slotInfo.slotId = i;
                            slotInfo.image = imageInfo;
                            nftContract.methods["symbol"]().call({from: account}).then((symbol: string) => {
                                slotInfo.symbol = symbol;
                                
                                nftList.push(slotInfo);
                                if (nftList.length - (slotId - 1) === 0) {
                                    console.log(nftList);
                                    setKOLNFTList(nftList);
                                }
                            })
                          })
                      })
                  });
              }
          });
      });
    }

  const issue = () => {
    if (!isApproved) {
      toast({
        title: 'Warning',
        description: "Please approve the NFT firstly",
        status: 'warning',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    const endTime = days * 3600 * 24 + Date.parse(new Date().toString()) / 1000;
    const contractFunc = fansNFT.methods['deposit721NFT']; 
    const data = contractFunc(tokenId, endTime, maxFansNumber, twitterId).encodeABI();
    console.log(data);
    const tx = {
        from: account,
        to: fansNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, endTime, maxFansNumber, twitterId).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsIssuing(true);
          })
          .on('receipt', () => {
            setIsIssuing(false);
            getKOLNFTList();
            onClose();
          })
          .on('error', () => {
            setIsIssuing(false);
            toast({
              title: 'Failed',
              description: "Issue NFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    }).catch((err: any) => {
      toast({
        title: 'Failed',
        description: "Issue NFT failed: " + fansNFT._address + err,
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
    });
  }

  const approve = () => {
    const contractFunc = nft721.methods['approve'];
    const data = contractFunc(fansNFT._address, tokenId).encodeABI();
    const tx = {
        from: account,
        to: nft721._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(fansNFT._address, tokenId).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsApproving(true);
          })
          .on('receipt', () => {
            setIsApproving(false);
            setIsApproved(true);
          })
          .on('error', () => {
            setIsApproving(false);
            toast({
              title: 'Failed',
              description: "Approve NFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const checkYourNFT = () => {
    if (tokenId > 0) {
      let contractFunc = nft721.methods['ownerOf'];
      contractFunc(tokenId).call({from: account}).then((ownerAddress: string) => {
        console.log(ownerAddress);
        setIsOwner(ownerAddress.localeCompare(account as string, 'en', { sensitivity: 'base' }) === 0);
        setIsTokenIdInvalid(false);
        contractFunc = nft721.methods['getApproved'];
        contractFunc(tokenId).call({from: account}).then((address: string) => {
          console.log(address);
          setIsApproved(address.localeCompare(fansNFT._address, 'en', { sensitivity: 'base' }) === 0);
        }).catch((e: any) => {
          setIsApproved(false);
          setIsTokenIdInvalid(true);
        })
      }).catch((e: any) => {
        setIsOwner(false);
        setIsTokenIdInvalid(true);
      })        
    }
  }

  const addScript = () => {
    const index = scriptList.findIndex((item: any) => item.name === scriptName);
    if (index > -1) {
      toast({
        title: 'Failed',
        description: "Script name is duplicate.",
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    scriptList.push({name: scriptName, desc: scriptDesc, createdTime: new Date().getTime()});
    scriptList.sort((a: any, b: any) => b.createdTime - a.createdTime);
    setScriptList(JSON.parse(JSON.stringify(scriptList)));
    global.localStorage.setItem(lsName, JSON.stringify(setScriptList));
    onClose();
  }

  useEffect(() => {
    if (nft721 != null) {
      checkYourNFT();
    }
  }, [tokenId]);

  return (
      <>
        <Heading size="lg" marginBottom={6}>
          <HStack justifyContent='space-between'>
              <div />
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Add Script</Button>
          </HStack>
        </Heading>
        {scriptList?.length ? (
          <SimpleGrid  columns={3} spacing={10}>
          {scriptList.map((scriptInfo, key) => (
              <ScriptCard {...scriptInfo}/>
          ))}
          </SimpleGrid>
      ) : (
          <Box>Oooooops...there is no script belonged to you, LFG!</Box>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Script</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input onChange={(e) => setScriptName(e.target.value)} value={scriptName}/>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input onChange={(e) => setScriptDesc(e.target.value)} value={scriptDesc}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>            
            <Button colorScheme='blue' mr={3} onClick={addScript}>
              Confirm
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </>
    );
}

export default ScriptList;

