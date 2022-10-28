const xenAddr: Record<number, string> = {1: '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8', 56: 'BNB', 97: '0x165632203a89aa9CFe19F0De343937dfcc9b399B', 137: 'Polygon'}
const xNFTAddr: Record<number, string> = {1: '', 56: '', 97: '0x5a77d81a902a5de7e3449944E6b8940D287a7D70', 137: ''}
const rewardCalculatorAddr: Record<number, string> = {1: '', 56: '', 97: '0x8E8D032040B64a4CE7bf9631338F1E7b8Ea9511f', 513100: '', 137: ''}
const dPoolAddr: Record<number, string> = {1: '', 56: '', 97: '0xbc1B3221a92ABEd9B92D6F6789950e30eF5D5cfb', 513100: '', 137: ''}
const chainId2NetworkName: Record<number, string> = {1: 'Ethereum', 56: 'BSC', 97: 'BSC-Testnet', 137: 'Polygon', 80001: 'Mumbai'}
const unit: Record<number, string> = {1: 'ETH', 56: 'BNB', 97: 'BNB', 137: 'MATIC', 80001: 'MATIC', 10001: 'ETHW', 513100: 'ETF'}
const wssUrl: Record<number, string> = {1: '', 56: '', 97: 'wss://data-seed-prebsc-2-s1.binance.org:8545', 513100: '', 137: ''}

enum MergeType {
    FromAdd = 1,
    FromRemove,
    FromModify,
    ToAdd,
    ToRemove,
    Clear
  }

export {xenAddr, xNFTAddr, rewardCalculatorAddr, dPoolAddr, chainId2NetworkName, unit, wssUrl, MergeType}