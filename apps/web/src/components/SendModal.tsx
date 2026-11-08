'use client';

import React, { useState } from 'react';
import { SUPPORTED_NETWORKS, TokenBalance } from '@aetheris/common';
import { EvmClient } from '../lib/chains/evm';
import { SolanaClient } from '../lib/chains/solana';
import { X, Send, AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';
import { isAddress } from 'viem';
import { PublicKey } from '@solana/web3.js';
import { canTransactOn, MainnetBlockedError } from '../lib/audit';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetworkId: string;
  senderEvmAddress: string;
  senderSolanaAddress: string;
  evmPrivateKey: `0x${string}`;
  solanaPrivateKey: string;
  nativeBalance: TokenBalance | null;
  onSuccess: (txHash: string) => void;
}

export const SendModal: React.FC<SendModalProps> = ({
  isOpen,
  onClose,
  currentNetworkId,
  senderEvmAddress,
  senderSolanaAddress,
  evmPrivateKey,
  solanaPrivateKey,
  nativeBalance,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'simulating' | 'confirm' | 'broadcasting' | 'success'>('input');
  const [validationError, setValidationError] = useState('');
  const [simulationFee, setSimulationFee] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const network = SUPPORTED_NETWORKS[currentNetworkId];
  const isEvm = network.family === 'evm';
  const senderAddress = isEvm ? senderEvmAddress : senderSolanaAddress;

  // Audit gate check - run before any decryption or signing
  const { allowed, reason } = canTransactOn(network);
  const isMainnetBlocked = !allowed;

  const validateInputs = (): boolean => {
    setValidationError('');
    const cleanRecipient = recipient.trim();

    if (!cleanRecipient) {
      setValidationError('Please enter a destination recipient address.');
      return false;
    }

    if (isEvm) {
      if (!isAddress(cleanRecipient)) {
        setValidationError('Invalid EVM address format. Must be a 42-character 0x-prefixed address.');
        return false;
      }
    } else {
      try {
        new PublicKey(cleanRecipient);
      } catch {
        setValidationError('Invalid Solana public key format. Must be a valid Base58 string.');
        return false;
      }
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid transfer amount greater than 0.');
      return false;
    }

    const currentBal = nativeBalance ? parseFloat(nativeBalance.balanceFormatted) : 0;
    if (numAmount > currentBal) {
      setValidationError(`Insufficient balance. You only have ${currentBal} ${network.nativeCurrency.symbol}.`);
      return false;
    }

    return true;
  };

  const handleSimulate = async () => {
    // Audit gate: block mainnet transactions if audit incomplete
    if (isMainnetBlocked) {
      setErrorMessage(reason || 'Mainnet transactions are disabled until the external security audit is completed.');
      setStep('input');
      return;
    }

    if (!validateInputs()) return;

    setStep('simulating');
    setErrorMessage('');

    try {
      if (isEvm) {
        const result = await EvmClient.simulateTransfer(
          currentNetworkId,
          senderAddress as `0x${string}`,
          recipient.trim() as `0x${string}`,
          amount
        );

        if (!result.success) {
          throw new Error(result.error || 'Transaction simulation reverted.');
        }
        setSimulationFee(`~${(Number(result.gasEstimate) * 0.00000002).toFixed(6)} ETH`);
      } else {
        const result = await SolanaClient.simulateTransfer(
          currentNetworkId,
          senderAddress,
          recipient.trim(),
          parseFloat(amount)
        );

        if (!result.success) {
          throw new Error(result.error || 'Solana transaction simulation rejected.');
        }
        setSimulationFee(`~0.000005 SOL (5,000 Lamports)`);
      }

      setStep('confirm');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setErrorMessage(msg);
      setStep('input');
    }
  };

  const handleBroadcast = async () => {
    // Audit gate: block mainnet transactions if audit incomplete (defense in depth)
    if (isMainnetBlocked) {
      setErrorMessage(reason || 'Mainnet transactions are disabled until the external security audit is completed.');
      setStep('confirm');
      return;
    }

    setStep('broadcasting');
    setErrorMessage('');

    try {
      let hash = '';
      if (isEvm) {
        hash = await EvmClient.sendTransfer(
          currentNetworkId,
          evmPrivateKey,
          recipient.trim() as `0x${string}`,
          amount
        );
      } else {
        hash = await SolanaClient.sendTransfer(
          currentNetworkId,
          solanaPrivateKey,
          recipient.trim(),
          parseFloat(amount)
        );
      }

      setTxHash(hash);
      setStep('success');
      onSuccess(hash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to broadcast transaction';
      setErrorMessage(msg);
      setStep('confirm');
    }
  };

  const explorerBase = network.blockExplorers[0]?.url;
  const explorerTxUrl = isEvm
    ? `${explorerBase}/tx/${txHash}`
    : `${explorerBase}&tx=${txHash}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-obsidian-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center">
              <Send className="w-5 h-5 text-brand-emerald" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Send {network.nativeCurrency.symbol}
              </h3>
              <p className="text-xs text-slate-400">
                Network: <span className="font-semibold text-slate-300">{network.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP: INPUT */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Destination Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={isEvm ? '0x...' : 'Solana Public Key (Base58)'}
                className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300 uppercase tracking-wider">
                  Amount
                </label>
                <span className="text-slate-400">
                  Available: {nativeBalance ? nativeBalance.balanceFormatted : '0.0000'} {network.nativeCurrency.symbol}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-obsidian-950 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (nativeBalance) {
                      const num = parseFloat(nativeBalance.balanceFormatted);
                      setAmount((Math.max(0, num - 0.001)).toFixed(4));
                    }
                  }}
                  className="absolute right-3 top-3 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-brand-emerald transition"
                >
                  MAX
                </button>
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-brand-ruby flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </p>
            )}

            {errorMessage && (
              <p className="text-xs text-brand-ruby flex items-center gap-1.5 p-3 rounded-xl bg-brand-ruby/10 border border-brand-ruby/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}

            {isMainnetBlocked && (
              <p className="text-xs text-amber-300 flex items-center gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{reason}</span>
              </p>
            )}

            <button
              onClick={handleSimulate}
              disabled={isMainnetBlocked}
              className={`w-full py-3.5 rounded-xl font-semibold text-obsidian-950 shadow-glow-emerald transition flex items-center justify-center gap-2 text-sm ${
                isMainnetBlocked
                  ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed'
                  : 'bg-brand-emerald hover:bg-emerald-400'
              }`}
              title={isMainnetBlocked ? reason : ''}
            >
              <span>Simulate & Review Transfer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP: SIMULATING */}
        {step === 'simulating' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin mx-auto" />
            <h4 className="text-sm font-semibold text-white">Simulating Transaction Outcome...</h4>
            <p className="text-xs text-slate-400">
              Validating execution via RPC call without broadcasting to safeguard your funds.
            </p>
          </div>
        )}

        {/* STEP: CONFIRMATION MODAL (EXPLICIT FINAL CHECK) */}
        {step === 'confirm' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm Transaction Parameters
              </h4>

              <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono font-bold text-white text-base">
                  {amount} {network.nativeCurrency.symbol}
                </span>
              </div>

              <div className="flex justify-between items-start py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400">Recipient</span>
                <span className="font-mono text-slate-200 break-all max-w-[240px] text-right">
                  {recipient}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                <span className="text-slate-400">Network</span>
                <span className="font-medium text-amber-300 flex items-center gap-1">
                  {network.name}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-slate-400">Simulated Network Fee</span>
                <span className="font-mono text-slate-300">{simulationFee}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>This transfer is irreversible once broadcast to the blockchain.</span>
            </div>

            {errorMessage && (
              <p className="text-xs text-brand-ruby flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="px-4 py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-300 text-xs font-medium"
              >
                Back / Edit
              </button>
              <button
                onClick={handleBroadcast}
                className="flex-1 py-3.5 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 font-bold text-sm shadow-glow-emerald transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Sign Transaction</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP: BROADCASTING */}
        {step === 'broadcasting' && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-cyan animate-spin mx-auto" />
            <h4 className="text-sm font-semibold text-white">Signing & Broadcasting...</h4>
            <p className="text-xs text-slate-400">
              Generating signature in client memory and submitting raw transaction to RPC node.
            </p>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-brand-emerald/20 border border-brand-emerald/40 text-brand-emerald mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Transaction Broadcasted!</h4>
              <p className="text-xs text-slate-400">
                Successfully submitted to {network.name}.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-obsidian-950 border border-white/10 font-mono text-xs text-slate-300 break-all">
              {txHash}
            </div>

            <div className="flex justify-center gap-3">
              <a
                href={explorerTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-xs font-medium text-white border border-white/10 flex items-center gap-1.5 transition"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 text-xs font-bold transition shadow-glow-emerald"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
