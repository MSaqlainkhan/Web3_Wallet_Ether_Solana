'use client';

import React from 'react';
import { SUPPORTED_NETWORKS } from '@aetheris/common';
import { AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

interface TestnetBannerProps {
  currentNetworkId: string;
}

export const TestnetBanner: React.FC<TestnetBannerProps> = ({ currentNetworkId }) => {
  const network = SUPPORTED_NETWORKS[currentNetworkId];
  if (!network || !network.isTestnet) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="tracking-wide uppercase font-semibold text-amber-300">
            {network.name} Active
          </span>
          <span className="hidden sm:inline text-amber-300/70">—</span>
          <span className="hidden sm:inline text-amber-300/80">
            Testnet mode enabled. All assets are valueless testnet tokens.
          </span>
        </div>

        {network.faucetUrl && (
          <a
            href={network.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-full border border-amber-500/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get Testnet {network.nativeCurrency.symbol}</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>
        )}
      </div>
    </div>
  );
};
