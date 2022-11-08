const xenAddr: Record<number, string> = {1: '', 56: 'BNB', 97: '0xf6c2dD2616641F2C98cf379b02a565b01c08D4Ac', 137: 'Polygon', 42170: '0xcD7a02e76E2dfDf51f18172f61Bc7F052969DEBf'}
const xNFTAddr: Record<number, string> = {1: '', 56: '', 97: '0x3D01d388829771A4DaA9aE48291487c9b4e73dfa', 137: '', 42170: '0x45f8557bbfA0dDF90A3B4E3f97e0E72648839638'}
const rewardCalculatorAddr: Record<number, string> = {1: '', 56: '', 97: '0x8E8D032040B64a4CE7bf9631338F1E7b8Ea9511f', 513100: '', 137: '', 42170: '0x3C2438fC7F9e552037ce5F817BF3072aDD5Ab474'}
const dPoolAddr: Record<number, string> = {1: '', 56: '', 97: '0xe6686E1cc9939FC43e1400A76E304e3AF1317A3a', 513100: '', 137: '', 42170: '0xACD351313c824cFBa070C405693aE8fe495395F8'}
const chainId2NetworkName: Record<number, string> = {1: 'Ethereum', 56: 'BSC', 97: 'BSC-Testnet', 137: 'Polygon', 80001: 'Mumbai', 42170: 'Arbitrum-Nova'}
const unit: Record<number, string> = {1: 'ETH', 56: 'BNB', 97: 'BNB', 137: 'MATIC', 80001: 'MATIC', 10001: 'ETHW', 513100: 'ETF'}
const wssUrl: Record<number, string> = {1: '', 56: '', 97: 'wss://data-seed-prebsc-2-s1.binance.org:8545', 513100: '', 137: '', 42170: 'wss://nova.arbitrum.io/feed'}

enum MergeType {
    FromAdd = 1,
    FromRemove,
    FromModify,
    ToAdd,
    ToRemove,
    Clear
  }

export {xenAddr, xNFTAddr, rewardCalculatorAddr, dPoolAddr, chainId2NetworkName, unit, wssUrl, MergeType}