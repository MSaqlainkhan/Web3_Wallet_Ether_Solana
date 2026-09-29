'use client';

import React, { useState } from 'react';
import { SUPPORTED_NETWORKS, NetworkConfig } from '@aetheris/common';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface NetworkSliderProps {
  currentNetworkId: string;
  onSelectNetwork: (networkId: string) => void;
}

export const NetworkSlider: React.FC<NetworkSliderProps> = ({
  currentNetworkId,
  onSelectNetwork,
}) => {
  const [showMainnetModal, setShowMainnetModal] = useState(false);
  const [pendingNetworkId, setPendingNetworkId] = useState<string | null>(null);

  const networksList = [
    SUPPORTED_NETWORKS['ethereum-sepolia'],
    SUPPORTED_NETWORKS['solana-devnet'],
    SUPPORTED_NETWORKS['ethereum-mainnet'],
    SUPPORTED_NETWORKS['solana-mainnet'],
  ];

  const handleNetworkClick = (network: NetworkConfig) => {
    if (!network.isTestnet) {
      // Mainnet safeguard: trigger conscious opt-in modal
      setPendingNetworkId(network.id);
      setShowMainnetModal(true);
    } else {
      onSelectNetwork(network.id);
    }
  };

  const confirmMainnetSwitch = () => {
    if (pendingNetworkId) {
      onSelectNetwork(pendingNetworkId);
      setPendingNetworkId(null);
      setShowMainnetModal(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Segmented Slider Track */}
      <div className="relative flex items-center p-1.5 rounded-full bg-obsidian-950 border border-white/10 shadow-inner w-full max-w-xl">
        {networksList.map((network) => {
          const isActive = network.id === currentNetworkId;
          const isTestnet = network.isTestnet;

          return (
            <button
              key={network.id}
              onClick={() => handleNetworkClick(network)}
              className={`relative flex-1 py-2 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isActive
                  ? isTestnet
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                    : 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/40 shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTestnet
                    ? isActive
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-amber-500/60'
                    : isActive
                    ? 'bg-brand-emerald'
                    : 'bg-slate-600'
                }`}
              />
              <span className="truncate">{network.shortName}</span>
              {isTestnet && (
                <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  TEST
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mainnet Conscious Opt-In Modal */}
      {showMainnetModal && pendingNetworkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-obsidian-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-7 h-7 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-white">
                Mainnet Activation Warning
              </h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              You are switching to{' '}
              <span className="font-semibold text-white">
                {SUPPORTED_NETWORKS[pendingNetworkId]?.name}
              </span>
              . Real cryptocurrencies and irreversible mainnet transactions will be utilized.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Security Notice:</strong> While this wallet uses client-side WebCrypto encryption and never exposes private keys, non-custodial software should undergo an external security audit before safeguarding high-value mainnet funds.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowMainnetModal(false);
                  setPendingNetworkId(null);
                }}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                Stay on Testnet
              </button>
              <button
                onClick={confirmMainnetSwitch}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg transition flex items-center gap-1.5"
              >
                <span>Switch to Mainnet</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
