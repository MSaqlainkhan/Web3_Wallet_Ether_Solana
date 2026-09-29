import { describe, it, expect, beforeAll } from 'vitest';
import { ClientVaultManager } from '../vault';
import { webcrypto } from 'node:crypto';

beforeAll(() => {
  if (typeof window === 'undefined') {
    (globalThis as any).window = {
      crypto: webcrypto,
    };
  } else if (!window.crypto) {
    (window as any).crypto = webcrypto;
  }
});

describe('ClientVaultManager Cryptography', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('generates a valid 12-word BIP-39 mnemonic', () => {
    const mnemonic = ClientVaultManager.generateMnemonic();
    expect(mnemonic.split(' ').length).toBe(12);
    expect(ClientVaultManager.validateMnemonic(mnemonic)).toBe(true);
  });

  it('validates a correct mnemonic and rejects invalid phrases', () => {
    expect(ClientVaultManager.validateMnemonic(TEST_MNEMONIC)).toBe(true);
    expect(ClientVaultManager.validateMnemonic('invalid random words that do not exist')).toBe(false);
  });

  it('derives predictable standard EVM and Solana addresses from BIP-39 mnemonic', () => {
    const derived = ClientVaultManager.deriveAccountsFromMnemonic(TEST_MNEMONIC);

    // EVM: m/44'/60'/0'/0/0 for "abandon ... about"
    expect(derived.evmAddress.toLowerCase()).toBe('0x9858effd232b4033e47d90003d41ec34ecaeda94');
    expect(derived.evmPrivateKey.startsWith('0x')).toBe(true);

    // Solana: m/44'/501'/0'/0' derivation should produce valid Base58 address
    expect(derived.solanaAddress).toBeDefined();
    expect(derived.solanaAddress.length).toBeGreaterThanOrEqual(32);
    expect(derived.solanaPrivateKey).toBeDefined();
  });

  it('encrypts and decrypts vault round-trip with correct password', async () => {
    const password = 'StrongPassword!123';
    const unlockedData = {
      mnemonic: TEST_MNEMONIC,
      evmPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      solanaPrivateKey: 'mockSolanaKeyBase58',
    };

    const encrypted = await ClientVaultManager.encryptVault(unlockedData, password);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.accounts.evmAddress).toBeDefined();

    // Decrypt with correct password
    const decrypted = await ClientVaultManager.decryptVault(encrypted, password);
    expect(decrypted.mnemonic).toBe(TEST_MNEMONIC);
    expect(decrypted.evmPrivateKey).toBe(unlockedData.evmPrivateKey);
    expect(decrypted.solanaPrivateKey).toBe(unlockedData.solanaPrivateKey);
  });

  it('rejects decryption when given an incorrect password', async () => {
    const password = 'CorrectPassword999';
    const unlockedData = {
      mnemonic: TEST_MNEMONIC,
      evmPrivateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      solanaPrivateKey: 'mockSolanaKeyBase58',
    };

    const encrypted = await ClientVaultManager.encryptVault(unlockedData, password);

    await expect(
      ClientVaultManager.decryptVault(encrypted, 'WrongPassword123')
    ).rejects.toThrow();
  });
});
