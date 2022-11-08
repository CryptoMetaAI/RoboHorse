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
  Checkbox,
} from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons'
import { Eth } from '@web3uikit/icons';
import React, { FC, useEffect, useState} from 'react';
import { MergeType } from 'utils/config';
import BigNumber from 'bignumber.js';


type XNFTInfo = {
  account: string;
  web3: any;
  xNFT: any;
  dPool: any;
  chainId: number;
  tokenId: number;
  owner: string;
  attributes: any[];
  description: string;
  image: string;
  name: string;
  setMergeInfo: (type: MergeType, tokenId: number, burnedXEN: number) => void;
  refresh: (tokenId?: number) => void;
}

const NFTCard: FC<XNFTInfo> = ({ account, web3, xNFT, dPool, tokenId, owner, description, name, image, attributes, setMergeInfo, refresh }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');

  const modal1 = useDisclosure();
  const modal2 = useDisclosure();

  const [burnedXEN, setBurnedXEN] = useState<number>(0);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isSpliting, setIsSpliting] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferDirection, setTransferDirection] = useState<string>('0');
  const [shareOut, setShareOut] = useState<string>('1');
  const [mergeDisplay, setMergeDisplay] = useState<string>('none');

  const toast = useToast();
  const initialRef = React.useRef(null);
  let sharesInfo = '';
  let toAddr = '';

  useEffect(() => {
    attributes.forEach((attribute: any) => {
      if (attribute.trait_type === 'Burned XEN') {
        setBurnedXEN(parseInt(attribute.value));
      }
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

  const deposit = (tId: number) => {
    console.log(tId);
    const depositDNFT = () => {
      const contractFunc = dPool.methods['deposit']; 
      const data = contractFunc([tId]).encodeABI();
      const tx = {
          from: account,
          to: dPool._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc([tId]).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsDepositing(true);
            })
            .on('receipt', () => {
              modal1.onClose();
              setIsDepositing(false);
              refresh(tId);
            })
            .on('error', () => {
              setIsDepositing(false);
              toast({
                title: 'Failed',
                description: "Deposit DNFT failed",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    }

    const approveForAll = () => {
      const contractFunc = xNFT.methods['setApprovalForAll'];
      const data = contractFunc(dPool._address, true).encodeABI();
      const tx = {
          from: account,
          to: xNFT._address,
          data,
          value: 0,
          gasLimit: 0
      }
      contractFunc(dPool._address, true).estimateGas({from: account}).then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth.sendTransaction(tx)
            .on('transactionHash', () => {
              setIsApproving(true);
            })
            .on('receipt', () => {
              setIsApproving(false);
              depositDNFT();
            })
            .on('error', () => {
              setIsApproving(false);
              toast({
                title: 'Failed',
                description: "Approve DNFT failed",
                status: 'error',
                position: 'bottom-right',
                isClosable: true,
              });
            });
      });
    }
    const contractFunc = xNFT.methods['isApprovedForAll'];
    contractFunc(account, dPool._address).call({from: account}).then((isApproved: boolean) => {
      if (isApproved) {
        depositDNFT();
      } else {
        approveForAll();
      }
    })
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
    const normalShares = shares.map((share: number) => `0x${new BigNumber(share).shiftedBy(18).toString(16)}`);
    const contractFunc = xNFT.methods['split']; 
    const data = contractFunc(tokenId, normalShares).encodeABI();
    const tx = {
        from: account,
        to: xNFT._address,
        data,
        value: 0,
        gasLimit: 0
    }
    contractFunc(tokenId, normalShares).estimateGas({from: account}).then((gasLimit: any) => {
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
              description: "Split DNFT failed",
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
              description: "Transfer DNFT failed",
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
      <HStack alignItems={'center'} justify={"center"}>
        <Image
          src={image}
          alt={'DNFT'}          
          boxSize="300px"
          objectFit="fill"
        />
      </HStack>
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
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2}>
        <Box>
          <HStack alignItems={'center'} justify='space-between'>
            <Tooltip label={`DNFT could be split into smaller ones which have the number of burned XEN.`}>
              <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal1.onOpen}>Split</Button>
            </Tooltip>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal2.onOpen}>Transfer</Button>
            <Tooltip label={`Deposit this DNFT into divident pool to earn ETH`}>
              <Button colorScheme='teal' variant='outline' disabled={account !== owner} 
                      onClick={() => deposit(tokenId)} isLoading={isApproving || isDepositing} loadingText={isApproving ? 'Approving' : 'Depositing'}>Deposit</Button>
            </Tooltip>
          </HStack>
          <Checkbox marginTop='2' colorScheme='teal' onChange={(e) => setMergeDisplay(e.target.checked ? 'block' : 'none')}>Merge Value of Burned XEN in DNFT</Checkbox>
        </Box>
      </SimpleGrid>
      <SimpleGrid columns={1} spacing={4} bgColor={descBgColor} padding={2.5} borderRadius="xl" marginTop={2} display={mergeDisplay}>
        <Box>
          <RadioGroup onChange={setTransferDirection} value={transferDirection}>
            <HStack alignItems={'center'} justify='space-around'>
              <Radio value='1' isDisabled={account !== owner} colorScheme='teal'>Transfer out</Radio>
              <Radio value='2' colorScheme='teal'>Transfer in</Radio>
              <Radio value='3' colorScheme='teal'>Not Transfer</Radio>
            </HStack>
          </RadioGroup>
        </Box>
        <Box display={transferDirection === '1' ? 'block' : 'none'} marginTop={'10px'}>
          <HStack alignItems={'center'} justify='flex-start'>
            <strong>Value:</strong>
            <NumberInput min={1} max={burnedXEN} isDisabled={account !== owner || transferDirection !== '1'} onChange={setShareOut} value={shareOut}>
              <NumberInputField placeholder='value to transfer out'/>
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
          <ModalHeader>Split DNFT [total burned XEN = {burnedXEN}]</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>XENs</FormLabel>
              <Input ref={initialRef} onChange={handleSharesChange} placeholder='eg: 100,500,1000 (unit is XEN)'/>
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
