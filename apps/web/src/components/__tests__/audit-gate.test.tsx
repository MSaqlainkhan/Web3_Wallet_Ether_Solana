import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SendModal } from '../SendModal';
import { SwapCard } from '../SwapCard';
import { DepositWithdrawModal } from '../DepositWithdrawModal';
import { ReceiveModal } from '../ReceiveModal';
import { TokenBalance } from '@aetheris/common';
import { createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ADDRESS = '0x' + '2'.repeat(40);
const PRIVATE_KEY = '0x' + '1'.repeat(64);
const SOLANA_SECRET = '2' + '3'.repeat(63);

const MOCK_BALANCE = {
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  isNative: true,
  balanceRaw: '10000000000000000000',
  balanceFormatted: '10',
} as TokenBalance;

const sendProps = {
  isOpen: true,
  onClose: vi.fn(),
  currentNetworkId: 'ethereum-mainnet' as const,
  senderEvmAddress: ADDRESS,
  senderSolanaAddress: 'from',
  evmPrivateKey: PRIVATE_KEY as `0x${string}`,
  solanaPrivateKey: SOLANA_SECRET,
  nativeBalance: MOCK_BALANCE,
  onSuccess: vi.fn(),
};

const blockedMsg = 'Mainnet transactions are disabled until the external security audit is completed.';

vi.mock('viem', async (importActual) => {
  const actual = await importActual<typeof import('viem')>();
  return {
    ...actual,
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

describe('Audit gate in modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SendModal', () => {
    it('blocks Ethereum mainnet and shows the exact message without signing', async () => {
      render(<SendModal {...sendProps} />);
      await waitFor(() => {
        expect(screen.getByText(blockedMsg)).toBeInTheDocument();
      });
      expect(screen.getByText('Simulate & Review Transfer').closest('button')).toBeDisabled();
    });

    it('shows the exact message when simulation is attempted on mainnet', async () => {
      render(<SendModal {...sendProps} />);
      fireEvent.click(screen.getByText('Simulate & Review Transfer'));
      await waitFor(() => {
        expect(screen.getByText(blockedMsg)).toBeInTheDocument();
      });
    });

    it('proceeds to simulation on Sepolia', async () => {
      render(<SendModal {...sendProps} currentNetworkId='ethereum-sepolia' />);
      fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: ADDRESS } });
      fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1' } });
      fireEvent.click(screen.getByText('Simulate & Review Transfer'));
      await waitFor(() => {
        expect(screen.getByText('Confirm Transaction Parameters')).toBeInTheDocument();
      });
    });
  });

  describe('SwapCard', () => {
    it('blocks mainnet swaps and shows the exact message', () => {
      render(<SwapCard currentNetworkId="ethereum-mainnet" nativeBalance={MOCK_BALANCE} evmPrivateKey={PRIVATE_KEY as `0x${string}`} solanaPrivateKey={SOLANA_SECRET} />);
      expect(screen.getByText(blockedMsg)).toBeInTheDocument();
      expect(screen.getByText('Review Swap').closest('button')).toBeDisabled();
    });

    it('allows swaps on Sepolia', () => {
      render(<SwapCard currentNetworkId="ethereum-sepolia" nativeBalance={MOCK_BALANCE} evmPrivateKey={PRIVATE_KEY as `0x${string}`} solanaPrivateKey={SOLANA_SECRET} />);
      expect(screen.queryByText(blockedMsg)).not.toBeInTheDocument();
    });
  });

  describe('DepositWithdrawModal', () => {
    it('blocks mainnet deposits', () => {
      render(<DepositWithdrawModal isOpen onClose={vi.fn()} currentNetworkId="ethereum-mainnet" address={ADDRESS} />);
      expect(screen.getByText(blockedMsg)).toBeInTheDocument();
      expect(screen.getByText('MoonPay').closest('button')).toBeDisabled();
      expect(screen.getByText('Transak').closest('button')).toBeDisabled();
      expect(screen.getByText('Launch MOONPAY Sandbox Portal').closest('button')).toBeDisabled();
    });

    it('allows deposits on Sepolia', () => {
      render(<DepositWithdrawModal isOpen onClose={vi.fn()} currentNetworkId="ethereum-sepolia" address={ADDRESS} />);
      expect(screen.queryByText(blockedMsg)).not.toBeInTheDocument();
      expect(screen.getByText('Launch MOONPAY Sandbox Portal').closest('button')).not.toBeDisabled();
    });
  });

  describe('ReceiveModal', () => {
    it('stays enabled on mainnet', () => {
      render(<ReceiveModal isOpen onClose={vi.fn()} currentNetworkId="ethereum-mainnet" address={ADDRESS} />);
      expect(screen.getByText('Receive Funds')).toBeInTheDocument();
    });
  });
});
