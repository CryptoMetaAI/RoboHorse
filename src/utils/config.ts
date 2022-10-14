const xenAddr: Record<number, string> = {1: '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8', 56: 'BNB', 97: '0xa525366969F79b223a5d16900e8F0754c64C3EDa', 137: 'Polygon'}
const xNFTAddr: Record<number, string> = {1: '', 56: '', 97: '0x77dfB189A25514b4087D499fe9BCaaDABD87b5D4', 137: ''}
const rewardCalculatorAddr: Record<number, string> = {1: '', 56: '', 97: '0x650024868692eD29c2b6dFC87ffEaE12eD3a91F9', 513100: '', 137: ''}
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