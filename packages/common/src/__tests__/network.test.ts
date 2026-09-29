import { describe, it, expect } from 'vitest';
import { SUPPORTED_NETWORKS, DEFAULT_NETWORK_ID, DEFAULT_TESTNET_NETWORKS } from '../types/network.js';

describe('Network Configuration & Testnet Guardrails', () => {
  it('defaults to a testnet network', () => {
    expect(DEFAULT_TESTNET_NETWORKS).toContain(DEFAULT_NETWORK_ID);
    const defaultNet = SUPPORTED_NETWORKS[DEFAULT_NETWORK_ID];
    expect(defaultNet.isTestnet).toBe(true);
  });

  it('correctly configures Ethereum Sepolia with chainId 11155111', () => {
    const sepolia = SUPPORTED_NETWORKS['ethereum-sepolia'];
    expect(sepolia).toBeDefined();
    expect(sepolia.chainId).toBe(11155111);
    expect(sepolia.family).toBe('evm');
    expect(sepolia.isTestnet).toBe(true);
    expect(sepolia.nativeCurrency.symbol).toBe('ETH');
  });

  it('correctly configures Solana Devnet with cluster devnet', () => {
    const solanaDevnet = SUPPORTED_NETWORKS['solana-devnet'];
    expect(solanaDevnet).toBeDefined();
    expect(solanaDevnet.cluster).toBe('devnet');
    expect(solanaDevnet.family).toBe('solana');
    expect(solanaDevnet.isTestnet).toBe(true);
    expect(solanaDevnet.nativeCurrency.symbol).toBe('SOL');
  });

  it('marks Ethereum Mainnet and Solana Mainnet as non-testnet', () => {
    expect(SUPPORTED_NETWORKS['ethereum-mainnet'].isTestnet).toBe(false);
    expect(SUPPORTED_NETWORKS['solana-mainnet'].isTestnet).toBe(false);
  });
});
