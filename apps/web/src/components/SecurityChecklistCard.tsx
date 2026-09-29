'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, EyeOff, Cpu, ExternalLink } from 'lucide-react';

export const SecurityChecklistCard: React.FC = () => {
  const auditPoints = [
    {
      title: 'Client-Side Key Boundary',
      desc: 'BIP-39 seeds and raw private keys are derived exclusively in the client browser. No telemetry or server endpoint ever receives or logs private keys.',
      status: 'Implemented',
      icon: EyeOff,
    },
    {
      title: 'AES-GCM WebCrypto Encryption at Rest',
      desc: 'Encrypted using browser window.crypto.subtle with PBKDF2 (100,000 iterations SHA-256) and a 12-byte random IV. Passphrase protects the local vault.',
      status: 'Implemented',
      icon: Lock,
    },
    {
      title: 'Mandatory Pre-Flight Simulation',
      desc: 'Transactions simulate execution (eth_call / simulateTransaction) to prevent unexpected reverts or wasted gas before requesting final confirmation.',
      status: 'Implemented',
      icon: Cpu,
    },
    {
      title: 'External Security Audit Requirement',
      desc: 'Before handling real user mainnet assets, independent penetration testing and formal verification (Trail of Bits / OpenZeppelin) must be conducted.',
      status: 'Required Pre-Mainnet',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-card-subtle">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-brand-emerald" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Security & Audit Status</h3>
          <p className="text-xs text-slate-400">Formal verification boundaries & threat model</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {auditPoints.map((pt, idx) => {
          const Icon = pt.icon;
          const isPendingAudit = pt.status.includes('Pre-Mainnet');

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition space-y-2 ${
                isPendingAudit
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-obsidian-950 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isPendingAudit ? 'text-amber-400' : 'text-brand-emerald'
                    }`}
                  />
                  <span className="text-xs font-bold text-white">{pt.title}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                    isPendingAudit
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                  }`}
                >
                  {pt.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{pt.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
