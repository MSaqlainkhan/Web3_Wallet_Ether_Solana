export type ChainFamily = 'evm' | 'solana';

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface BlockExplorer {
  name: string;
  url: string;
}

export interface NetworkConfig {
  id: string; // Unique network key, e.g. 'ethereum-sepolia'
  name: string;
  shortName: string;
  family: ChainFamily;
  isTestnet: boolean;
  chainId?: number; // For EVM
  cluster?: 'devnet' | 'testnet' | 'mainnet-beta'; // For Solana
  rpcUrls: string[];
  nativeCurrency: NativeCurrency;
  blockExplorers: BlockExplorer[];
  faucetUrl?: string;
  icon: string;
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    name: 'Ethereum Sepolia',
    shortName: 'Sepolia',
    family: 'evm',
    isTestnet: true,
    chainId: 11155111,
    rpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://1rpc.io/sepolia',
      'https://gateway.tenderly.co/public/sepolia',
      'https://rpc.ankr.com/eth_sepolia',
      'https://ethereum-sepolia.publicnode.com',
    ],
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorers: [
      {
        name: 'Sepolia Etherscan',
        url: 'https://sepolia.etherscan.io',
      },
    ],
    faucetUrl: 'https://sepoliafaucet.com',
    icon: 'ethereum',
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    shortName: 'Devnet',
    family: 'solana',
    isTestnet: true,
    cluster: 'devnet',
    rpcUrls: [
      'https://api.devnet.solana.com',
      'https://solana-devnet.g.alchemy.com/v2/demo'
    ],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    blockExplorers: [
      {
        name: 'Solscan Devnet',
        url: 'https://solscan.io?cluster=devnet',
      },
    ],
    faucetUrl: 'https://faucet.solana.com',
    icon: 'solana',
  },
  'ethereum-mainnet': {
    id: 'ethereum-mainnet',
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    family: 'evm',
    isTestnet: false,
    chainId: 1,
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com'
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorers: [
      {
        name: 'Etherscan',
        url: 'https://etherscan.io',
      },
    ],
    icon: 'ethereum',
  },
  'solana-mainnet': {
    id: 'solana-mainnet',
    name: 'Solana Mainnet-Beta',
    shortName: 'Solana',
    family: 'solana',
    isTestnet: false,
    cluster: 'mainnet-beta',
    rpcUrls: [
      'https://api.mainnet-beta.solana.com'
    ],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    blockExplorers: [
      {
        name: 'Solscan',
        url: 'https://solscan.io',
      },
    ],
    icon: 'solana',
  },
  'arbitrum-sepolia': {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    shortName: 'Arb Sepolia',
    family: 'evm',
    isTestnet: true,
    chainId: 421614,
    rpcUrls: [
      'https://sepolia-rollup.arbitrum.io/rpc'
    ],
    nativeCurrency: {
      name: 'Arbitrum Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorers: [
      {
        name: 'Arbiscan Sepolia',
        url: 'https://sepolia.arbiscan.io',
      },
    ],
    icon: 'arbitrum',
  },
  'polygon-amoy': {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    shortName: 'Amoy',
    family: 'evm',
    isTestnet: true,
    chainId: 80002,
    rpcUrls: [
      'https://rpc-amoy.polygon.technology'
    ],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorers: [
      {
        name: 'OKLink Amoy',
        url: 'https://www.oklink.com/amoy',
      },
    ],
    icon: 'polygon',
  },
};

export const DEFAULT_NETWORK_ID = 'ethereum-sepolia';
export const DEFAULT_TESTNET_NETWORKS = ['ethereum-sepolia', 'solana-devnet'];
