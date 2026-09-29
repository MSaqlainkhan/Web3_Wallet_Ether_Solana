'use client';

import React, { useState } from 'react';
import { SUPPORTED_NETWORKS } from '@aetheris/common';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  CreditCard,
  Building2,
  AlertTriangle,
  Copy,
  Check,
  ArrowUpRight,
  ShieldAlert,
  ArrowDownLeft,
} from 'lucide-react';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'deposit' | 'withdraw';
  currentNetworkId: string;
  address: string;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'deposit',
  currentNetworkId,
  address,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [fiatProvider, setFiatProvider] = useState<'moonpay' | 'transak'>('moonpay');

  if (!isOpen) return null;

  const network = SUPPORTED_NETWORKS[currentNetworkId];

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-obsidian-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex bg-obsidian-950 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'deposit'
                  ? 'bg-brand-emerald text-obsidian-950 shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Deposit / On-Ramp</span>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'withdraw'
                  ? 'bg-brand-cyan text-obsidian-950 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw / Off-Ramp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMPLIANCE & LEGAL NOTICE CALLOUT */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Compliance & Licensing Notice</span>
          </div>
          <p className="text-amber-300/80 leading-relaxed">
            Fiat on/off-ramps require regulated third-party money transmitter licenses (MTL) and mandatory automated KYC/AML verification. Aetheris provides direct SDK connection hooks for licensed providers (MoonPay, Transak).
          </p>
        </div>

        {/* DEPOSIT TAB */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            {/* Direct Crypto Deposit */}
            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Option 1: Direct Crypto Deposit (Address & QR)
              </span>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="p-2 bg-white rounded-xl flex-shrink-0">
                  <QRCodeSVG value={address} size={96} level="M" />
                </div>
                <div className="space-y-1 text-xs w-full">
                  <span className="text-slate-400">Receive on {network.name}:</span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-obsidian-900 border border-white/5 font-mono text-slate-200">
                    <span className="break-all text-[11px] mr-2">{address}</span>
                    <button onClick={handleCopy} className="text-slate-400 hover:text-white p-1">
                      {copied ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fiat On-Ramp Partner Provider */}
            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Option 2: Buy with Card / Bank (Fiat On-Ramp)
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Sandbox Staged
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFiatProvider('moonpay')}
                  className={`p-3 rounded-xl border text-left transition ${
                    fiatProvider === 'moonpay'
                      ? 'border-brand-emerald/40 bg-brand-emerald/10'
                      : 'border-white/5 bg-obsidian-900'
                  }`}
                >
                  <div className="font-bold text-xs text-white">MoonPay</div>
                  <div className="text-[11px] text-slate-400">Card, Apple Pay, SEPA</div>
                </button>

                <button
                  onClick={() => setFiatProvider('transak')}
                  className={`p-3 rounded-xl border text-left transition ${
                    fiatProvider === 'transak'
                      ? 'border-brand-emerald/40 bg-brand-emerald/10'
                      : 'border-white/5 bg-obsidian-900'
                  }`}
                >
                  <div className="font-bold text-xs text-white">Transak</div>
                  <div className="text-[11px] text-slate-400">Global bank transfer</div>
                </button>
              </div>

              <button
                onClick={() => {
                  alert(
                    `[Sandbox Mode] Launching ${fiatProvider.toUpperCase()} On-Ramp Widget for address: ${address} on ${network.name}.\n\n(Production deployment requires verified Partner API Key in .env)`
                  );
                }}
                className="w-full py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 transition"
              >
                <CreditCard className="w-4 h-4 text-brand-emerald" />
                <span>Launch {fiatProvider.toUpperCase()} Sandbox Portal</span>
              </button>
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Option 1: Transfer to External Wallet or Exchange
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                To withdraw your crypto funds to an external exchange (Coinbase, Binance, Kraken) or personal hardware wallet, use the standard Send flow.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-obsidian-950 font-bold text-xs shadow-glow-cyan transition flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Open Standard Send Screen</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-obsidian-950 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Option 2: Fiat Off-Ramp to Bank Account
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Sandbox Staged
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sell crypto directly for USD, EUR, or GBP wired to your bank account via licensed off-ramp aggregators.
              </p>
              <button
                onClick={() => {
                  alert(
                    `[Sandbox Mode] Launching Fiat Off-Ramp Portal.\n\n(Production requires licensed provider compliance integration)`
                  );
                }}
                className="w-full py-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 transition"
              >
                <Building2 className="w-4 h-4 text-brand-cyan" />
                <span>Launch Bank Off-Ramp Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
