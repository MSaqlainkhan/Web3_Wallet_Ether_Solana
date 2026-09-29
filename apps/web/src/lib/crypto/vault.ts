import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { privateKeyToAccount } from 'viem/accounts';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import { EncryptedVault, UnlockedVaultData, BIP44_DERIVATION_PATHS } from '@aetheris/common';

const PBKDF2_ITERATIONS = 100_000;

function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.byteLength; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class ClientVaultManager {
  /**
   * Generates a fresh 12-word BIP-39 mnemonic using browser CSPRNG
   */
  public static generateMnemonic(): string {
    return bip39.generateMnemonic(wordlist, 128); // 128 bits entropy = 12 words
  }

  /**
   * Validates a BIP-39 mnemonic
   */
  public static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic.trim(), wordlist);
  }

  /**
   * Derives EVM and Solana keypairs and addresses from a BIP-39 mnemonic
   */
  public static deriveAccountsFromMnemonic(mnemonic: string): {
    evmAddress: `0x${string}`;
    evmPrivateKey: `0x${string}`;
    solanaAddress: string;
    solanaPrivateKey: string;
  } {
    const cleanMnemonic = mnemonic.trim();
    if (!this.validateMnemonic(cleanMnemonic)) {
      throw new Error('Invalid BIP-39 mnemonic phrase');
    }

    const seed = bip39.mnemonicToSeedSync(cleanMnemonic);

    // 1. Derive EVM Keypair (m/44'/60'/0'/0/0)
    const evmHd = HDKey.fromMasterSeed(seed);
    const evmChild = evmHd.derive(BIP44_DERIVATION_PATHS.EVM);
    if (!evmChild.privateKey) {
      throw new Error('Failed to derive EVM private key');
    }
    const evmPrivateKeyHex = `0x${Buffer.from(evmChild.privateKey).toString('hex')}` as `0x${string}`;
    const evmAccount = privateKeyToAccount(evmPrivateKeyHex);

    // 2. Derive Solana Keypair (m/44'/501'/0'/0')
    const solanaDerived = derivePath(BIP44_DERIVATION_PATHS.SOLANA, Buffer.from(seed).toString('hex'));
    const solanaKeypair = Keypair.fromSeed(solanaDerived.key);
    const solanaAddress = solanaKeypair.publicKey.toBase58();
    const solanaPrivateKey = bs58.encode(solanaKeypair.secretKey);

    return {
      evmAddress: evmAccount.address,
      evmPrivateKey: evmPrivateKeyHex,
      solanaAddress,
      solanaPrivateKey,
    };
  }

  /**
   * Encrypts sensitive vault data client-side with AES-GCM (256-bit) and PBKDF2
   */
  public static async encryptVault(
    data: UnlockedVaultData,
    passphrase: string
  ): Promise<EncryptedVault> {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Derive AES-GCM Key using WebCrypto PBKDF2
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const plaintextBytes = enc.encode(JSON.stringify(data));
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      plaintextBytes
    );

    // Get public addresses for display without decrypting
    const derived = this.deriveAccountsFromMnemonic(data.mnemonic);

    return {
      version: 1,
      ciphertext: bufferToBase64(new Uint8Array(ciphertextBuffer)),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
      kdfParams: {
        algorithm: 'PBKDF2',
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      accounts: {
        evmAddress: derived.evmAddress,
        solanaAddress: derived.solanaAddress,
      },
      createdAt: Date.now(),
    };
  }

  /**
   * Decrypts the vault using the user passphrase.
   * Fails cleanly if passphrase or auth tag is invalid.
   */
  public static async decryptVault(
    vault: EncryptedVault,
    passphrase: string
  ): Promise<UnlockedVaultData> {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const salt = base64ToBuffer(vault.salt);
    const iv = base64ToBuffer(vault.iv);
    const ciphertext = base64ToBuffer(vault.ciphertext);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: vault.kdfParams.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    try {
      const decryptedBytes = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        aesKey,
        ciphertext as BufferSource
      );
      return JSON.parse(dec.decode(decryptedBytes)) as UnlockedVaultData;
    } catch {
      throw new Error('Incorrect password or corrupted vault integrity.');
    }
  }
}
