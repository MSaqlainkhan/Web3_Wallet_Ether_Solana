export interface EncryptedVault {
  version: 1;
  ciphertext: string; // Base64 encoded AES-GCM ciphertext + auth tag
  iv: string;         // Base64 encoded 12-byte initialization vector
  salt: string;       // Base64 encoded 16-byte PBKDF2 salt
  kdfParams: {
    algorithm: 'PBKDF2';
    iterations: number; // e.g. 100,000
    hash: 'SHA-256';
  };
  accounts: {
    evmAddress: string;
    solanaAddress: string;
  };
  createdAt: number;
}

export interface UnlockedVaultData {
  mnemonic: string;
  evmPrivateKey: string;
  solanaPrivateKey: string; // Base58 encoded secret key
}

export const BIP44_DERIVATION_PATHS = {
  EVM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
} as const;

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string; // ERC-20 contract address or Solana SPL Mint
  isNative: boolean;
  balanceRaw: string;
  balanceFormatted: string;
  usdPrice?: number;
  usdValue?: number;
  icon?: string;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';

export interface TransactionRecord {
  id: string;
  hash: string;
  networkId: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  status: TransactionStatus;
  timestamp: number;
  fee?: string;
  explorerUrl: string;
  error?: string;
}
