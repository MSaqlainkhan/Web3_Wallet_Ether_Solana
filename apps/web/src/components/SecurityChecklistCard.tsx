'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Lock, EyeOff, Cpu, ExternalLink, Circle, Check } from 'lucide-react';
import { auditConfig } from '@aetheris/common';
import { isRecordComplete, isAuditComplete } from '@/lib/audit';

interface AuditCardProps {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'Implemented' | 'Required Pre-Mainnet';
  isAuditItem: boolean;
  showComplete: boolean;
  penTestComplete: boolean;
  formalVerifyComplete: boolean;
  auditorName?: string;
  formalAuditorName?: string;
  reportUrl?: string;
  completedAt?: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const AuditCard: React.FC<AuditCardProps> = ({
  title,
  desc,
  icon: Icon,
  status,
  isAuditItem,
  showComplete,
  penTestComplete,
  formalVerifyComplete,
  auditorName,
  formalAuditorName,
  reportUrl,
  completedAt,
}) => {
  const badgeText = isAuditItem ? (showComplete ? 'IMPLEMENTED' : 'REQUIRED PRE-MAINNET') : status;
  const badgeClass = isAuditItem
    ? showComplete
      ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
    : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20';
  const cardClass = isAuditItem
    ? showComplete
      ? 'bg-obsidian-950 border-white/5'
      : 'bg-amber-500/5 border-amber-500/20'
    : 'bg-obsidian-950 border-white/5';
  const iconColor = isAuditItem
    ? showComplete
      ? 'text-brand-emerald'
      : 'text-amber-400'
    : 'text-brand-emerald';

  return (
    <div
      className={`flex flex-col h-full min-w-0 overflow-hidden rounded-2xl p-4 border transition ${cardClass}`}
    >
      {/* Row 1: icon + title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-obsidian-900/50">
          <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
        </div>
        <span className="min-w-0 break-normal text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere]">{title}</span>
      </div>

      {/* Row 2: badge on its own line */}
      <div className="mt-2 flex items-center justify-start">
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide font-semibold border ${badgeClass}`}
          aria-label={`${title} status: ${badgeText}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs leading-relaxed text-slate-400">{desc}</p>

      {/* Audit-specific content */}
      {isAuditItem && (
        <>
          {!showComplete && (
            <div className="mt-3 space-y-2" role="list" aria-label="Audit requirements checklist">
              <div className="flex items-center gap-2 text-xs text-slate-300" role="listitem">
                <div
                  className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    penTestComplete
                      ? 'border-brand-emerald bg-brand-emerald'
                      : 'border-amber-500'
                  }`}
                  aria-label={penTestComplete ? 'Penetration testing completed' : 'Penetration testing pending'}
                >
                  {penTestComplete && <Check className="h-2.5 w-2.5 text-obsidian-950" aria-hidden="true" />}
                </div>
                <span>Penetration testing</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300" role="listitem">
                <div
                  className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    formalVerifyComplete
                      ? 'border-brand-emerald bg-brand-emerald'
                      : 'border-amber-500'
                  }`}
                  aria-label={formalVerifyComplete ? 'Formal verification completed' : 'Formal verification pending'}
                >
                  {formalVerifyComplete && <Check className="h-2.5 w-2.5 text-obsidian-950" aria-hidden="true" />}
                </div>
                <span>Formal verification</span>
              </div>
            </div>
          )}
          {showComplete && auditorName && reportUrl && completedAt && (
            <div className="mt-3 space-y-2 text-xs text-slate-300" role="list" aria-label="Audit completion details">
              <div className="flex items-center gap-2" role="listitem">
                <span className="text-slate-400">Penetration testing:</span>
                <span className="font-medium">{auditorName}</span>
                <span className="text-slate-400">—</span>
                <time dateTime={completedAt}>{formatDate(completedAt)}</time>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-emerald hover:underline text-[10px] font-mono"
                  aria-label="View penetration test report"
                >
                  View report
                </a>
              </div>
              <div className="flex items-center gap-2" role="listitem">
                <span className="text-slate-400">Formal verification:</span>
                <span className="font-medium">{formalAuditorName ?? auditorName}</span>
                <span className="text-slate-400">—</span>
                <time dateTime={completedAt}>{formatDate(completedAt)}</time>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-emerald hover:underline text-[10px] font-mono"
                  aria-label="View formal verification report"
                >
                  View report
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const auditPoints = [
  {
    title: 'Client-Side Key Boundary',
    desc: 'BIP-39 seeds and raw private keys are derived exclusively in the client browser. No telemetry or server endpoint ever receives or logs private keys.',
    status: 'Implemented' as const,
    icon: EyeOff,
    isAuditItem: false,
  },
  {
    title: 'AES-GCM WebCrypto Encryption at Rest',
    desc: 'Encrypted using browser window.crypto.subtle with PBKDF2 (100,000 iterations SHA-256) and a 12-byte random IV. Passphrase protects the local vault.',
    status: 'Implemented' as const,
    icon: Lock,
    isAuditItem: false,
  },
  {
    title: 'Mandatory Pre-Flight Simulation',
    desc: 'Transactions simulate execution (eth_call / simulateTransaction) to prevent unexpected reverts or wasted gas before requesting final confirmation.',
    status: 'Implemented' as const,
    icon: Cpu,
    isAuditItem: false,
  },
  {
    title: 'External Security Audit Requirement',
    desc: 'Before handling real user mainnet assets, independent penetration testing and formal verification (Trail of Bits / OpenZeppelin) must be conducted.',
    status: 'Required Pre-Mainnet' as const,
    icon: ShieldAlert,
    isAuditItem: true,
  },
] as const;

export const SecurityChecklistCard: React.FC = () => {
  const auditComplete = isAuditComplete();
  const penTestComplete = isRecordComplete(auditConfig.penetrationTest);
  const formalVerifyComplete = isRecordComplete(auditConfig.formalVerification);

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6 border border-white/10 shadow-card-subtle min-w-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-brand-emerald" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Security & Audit Status</h3>
          <p className="text-xs text-slate-400">Formal verification boundaries & threat model</p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4 auto-rows-fr">
        {auditPoints.map((pt, idx) => {
          const showComplete = pt.isAuditItem ? auditComplete : true;

          return (
            <AuditCard
              key={idx}
              title={pt.title}
              desc={pt.desc}
              icon={pt.icon}
              status={pt.status}
              isAuditItem={pt.isAuditItem}
              showComplete={showComplete}
              penTestComplete={penTestComplete}
              formalVerifyComplete={formalVerifyComplete}
              auditorName={pt.isAuditItem ? auditConfig.penetrationTest.auditor : undefined}
              formalAuditorName={pt.isAuditItem ? auditConfig.formalVerification.auditor : undefined}
              reportUrl={pt.isAuditItem ? auditConfig.penetrationTest.reportUrl : undefined}
              completedAt={pt.isAuditItem ? auditConfig.penetrationTest.completedAt : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};