import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvmClient } from '../chains/evm';
import { SolanaClient } from '../chains/solana';
import { MainnetBlockedError } from '../audit';
import { createWalletClient, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Keypair, sendAndConfirmTransaction } from '@solana/web3.js';

const PRIVATE_KEY = '0x' + '1'.repeat(64);
const SOLANA_SECRET = '2' + '3'.repeat(63);
const TO_EVM = '0x' + '2'.repeat(40);
const TO_SOL = 'SolanaAddress123456789012345678901234567890';

vi.mock('viem', async (importActual) => {
  const actual = await importActual<typeof import('viem')>();
  return {
    ...actual,
    createWalletClient: vi.fn(() => ({
      sendTransaction: vi.fn().mockResolvedValue('0x' + 'a'.repeat(64)),
    } as any)),
    createPublicClient: vi.fn(() => ({
      estimateGas: vi.fn().mockResolvedValue(21000n),
      call: vi.fn().mockResolvedValue(undefined),
      getBalance: vi.fn().mockResolvedValue(0n),
    } as any)),
  };
});

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(() => ({ address: '0x' + 'b'.repeat(40) } as any)),
}));

vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn(() => ({
    getBalance: vi.fn().mockResolvedValue(1_000_000_000),
    getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'recent', lastValidBlockHeight: 1 }),
    simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    sendAndConfirmTransaction: vi.fn().mockResolvedValue('signature'),
  })),
  PublicKey: vi.fn(),
  Keypair: {
    fromSecretKey: vi.fn(() => ({ publicKey: { toBase58: () => 'from' } as any })),
  },
  SystemProgram: { transfer: vi.fn() },
  Transaction: class {
    add() {
      return this;
    }
  },
  LAMPORTS_PER_SOL: 1_000_000_000,
  sendAndConfirmTransaction: vi.fn().mockResolvedValue('signature'),
}));

describe('Audit gate on chain functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ethereum mainnet send is blocked', () => {
    it('throws MainnetBlockedError before signing or broadcasting', async () => {
      await expect(
        EvmClient.sendTransfer('ethereum-mainnet', PRIVATE_KEY as `0x${string}`, TO_EVM as `0x${string}`, '1')
      ).rejects.toThrow(MainnetBlockedError);
      expect(privateKeyToAccount).not.toHaveBeenCalled();
      expect(createWalletClient).not.toHaveBeenCalled();
    });

    it('proceeds on Sepolia', async () => {
      const hash = await EvmClient.sendTransfer(
        'ethereum-sepolia',
        PRIVATE_KEY as `0x${string}`,
        TO_EVM as `0x${string}`,
        '1'
      );
      expect(hash).toBe('0x' + 'a'.repeat(64));
      expect(createWalletClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ethereum simulation gate', () => {
    it('throws MainnetBlockedError on mainnet before touching RPC', async () => {
      await expect(
        EvmClient.simulateTransfer('ethereum-mainnet', TO_EVM as `0x${string}`, TO_EVM as `0x${string}`, '1')
      ).rejects.toThrow(MainnetBlockedError);
      expect(createPublicClient).not.toHaveBeenCalled();
    });

    it('proceeds on Sepolia', async () => {
      const result = await EvmClient.simulateTransfer(
        'ethereum-sepolia',
        TO_EVM as `0x${string}`,
        TO_EVM as `0x${string}`,
        '1'
      );
      expect(result.success).toBe(true);
      expect(createPublicClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('Solana mainnet send is blocked', () => {
    it('throws MainnetBlockedError before the key is touched', async () => {
      await expect(SolanaClient.sendTransfer('solana-mainnet', SOLANA_SECRET, TO_SOL, 1)).rejects.toThrow(
        MainnetBlockedError
      );
      expect(Keypair.fromSecretKey).not.toHaveBeenCalled();
      expect(sendAndConfirmTransaction).not.toHaveBeenCalled();
    });

    it('proceeds on Devnet', async () => {
      const signature = await SolanaClient.sendTransfer('solana-devnet', SOLANA_SECRET, TO_SOL, 1);
      expect(signature).toBe('signature');
      expect(Keypair.fromSecretKey).toHaveBeenCalledTimes(1);
      expect(sendAndConfirmTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Solana simulation gate', () => {
    it('throws MainnetBlockedError on mainnet', async () => {
      await expect(SolanaClient.simulateTransfer('solana-mainnet', 'from', TO_SOL, 1)).rejects.toThrow(
        MainnetBlockedError
      );
    });

    it('proceeds on Devnet', async () => {
      const result = await SolanaClient.simulateTransfer('solana-devnet', 'from', TO_SOL, 1);
      expect(result.success).toBe(true);
    });
  });
});
