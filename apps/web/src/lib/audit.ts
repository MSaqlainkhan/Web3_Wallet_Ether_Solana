import { AuditRecord, AuditConfig, auditConfig } from '@aetheris/common/config/audit';
import { NetworkConfig } from '@aetheris/common/types/network';

export function isRecordComplete(r: AuditRecord): boolean {
  if (!r.completed) return false;
  if (!r.auditor.trim()) return false;
  try {
    const url = new URL(r.reportUrl);
    if (url.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  if (!r.completedAt) return false;
  const date = Date.parse(r.completedAt);
  if (isNaN(date)) return false;
  if (date > Date.now()) return false;
  return true;
}

export function isAuditComplete(config: AuditConfig = auditConfig): boolean {
  return isRecordComplete(config.penetrationTest) && isRecordComplete(config.formalVerification);
}

export const isDevOverrideActive = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ALLOW_UNAUDITED_MAINNET === 'true';

export const isMainnetAllowed = () => isAuditComplete() || isDevOverrideActive();

export function isMainnet(network: NetworkConfig): boolean {
  return !network.isTestnet;
}

export interface CanTransactResult {
  allowed: boolean;
  reason?: string;
}

export function canTransactOn(network: NetworkConfig, config?: AuditConfig): CanTransactResult {
  if (!isMainnet(network)) {
    return { allowed: true };
  }
  const cfg = config ?? auditConfig;
  if (isAuditComplete(cfg) || isDevOverrideActive()) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: 'Mainnet transactions are disabled until the external security audit is completed.',
  };
}

export class MainnetBlockedError extends Error {
  constructor(message: string = 'Mainnet transactions are disabled until the external security audit is completed.') {
    super(message);
    this.name = 'MainnetBlockedError';
  }
}