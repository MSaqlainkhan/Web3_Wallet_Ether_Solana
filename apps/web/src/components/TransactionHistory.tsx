'use client';

import React from 'react';
import { TransactionRecord, SUPPORTED_NETWORKS } from '@aetheris/common';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ExternalLink, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
  currentNetworkId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  currentNetworkId,
}) => {
  const network = SUPPORTED_NETWORKS[currentNetworkId];
  const filtered = transactions.filter((t) => t.networkId === currentNetworkId);

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-5 border border-white/10 shadow-card-subtle">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} {filtered.length === 1 ? 'Tx' : 'Txs'} on {network.shortName}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No transactions recorded on {network.name} yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tx) => {
            const isEvm = network.family === 'evm';
            const explorerBase = network.blockExplorers[0]?.url;
            const explorerTxUrl = isEvm
              ? `${explorerBase}/tx/${tx.hash}`
              : `${explorerBase}&tx=${tx.hash}`;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-obsidian-950 border border-white/5 hover:border-white/15 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-obsidian-800 border border-white/10 flex items-center justify-center text-slate-300">
                    {tx.type === 'send' && <ArrowUpRight className="w-4 h-4 text-brand-cyan" />}
                    {tx.type === 'receive' && <ArrowDownLeft className="w-4 h-4 text-brand-emerald" />}
                    {tx.type === 'swap' && <ArrowLeftRight className="w-4 h-4 text-amber-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white capitalize">
                        {tx.type} {tx.symbol}
                      </span>
                      {tx.status === 'confirmed' && (
                        <span className="flex items-center gap-1 text-[10px] text-brand-emerald">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Confirmed</span>
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Pending</span>
                        </span>
                      )}
                      {tx.status === 'failed' && (
                        <span className="flex items-center gap-1 text-[10px] text-brand-ruby">
                          <XCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-white">
                      {tx.type === 'send' ? `-${tx.amount}` : `+${tx.amount}`} {tx.symbol}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                    </div>
                  </div>

                  <a
                    href={explorerTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 text-slate-400 hover:text-white transition"
                    title="View on Block Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
