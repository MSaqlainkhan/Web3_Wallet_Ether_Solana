'use client';

import React from 'react';
import { NetworkSlider } from './NetworkSlider';
import { ShieldCheck, Lock, Unlock, Wallet } from 'lucide-react';
import { SUPPORTED_NETWORKS } from '@aetheris/common';

interface HeaderProps {
  currentNetworkId: string;
  onSelectNetwork: (id: string) => void;
  isUnlocked: boolean;
  hasVault: boolean;
  currentAddress?: string;
  onLockWallet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentNetworkId,
  onSelectNetwork,
  isUnlocked,
  hasVault,
  currentAddress,
  onLockWallet,
}) => {
  const network = SUPPORTED_NETWORKS[currentNetworkId];

  return (
    <header className="w-full border-b border-white/5 bg-obsidian-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center shadow-glow-emerald">
            <ShieldCheck className="w-6 h-6 text-obsidian-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">AETHERIS</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Non-Custodial Multi-Chain</p>
          </div>
        </div>

        {/* Network Segmented Slider */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <NetworkSlider
            currentNetworkId={currentNetworkId}
            onSelectNetwork={onSelectNetwork}
          />
        </div>

        {/* Wallet Session Indicator */}
        <div className="flex items-center gap-3">
          {hasVault ? (
            isUnlocked ? (
              <div className="flex items-center gap-2">
                {currentAddress && (
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-mono text-slate-300">
                      {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
                    </span>
                    <span className="text-[10px] text-brand-emerald flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                      Session Unlocked
                    </span>
                  </div>
                )}
                <button
                  onClick={onLockWallet}
                  title="Lock Wallet Session"
                  className="p-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
                >
                  <Lock className="w-4 h-4 text-brand-emerald" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-800 border border-white/10 text-slate-400 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Vault Locked</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
              <Wallet className="w-3.5 h-3.5" />
              <span>No Vault</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Network Slider Row */}
      <div className="md:hidden px-4 pb-3">
        <NetworkSlider
          currentNetworkId={currentNetworkId}
          onSelectNetwork={onSelectNetwork}
        />
      </div>
    </header>
  );
};
