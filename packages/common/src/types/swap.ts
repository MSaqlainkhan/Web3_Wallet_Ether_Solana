import { TokenBalance } from './wallet.js';

export interface SwapQuote {
  provider: '0x' | '1inch' | 'jupiter' | 'mock';
  networkId: string;
  fromToken: TokenBalance;
  toToken: TokenBalance;
  fromAmount: string; // Raw atomic units
  toAmount: string;   // Expected output in atomic units
  minimumToAmount: string; // Minimum output accounting for slippage
  priceImpactPercent: number;
  slippageBps: number; // Basis points (e.g. 50 = 0.5%)
  estimatedGasFeeUsd?: number;
  routeSummary?: string;
  rawTransactionData?: {
    to?: string;
    data?: string;
    value?: string;
    gasLimit?: string;
    jupiterSwapTransaction?: string; // Base64 encoded versioned transaction
  };
  expiresAt: number;
}

export type SwapExecutionState =
  | 'idle'
  | 'fetching_quote'
  | 'simulating'
  | 'awaiting_allowance_approval'
  | 'awaiting_signature'
  | 'broadcasting'
  | 'confirming'
  | 'success'
  | 'error';
