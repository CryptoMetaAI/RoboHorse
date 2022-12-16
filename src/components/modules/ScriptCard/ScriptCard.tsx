import { 
  Box, HStack, VStack, Image, SimpleGrid, useColorModeValue, Tooltip, Button,
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
  Avatar,
} from '@chakra-ui/react';
import { TbDeviceHeartMonitor } from 'react-icons/tb';
import { MdOutlineDescription } from 'react-icons/md';
import { SiBlockchaindotcom } from 'react-icons/si';
import { BiPencil } from 'react-icons/bi';
import { VscDebugStart, VscDebugStop, VscDebugPause, VscDebugRestart } from 'react-icons/vsc';
import React, { FC, useEffect, useState} from 'react';
import { useWeb3React } from "@web3-react/core";
import { useRouter } from 'next/router';
import { isEmptyObj, getSpanTime } from 'utils/utils';
import { ETHLogo, BSCLogo, AvaxLogo, PolygonLogo, ArbitrumLogo, OptimismLogo } from 'utils/chainLogos';

type ScriptInfo = {
  name: string;
  desc: string;
  createdTime: number;
  scriptObj: any;
}

enum ScriptStatus {
  Idle = 1,
  Running,
  Pause
}

const ScriptCard: FC<ScriptInfo> = ({ name, desc, createdTime, scriptObj }) => {
  const bgColor = useColorModeValue('none', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descBgColor = useColorModeValue('gray.100', 'gray.600');
  const linkActiveColor = useColorModeValue('gray.200', 'gray.600');

  const { account, library: web3 } = useWeb3React();
  let num = 0;
  let chainIdList: number[] = [];
  if (!isEmptyObj(scriptObj)) {
    const entries = Object.entries(scriptObj.subScripts);
    num = entries.length;
    const chainIds: any = {};
    entries.map((entry: any) => {
      const subScript = entry[1];
      const chainId = subScript.chain;
      if (isEmptyObj(chainIds[chainId])) {
        chainIds[chainId] = true;
      }
    })
    chainIdList = Object.keys(chainIds).map((chainId: string) => parseInt(chainId));
  }

  const [subScriptNum, setSubScriptNum] = useState<number>(num);
  const [chainList, setChainList] = useState<number[]>(chainIdList);
  const [curStatus, setCurStatus] = useState<ScriptStatus>(ScriptStatus.Idle);

  const modal1 = useDisclosure();
  const chainLogo: Record<number, any> = {1: <ETHLogo />, 5: <ETHLogo />, 10: <OptimismLogo />, 97: <BSCLogo />, 
                     42161: <ArbitrumLogo />, 42170: <ArbitrumLogo />, 43114: <AvaxLogo />, 
                     80001: <PolygonLogo />}

  useEffect(() => {
    
  });

  const getScriptStatusButton = () => {
    switch(curStatus) {
      case ScriptStatus.Idle:
        return <Tooltip label={"run this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStart />}
                  onClick={() => setCurStatus(ScriptStatus.Running)}/>
              </Tooltip>
        break;
      case ScriptStatus.Running:
        return <>
              <Tooltip label={"pause this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugPause />}
                  onClick={() => setCurStatus(ScriptStatus.Pause)}/>
              </Tooltip>
              <Tooltip label={"stop this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStop />}
                  onClick={() => setCurStatus(ScriptStatus.Idle)}/>
              </Tooltip>
          </>
        break;
      case ScriptStatus.Pause:
        return <>
              <Tooltip label={"restart this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugRestart />}
                  onClick={() => setCurStatus(ScriptStatus.Running)}/>
              </Tooltip>
              <Tooltip label={"stop this script"}>
                <Button 
                  size='xs'
                  colorScheme='yellow' 
                  variant='outline' 
                  leftIcon={<VscDebugStop />}
                  onClick={() => setCurStatus(ScriptStatus.Idle)}/>
              </Tooltip>
          </>
        break;
    }
  }

  const getChainLogoList = () => {
    return chainList.map((chainId: number) => {
      const logo = chainLogo[chainId];
      if (isEmptyObj(logo)) {
        return <ETHLogo />;
      }
      return logo;
    });
  }

  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [isComfirming, setIsComfirming] = useState<boolean>(false);
  const [totalSupplyInSlot, setTotalSupplyInSlot] = useState<number>(0);
  const [leftDays, setLeftDays] = useState<number>(0);
  const [days, setDays] =useState<number>(0);

  const toast = useToast();
  const initialRef = React.useRef(null);

  /*
  子脚本数量，体现复杂度
  涉及的链
  执行/暂停/继续/停止
  查看运行日志
  ES上传/修改/删除脚本：是否分享，分享条件，是否加密
  创建/更新时间
  */
  return (
    <>
    <Box bgColor={bgColor} padding={3} borderRadius="xl" borderWidth="1px" 
         borderColor={borderColor} onClick={() => {}} cursor="pointer"
         _hover={{
          textDecoration: 'none',
          borderColor: linkActiveColor,
        }}>
      <HStack alignItems={'center'} justify={"flex-start"}>
        <Avatar 
          name={name}
          opacity="0.8" 
          size='lg'>
        </Avatar>
        <VStack align='stretch'>
          <Box fontWeight="semibold" as="h4" noOfLines={1}>
            {name}
            <Tooltip label={"modify script name/description"}>
              <Button 
                ml={1}
                cursor="point"
                size={2}
                colorScheme='blue' 
                variant='outline' 
                leftIcon={<BiPencil />}/>
            </Tooltip>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">   
            <HStack>
              <Tooltip label={"number of subscripts"}>
                <Button 
                  size='xs'
                  colorScheme='twitter' 
                  variant='outline'
                  leftIcon={<MdOutlineDescription />}>
                  {subScriptNum}   
                </Button>
              </Tooltip>

              <Tooltip label={"save it on blockchain"}>
                <Button 
                  size='xs'
                  colorScheme='pink' 
                  variant='outline' 
                  leftIcon={<SiBlockchaindotcom />}>
                </Button>
              </Tooltip>
              {
                getScriptStatusButton()
              }
              <Tooltip label={"show the running log"}>
                <Button 
                  cursor="point"
                  size='xs'
                  colorScheme='blue' 
                  variant='outline' 
                  leftIcon={<TbDeviceHeartMonitor />}/>
              </Tooltip>
            </HStack>
          </Box>
          <Box as="h4" noOfLines={1} fontSize="sm">
            <HStack>
              { getChainLogoList() }
            </HStack>
          </Box>
        </VStack>
      </HStack>
      <HStack alignItems={'center'} justify={"center"} mt={5}>
        <Box fontWeight="semibold" as="h4" fontSize="sm" noOfLines={1}>
          {desc}
        </Box>
      </HStack>  
      <HStack alignItems={'center'} justify={"flex-end"} mt={5}>
        <Box fontWeight="semibold" as="h4" fontSize="sm" noOfLines={1}>
          {getSpanTime(createdTime / 1000)}
        </Box>
      </HStack> 
    </Box>
    <Modal
      initialFocusRef={initialRef}
      isOpen={modal1.isOpen}
      onClose={modal1.onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Extend End Time</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
            <FormControl>
              <FormLabel>How many days do you wanna extend?</FormLabel>
              <NumberInput step={1} defaultValue={0} min={1}>
                <NumberInputField onChange={(e) => setDays(parseInt(e.target.value))} value={days}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={() => {}} isLoading={isComfirming} loadingText='Comfirming'>
            Comfirm
          </Button>
          <Button onClick={modal1.onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
};

export default ScriptCard;
