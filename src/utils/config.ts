const xenAddr: Record<number, string> = {1: '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8', 56: 'BNB', 97: '0x64AA3cc1348329F175ABE7f4b6F779Df4605C266', 137: 'Polygon'}
const xNFTAddr: Record<number, string> = {1: '', 56: 'BNB', 97: '0x650024868692eD29c2b6dFC87ffEaE12eD3a91F9', 137: 'Polygon'}
const rewardCalculatorAddr: Record<number, string> = {1: '', 56: 'BNB', 97: '0x5c73A8996F2B4390FEe9D1912e8f0070b0665D05', 513100: '', 137: 'Polygon'}
const chainId2NetworkName: Record<number, string> = {1: 'Ethereum', 56: 'BSC', 97: 'BSC-Testnet', 137: 'Polygon', 80001: 'Mumbai'}
const unit: Record<number, string> = {1: 'ETH', 56: 'BNB', 97: 'BNB', 137: 'MATIC', 80001: 'MATIC', 10001: 'ETHW', 513100: 'ETF'}

enum MergeType {
    FromAdd = 1,
    FromRemove,
    FromModify,
    ToAdd,
    ToRemove,
    Clear
  }

export {xenAddr, xNFTAddr, rewardCalculatorAddr, chainId2NetworkName, unit, MergeType}