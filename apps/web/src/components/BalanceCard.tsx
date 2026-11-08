'use client';

import React, { useState } from 'react';
import { SUPPORTED_NETWORKS, TokenBalance } from '@aetheris/common';
import { isAuditComplete } from '@/lib/audit';
import {
  Copy,
  Check,
  ExternalLink,
  Send,
  Download,
  ArrowLeftRight,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface BalanceCardProps {
  currentNetworkId: string;
  address: string;
  nativeBalance: TokenBalance | null;
  isLoadingBalance: boolean;
  onRefreshBalance: () => void;
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onOpenSwap: () => void;
  onOpenDepositWithdraw: (tab: 'deposit' | 'withdraw') => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  currentNetworkId,
  address,
  nativeBalance,
  isLoadingBalance,
  onRefreshBalance,
  onOpenSend,
  onOpenReceive,
  onOpenSwap,
  onOpenDepositWithdraw,
}) => {
  const [copied, setCopied] = useState(false);
  const network = SUPPORTED_NETWORKS[currentNetworkId];
  const auditComplete = isAuditComplete();
  const isMainnetUnaudited = !network.isTestnet && !auditComplete;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = address;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Ignore fallback failure
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerBase = network.blockExplorers[0]?.url;
  const explorerUrl = network.family === 'evm'
    ? `${explorerBase}/address/${address}`
    : `${explorerBase}&account=${address}`;

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 shadow-card-subtle relative overflow-hidden">
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
          network.isTestnet ? 'bg-amber-500/10' : 'bg-brand-emerald/10'
        }`}
      />

      {/* Header: Network badge and address bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              network.isTestnet ? 'bg-amber-400 animate-pulse' : 'bg-brand-emerald'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {network.name}
          </span>
          {network.isTestnet && (
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Testnet
            </span>
          )}
          {isMainnetUnaudited && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
              UNAUDITED
            </span>
          )}
        </div>

        {/* Public Address with copy & explorer links */}
        <div className="flex items-center gap-1.5 bg-obsidian-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono">
          <span className="text-slate-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white p-1 rounded transition"
            title="Copy Public Address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white p-1 rounded transition"
            title="View on Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Balance Display */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Total Native Balance
          </span>
          <button
            onClick={onRefreshBalance}
            disabled={isLoadingBalance}
            className="text-slate-500 hover:text-slate-300 transition"
            title="Refresh balance"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white">
            {nativeBalance ? nativeBalance.balanceFormatted : '0.0000'}
          </span>
          <span className="text-xl font-bold font-mono text-brand-emerald">
            {network.nativeCurrency.symbol}
          </span>
        </div>

        {network.isTestnet && (
          <p className="text-xs text-amber-300/80 pt-1 flex items-center gap-1">
            <span>Valueless testnet assets for validation and staging testing.</span>
          </p>
        )}
      </div>

      {/* Quick Action Button Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <button
          onClick={onOpenSend}
          disabled={isMainnetUnaudited}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition ${
            isMainnetUnaudited
              ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-white/10'
              : 'bg-brand-emerald hover:bg-emerald-400 text-obsidian-950 shadow-glow-emerald'
          }`}
          title={isMainnetUnaudited ? 'Mainnet transactions are disabled until the external security audit is completed.' : ''}
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>

        <button
          onClick={onOpenReceive}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-obsidian-800 hover:bg-obsidian-750 text-white border border-white/10 font-semibold text-sm transition"
        >
          <Download className="w-4 h-4 text-brand-cyan" />
          <span>Receive</span>
        </button>

        <button
          onClick={onOpenSwap}
          disabled={isMainnetUnaudited}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition ${
            isMainnetUnaudited
              ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-white/10'
              : 'bg-obsidian-800 hover:bg-obsidian-750 text-white border border-white/10'
          }`}
          title={isMainnetUnaudited ? 'Mainnet transactions are disabled until the external security audit is completed.' : ''}
        >
          <ArrowLeftRight className="w-4 h-4 text-brand-emerald" />
          <span>Swap</span>
        </button>

        <button
          onClick={() => onOpenDepositWithdraw('deposit')}
          disabled={isMainnetUnaudited}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition ${
            isMainnetUnaudited
              ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-white/10'
              : 'bg-obsidian-800 hover:bg-obsidian-750 text-white border border-white/10'
          }`}
          title={isMainnetUnaudited ? 'Mainnet transactions are disabled until the external security audit is completed.' : ''}
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Deposit</span>
        </button>
      </div>
    </div>
  );
};
