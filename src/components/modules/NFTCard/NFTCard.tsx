import { 
  Box, HStack, Image, SimpleGrid, useColorModeValue, Tooltip, Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper, 
  useDisclosure,
  useToast,
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
  Radio, RadioGroup,
  Checkbox
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { Eth } from '@web3uikit/icons';
import React, { FC, useEffect, useState} from 'react';
import { getEllipsisTxt } from 'utils/format';
import { MergeType } from 'utils/config';
import moment from 'moment';
import copy from 'copy-to-clipboard';


type XNFTInfo = {
  account: string;
  web3: any;
  xNFT: any;
  chainId: number;
  tokenId: number;
  owner: string;
  attributes: any[];
  description: string;
  image: string;
  name: string;
  setMergeInfo: (type: MergeType, tokenId: number, share: number) => void;
  refresh: (tokenId?: number) => void;
}

const NFTCard: FC<XNFTInfo> = ({ account, web3, xNFT, tokenId, owner, attributes, description, name, image, setMergeInfo, refresh }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');

  const modal1 = useDisclosure();
  const modal2 = useDisclosure();

  const [share, setShare] = useState<number>(0);
  const [proxyContract, setProxyContract] = useState<string>('');
  const [reward, setReward] = useState<number>(0);
  const [shareWithdrawed, setShareWithdrawed] = useState<string>('');
  const [rewardClaimed, setRewardClaimed] = useState<string>('');
  const [term, setTerm] = useState<number>(0);
  const [maturityTs, setMaturityTs] = useState<string>('');
  const [rank, setRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpliting, setIsSpliting] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [isOutOfTime, setIsOutOfTime] = useState<boolean>(false);
  const [transferDirection, setTransferDirection] = useState<string>('0');
  const [shareOut, setShareOut] = useState<string>('1');
  const [mergeDisplay, setMergeDisplay] = useState<string>('none');

  const toast = useToast();
  const initialRef = React.useRef(null);
  let sharesInfo = '';
  let toAddr = '';

  useEffect(() => {
    attributes.forEach((attribute: any) => {
      if (attribute.trait_type === 'xProxy') {
        setProxyContract(attribute.value);
      }
      if (attribute.trait_type === 'share') {
        setShare(attribute.value);
      }
      if (attribute.trait_type === 'shareWithdrawed') {
        setShareWithdrawed(attribute.value);
      }
      if (attribute.trait_type === 'reward') {
        setReward(attribute.value);
      }
      if (attribute.trait_type === 'rewardClaimed') {
        setRewardClaimed(attribute.value);
      }
      if (attribute.trait_type === 'term') {
        setTerm(attribute.value);
      }
      if (attribute.trait_type === 'maturityTs') {
        setMaturityTs(attribute.value);
      }
      if (attribute.trait_type === 'rank') {
        setRank(attribute.value);
      }
      setIsOutOfTime(parseInt(maturityTs) * 1000 < new Date().getTime());
    })
  });

  useEffect(() => {
    if (transferDirection ==='1') {
      setMergeInfo(MergeType.FromAdd, tokenId, parseInt(shareOut));
    } else if (transferDirection ==='2') {
      setMergeInfo(MergeType.ToAdd, tokenId, 0);
    } else if (transferDirection ==='3') {
      setMergeInfo(MergeType.Clear, tokenId, 0);
    }
  }, [transferDirection, shareOut]);

  const withdrawReward = (tId: number) => {
    console.log(xNFT);
    const contractFunc = xNFT.methods['withdrawReward']; 
    const data = contractFunc([tId]).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc([tId]).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsLoading(true);
          })
          .on('receipt', () => {
            modal1.onClose();
            setIsLoading(false);
          })
          .on('error', () => {
            setIsLoading(false);
            toast({
              title: 'Failed',
              description: "Withdraw reward failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const splitXNFT = () => {
    const shares = sharesInfo.split(',').map((shareStr: string) =>  {
      try {
        return parseInt(shareStr);
      } catch (error) {
        toast({
          title: 'Warning',
          description: "Please input right numbers",
          status: 'warning',
          position: 'bottom-right',
          isClosable: true,
        });
      }
      return 0;
    });
    console.log(shares);
    const contractFunc = xNFT.methods['split']; 
    const data = contractFunc(tokenId, shares).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, shares).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsSpliting(true);
          })
          .on('receipt', () => {
            modal1.onClose();
            setIsSpliting(false);
            refresh();
          })
          .on('error', () => {
            setIsSpliting(false);
            toast({
              title: 'Failed',
              description: "Split xNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const transferXNFT = () => {
    console.log(account, toAddr, tokenId);
    const contractFunc = xNFT.methods['transferFrom(address,address,uint256)']; 
    const data = contractFunc(account, toAddr, tokenId).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(account, toAddr, tokenId).estimateGas({from: account}).then((gasLimit: any) => {
      tx.gasLimit = gasLimit;
      web3.eth.sendTransaction(tx)
          .on('transactionHash', () => {
            setIsTransferring(true);
          })
          .on('receipt', () => {
            modal2.onClose();
            setIsTransferring(false);
            refresh(tokenId);
          })
          .on('error', () => {
            setIsTransferring(false);
            toast({
              title: 'Failed',
              description: "Transfer xNFT failed",
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
    });
  }

  const handleSharesChange = (e: any) => {
    sharesInfo = e.target.value;    
  }

  const handleToAddrChange = (e: any) => {
    toAddr = e.target.value;    
  }

  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
      <Box maxHeight="260px" overflow={'hidden'} borderRadius="xl">
        <Image
          src={image}
          alt={'nft'}
          minH="260px"
          minW="260px"
          boxSize="100%"
          objectFit="fill"
        />
      </Box>
      <HStack alignItems={'center'} justify={"space-between"}>
        <Box mt="1" fontWeight="semibold" as="h4" noOfLines={1} marginTop={2}>
          {name}<Tooltip label={description}><QuestionOutlineIcon w={4} h={4} marginLeft='2px'/></Tooltip>
        </Box>
        <HStack alignItems={'center'}>
          <Eth fontSize="20px" />
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="smaller">
            ERC3525
          </Box>
        </HStack>
      </HStack>
      <Box width='100%'>
        <HStack alignItems={'center'}>
          <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
          <strong>owner:</strong>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">
            {owner}
          </Box>
        </HStack>
      </Box>
      <SimpleGrid columns={2} spacing={4} spacingX={0} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
         <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
                <strong>xProxy<Tooltip label={"Corresponding to Slot in the ERC3525 protocol"}><QuestionOutlineIcon w={3} h={3} marginLeft='2px'/></Tooltip>:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="sm" onClick={() => {
                copy(proxyContract);
                toast({
                  title: 'Success',
                  description: "Address has been copied",
                  status: 'success',
                  position: 'bottom-right',
                  isClosable: true,
                })
              }}>
                <Tooltip label={`${proxyContract}, click to copy`}>
                {getEllipsisTxt(proxyContract || '')}
                </Tooltip>
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>share:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {share}
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>reward:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {reward}
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>rewardClaimed:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {rewardClaimed}
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>shareWithdrawed:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {shareWithdrawed}
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>term:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {term}
              </Box>
            </HStack>
          </Box>
          <Box width='100%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>rank:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {rank}
              </Box>
            </HStack>
          </Box>
          <Box width='120%'>
            <HStack alignItems={'center'}>
              <Box as="h4" noOfLines={1} fontWeight="medium" fontSize="sm">
              <strong>maturityTs:</strong>
              </Box>
              <Box as="h4" noOfLines={1} fontSize="small">
                {moment(new Date(parseInt(maturityTs) * 1000)).format('YYYY/MM/DD HH:mm:ss')}
              </Box>
            </HStack>
          </Box>
      </SimpleGrid>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
        <Box>
          <HStack alignItems={'center'} justify='space-between'>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner || isOutOfTime} onClick={modal1.onOpen}>Split</Button>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal2.onOpen}>Transfer</Button>
            <Button colorScheme='teal' variant='outline' disabled={!isOutOfTime || shareWithdrawed === 'yes'} 
                    onClick={() => withdrawReward(tokenId)} isLoading={isLoading} loadingText='Withdrawing'>Withdraw</Button>
          </HStack>
          <Checkbox marginTop='2' isDisabled={isOutOfTime} colorScheme='teal' onChange={(e) => setMergeDisplay(e.target.checked ? 'block' : 'none')}>Open Merge</Checkbox>
        </Box>
      </SimpleGrid>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2} display={mergeDisplay}>
        <Box>
          <RadioGroup onChange={setTransferDirection} value={transferDirection}>
            <HStack alignItems={'center'} justify='space-around'>
              <Radio value='1' isDisabled={account !== owner || isOutOfTime} colorScheme='teal'>Transfer out of share</Radio>
              <Radio value='2' isDisabled={isOutOfTime} colorScheme='teal'>Transfer to share</Radio>
              <Radio value='3' isDisabled={isOutOfTime} colorScheme='teal'>Not Transfer</Radio>
            </HStack>
          </RadioGroup>
        </Box>
        <Box>
          <HStack alignItems={'center'} justify='flex-start'>
            <strong>Out Share:</strong>
            <NumberInput min={1} max={share} isDisabled={account !== owner || isOutOfTime || transferDirection !== '1'} onChange={setShareOut} value={shareOut}>
              <NumberInputField placeholder='share of transfer out'/>
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
        </Box>
      </SimpleGrid>
    </Box>
    <Modal
        initialFocusRef={initialRef}
        isOpen={modal1.isOpen}
        onClose={modal1.onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Split xNFT [total share={share}]</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Shares</FormLabel>
              <Input ref={initialRef} onChange={handleSharesChange} placeholder='eg: 100,500,1000'/>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => splitXNFT()} isLoading={isSpliting} loadingText='Spliting'>
              Split
            </Button>
            <Button onClick={modal1.onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
          isOpen={modal2.isOpen}
          onClose={modal2.onClose}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Transfer xNFT</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl>
                <FormLabel>To Address</FormLabel>
                <Input onChange={handleToAddrChange}/>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={() => transferXNFT()} isLoading={isTransferring} loadingText='Transferring'>
                Transfer
              </Button>
              <Button onClick={modal2.onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </>
  );
};

export default NFTCard;
