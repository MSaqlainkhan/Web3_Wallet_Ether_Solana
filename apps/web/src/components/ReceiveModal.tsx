'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SUPPORTED_NETWORKS } from '@aetheris/common';
import { X, Copy, Check, Download, AlertTriangle } from 'lucide-react';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNetworkId: string;
  address: string;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  isOpen,
  onClose,
  currentNetworkId,
  address,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const network = SUPPORTED_NETWORKS[currentNetworkId];
  const isEvm = network.family === 'evm';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-obsidian-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
              <Download className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Receive Funds</h3>
              <p className="text-xs text-slate-400">
                Network: <span className="font-semibold text-slate-200">{network.name}</span>
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

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner mx-auto max-w-[240px]">
          <QRCodeSVG value={address} size={190} level="M" />
        </div>

        {/* Public Address Display */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Your {network.shortName} Address
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian-950 border border-white/10 text-xs font-mono text-slate-200">
            <span className="break-all mr-2">{address}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition flex-shrink-0"
              title="Copy Address"
            >
              {copied ? <Check className="w-4 h-4 text-brand-emerald" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Network Mismatch Warning */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Only send <strong>{isEvm ? 'EVM / Ethereum tokens' : 'Solana (SOL & SPL tokens)'}</strong> to this address on the <strong>{network.name}</strong> network. Sending assets from incompatible chains will result in permanent loss.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-white font-medium text-xs border border-white/10 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
