export interface AuditRecord {
  completed: boolean;
  auditor: string;
  reportUrl: string;
  completedAt: string;
}

export interface AuditConfig {
  penetrationTest: AuditRecord;
  formalVerification: AuditRecord;
}

export const auditConfig: AuditConfig = {
  penetrationTest: { completed: false, auditor: '', reportUrl: '', completedAt: '' },
  formalVerification: { completed: false, auditor: '', reportUrl: '', completedAt: '' },
};