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
import { MergeType } from 'utils/config';


type XNFTInfo = {
  account: string;
  web3: any;
  xNFT: any;
  dPool: any;
  chainId: number;
  poolIndex: number;
}

const NFTCard: FC<XNFTInfo> = ({ account, web3, xNFT, dPool, poolIndex }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');

  const modal1 = useDisclosure();
  const modal2 = useDisclosure();

  const [share, setShare] = useState<number>(0);
  const [maturityTs, setMaturityTs] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
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
    let contractFunc = xNFT.methods['isApprovedForAll'];
    contractFunc(account, dPool._address).call({from: account}).then((isApproved: boolean) => {
      if (isApproved) {
        depositDNFT();
      } else {
        approveForAll();
      }
    })
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
      
      <HStack alignItems={'center'} justify={"space-between"}>
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
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal1.onOpen}>Split</Button>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} onClick={modal2.onOpen}>Transfer</Button>
            <Button colorScheme='teal' variant='outline' disabled={account !== owner} 
                    onClick={() => deposit(tokenId)} isLoading={isApproving || isDepositing} loadingText={isApproving ? 'Approving' : 'Depositing'}>Deposit</Button>
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
