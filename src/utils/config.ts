const xenAddr: Record<number, string> = {1: '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8', 56: 'BNB', 97: '0x0413409023D4689d8ED2db86a211254D1845b150', 137: 'Polygon'}
const xNFTAddr: Record<number, string> = {1: '', 56: '', 97: '0x985e1f59Ddf98440E4Dfb0028f498639B5E0B158', 137: ''}
const rewardCalculatorAddr: Record<number, string> = {1: '', 56: '', 97: '0x8E8D032040B64a4CE7bf9631338F1E7b8Ea9511f', 513100: '', 137: ''}
const dPoolAddr: Record<number, string> = {1: '', 56: '', 97: '0x890fA99AD9461CdC7e1BA5788FCe31572226467B', 513100: '', 137: ''}
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