import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WalletOnboarding } from '../WalletOnboarding';
import { EncryptedVault, UnlockedVaultData } from '@aetheris/common';
import { ClientVaultManager } from '../../lib/crypto/vault';
import { webcrypto } from 'node:crypto';

vi.mock('../../lib/crypto/vault', async () => {
  const actual = await vi.importActual<typeof import('../../lib/crypto/vault')>('../../lib/crypto/vault');
  return {
    ...actual,
    ClientVaultManager: {
      ...(actual.ClientVaultManager as object),
      generateMnemonic: vi.fn(() => VALID_MNEMONIC),
      validateMnemonic: vi.fn((mnemonic: string) => {
        const words = mnemonic.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
      }),
      deriveAccountsFromMnemonic: vi.fn((mnemonic: string) => ({
        evmAddress: '0x1234567890123456789012345678901234567890',
        evmPrivateKey: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        solanaAddress: 'SoLanaAddress123456789012345678901234567890',
        solanaPrivateKey: 'solanaPrivateKeyBase58',
      })),
      encryptVault: vi.fn(async (data: UnlockedVaultData, password: string) => ({
        version: 1,
        ciphertext: 'encrypted',
        iv: 'iv',
        salt: 'salt',
        kdfParams: { algorithm: 'PBKDF2', iterations: 100000, hash: 'SHA-256' },
        accounts: {
          evmAddress: '0x1234567890123456789012345678901234567890',
          solanaAddress: 'SoLanaAddress123456789012345678901234567890',
        },
        createdAt: Date.now(),
      })),
      decryptVault: vi.fn(async () => ({
        mnemonic: 'test test test test test test test test test test test junk',
        evmPrivateKey: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        solanaPrivateKey: 'solanaPrivateKeyBase58',
      })),
    },
  };
});

beforeEach(() => {
  if (typeof window === 'undefined') {
    (globalThis as any).window = {
      crypto: webcrypto,
    };
  } else if (!window.crypto) {
    (window as any).crypto = webcrypto;
  }
  vi.clearAllMocks();
});

const VALID_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const MOCK_ON_UNLOCKED = vi.fn();
const MOCK_ON_RESET = vi.fn();

describe('WalletOnboarding - Import Flow', () => {
  it('shows password form after valid mnemonic import', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    // Switch to import mode
    fireEvent.click(screen.getByText('Import Wallet'));

    // Enter valid 12-word mnemonic
    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: VALID_MNEMONIC } });

    // Click verify
    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    // Should show password form
    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });

    // Should have password inputs
    expect(screen.getByPlaceholderText('Enter strong password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter password')).toBeInTheDocument();
  });

  it('shows error for invalid mnemonic', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Import Wallet'));

    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: 'invalid phrase' } });

    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid BIP-39 mnemonic phrase/)).toBeInTheDocument();
    });
  });

  it('back button from password form returns to import form', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Import Wallet'));

    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: VALID_MNEMONIC } });

    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });

    // Click back button
    fireEvent.click(screen.getByText('Back'));

    // Should return to import form
    await waitFor(() => {
      expect(screen.getByText('Import Existing Wallet')).toBeInTheDocument();
    });
  });

  it('submits password and calls onUnlocked', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Import Wallet'));

    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: VALID_MNEMONIC } });

    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });

    // Fill password
    const passwordInput = screen.getByPlaceholderText('Enter strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123' } });

    // Submit
    fireEvent.click(screen.getByText('Finish Setup & Open Wallet'));

    // Wait for onUnlocked to be called
    await waitFor(() => {
      expect(MOCK_ON_UNLOCKED).toHaveBeenCalledTimes(1);
    });

    const callArgs = MOCK_ON_UNLOCKED.mock.calls[0];
    expect(callArgs[0]).toHaveProperty('mnemonic', VALID_MNEMONIC);
    expect(callArgs[1]).toHaveProperty('version', 1);
  });

  it('rejects password shorter than 8 characters', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Import Wallet'));

    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: VALID_MNEMONIC } });

    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('Enter strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmInput, { target: { value: 'short' } });

    fireEvent.click(screen.getByText('Finish Setup & Open Wallet'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    });

    expect(MOCK_ON_UNLOCKED).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Import Wallet'));

    const textarea = screen.getByPlaceholderText(/e\.g\. apple banana/);
    fireEvent.change(textarea, { target: { value: VALID_MNEMONIC } });

    fireEvent.click(screen.getByText('Verify Seed Phrase'));

    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText('Enter strong password');
    const confirmInput = screen.getByPlaceholderText('Re-enter password');
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123' } });

    fireEvent.click(screen.getByText('Finish Setup & Open Wallet'));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    expect(MOCK_ON_UNLOCKED).not.toHaveBeenCalled();
  });
});

describe('WalletOnboarding - Create Flow', () => {
  it('proceeds from generate to confirm_backup to set_password', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    // Click generate
    fireEvent.click(screen.getByText('Generate Secure Seed Phrase'));

    // Should show mnemonic
    await waitFor(() => {
      expect(screen.getByText('Non-Custodial Guarantee & Warning')).toBeInTheDocument();
    });

    // Click "I Saved It"
    fireEvent.click(screen.getByText('I Saved It'));

    // Should show confirm backup
    await waitFor(() => {
      expect(screen.getByText('Confirm Backup')).toBeInTheDocument();
    });

    // Check checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Click proceed
    fireEvent.click(screen.getByText('Proceed to Device Password'));

    // Should show password form
    await waitFor(() => {
      expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument();
    });
  });

  it('back button from password form returns to confirm_backup in create flow', async () => {
    render(<WalletOnboarding existingVault={null} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    fireEvent.click(screen.getByText('Generate Secure Seed Phrase'));
    await waitFor(() => expect(screen.getByText('I Saved It')).toBeInTheDocument());
    fireEvent.click(screen.getByText('I Saved It'));
    await waitFor(() => expect(screen.getByText('Confirm Backup')).toBeInTheDocument());
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText('Proceed to Device Password'));
    await waitFor(() => expect(screen.getByText('Encrypt Local Vault')).toBeInTheDocument());

    // Click back button
    fireEvent.click(screen.getByText('Back'));

    // Should return to confirm_backup
    await waitFor(() => {
      expect(screen.getByText('Confirm Backup')).toBeInTheDocument();
    });
  });
});

describe('WalletOnboarding - Unlock Flow', () => {
  it('unlocks existing vault with correct password', async () => {
    const mockVault: EncryptedVault = {
      version: 1,
      ciphertext: 'encrypted',
      iv: 'iv',
      salt: 'salt',
      kdfParams: { algorithm: 'PBKDF2', iterations: 100000, hash: 'SHA-256' },
      accounts: {
        evmAddress: '0x1234567890123456789012345678901234567890',
        solanaAddress: 'SoLanaAddress123456789012345678901234567890',
      },
      createdAt: Date.now(),
    };

    render(<WalletOnboarding existingVault={mockVault} onUnlocked={MOCK_ON_UNLOCKED} onResetVault={MOCK_ON_RESET} />);

    // Should show unlock form
    expect(screen.getByText('Unlock Your Vault')).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText('Enter vault password');
    fireEvent.change(passwordInput, { target: { value: 'CorrectPassword999' } });

    fireEvent.click(screen.getByText('Unlock Session'));

    await waitFor(() => {
      expect(MOCK_ON_UNLOCKED).toHaveBeenCalledTimes(1);
    });
  });
});