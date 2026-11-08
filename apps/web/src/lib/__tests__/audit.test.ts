import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isRecordComplete,
  isAuditComplete,
  isMainnet,
  canTransactOn,
  MainnetBlockedError,
} from '../audit';
import { SUPPORTED_NETWORKS } from '@aetheris/common';

describe('Audit Logic', () => {
  const mockIncompleteConfig = {
    penetrationTest: { completed: false, auditor: '', reportUrl: '', completedAt: '' },
    formalVerification: { completed: false, auditor: '', reportUrl: '', completedAt: '' },
  };

  const mockOneCompleteConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'https://example.com/report.pdf', completedAt: '2026-01-01' },
    formalVerification: { completed: false, auditor: '', reportUrl: '', completedAt: '' },
  };

  const mockBothCompleteConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'https://example.com/pen-test.pdf', completedAt: '2026-01-01' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  const mockEmptyAuditorConfig = {
    penetrationTest: { completed: true, auditor: '', reportUrl: 'https://example.com/report.pdf', completedAt: '2026-01-01' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  const mockInvalidUrlConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'not-a-url', completedAt: '2026-01-01' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  const mockHttpUrlConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'http://example.com/report.pdf', completedAt: '2026-01-01' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  const mockInvalidDateConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'https://example.com/report.pdf', completedAt: 'invalid-date' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  const mockFutureDateConfig = {
    penetrationTest: { completed: true, auditor: 'Trail of Bits', reportUrl: 'https://example.com/report.pdf', completedAt: '2099-01-01' },
    formalVerification: { completed: true, auditor: 'OpenZeppelin', reportUrl: 'https://example.com/formal-verification.pdf', completedAt: '2026-02-01' },
  };

  describe('isRecordComplete', () => {
    it('returns false for incomplete record', () => {
      expect(isRecordComplete(mockIncompleteConfig.penetrationTest)).toBe(false);
    });

    it('returns false when completed is true but auditor is empty', () => {
      expect(isRecordComplete(mockEmptyAuditorConfig.penetrationTest)).toBe(false);
    });

    it('returns false when URL is invalid', () => {
      expect(isRecordComplete(mockInvalidUrlConfig.penetrationTest)).toBe(false);
    });

    it('returns false when URL uses http protocol', () => {
      expect(isRecordComplete(mockHttpUrlConfig.penetrationTest)).toBe(false);
    });

    it('returns false when date is invalid', () => {
      expect(isRecordComplete(mockInvalidDateConfig.penetrationTest)).toBe(false);
    });

    it('returns false when date is in the future', () => {
      expect(isRecordComplete(mockFutureDateConfig.penetrationTest)).toBe(false);
    });

    it('returns true for complete valid record', () => {
      expect(isRecordComplete(mockBothCompleteConfig.penetrationTest)).toBe(true);
      expect(isRecordComplete(mockBothCompleteConfig.formalVerification)).toBe(true);
    });
  });

  describe('isAuditComplete', () => {
    it('returns false when both records are incomplete', () => {
      expect(isAuditComplete(mockIncompleteConfig)).toBe(false);
    });

    it('returns false when only one record is complete', () => {
      expect(isAuditComplete(mockOneCompleteConfig)).toBe(false);
    });

    it('returns true when both records are complete', () => {
      expect(isAuditComplete(mockBothCompleteConfig)).toBe(true);
    });
  });

  describe('isMainnet', () => {
    it('returns true for Ethereum Mainnet', () => {
      expect(isMainnet(SUPPORTED_NETWORKS['ethereum-mainnet'])).toBe(true);
    });

    it('returns true for Solana Mainnet', () => {
      expect(isMainnet(SUPPORTED_NETWORKS['solana-mainnet'])).toBe(true);
    });

    it('returns false for Sepolia', () => {
      expect(isMainnet(SUPPORTED_NETWORKS['ethereum-sepolia'])).toBe(false);
    });

    it('returns false for Devnet', () => {
      expect(isMainnet(SUPPORTED_NETWORKS['solana-devnet'])).toBe(false);
    });
  });

  describe('canTransactOn', () => {
    it('allows testnets regardless of audit status', () => {
      expect(canTransactOn(SUPPORTED_NETWORKS['ethereum-sepolia'], mockIncompleteConfig).allowed).toBe(true);
      expect(canTransactOn(SUPPORTED_NETWORKS['solana-devnet'], mockIncompleteConfig).allowed).toBe(true);
    });

    it('blocks mainnets when audit incomplete', () => {
      const result = canTransactOn(SUPPORTED_NETWORKS['ethereum-mainnet'], mockIncompleteConfig);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Mainnet transactions are disabled until the external security audit is completed.');

      const solResult = canTransactOn(SUPPORTED_NETWORKS['solana-mainnet'], mockIncompleteConfig);
      expect(solResult.allowed).toBe(false);
      expect(solResult.reason).toBe('Mainnet transactions are disabled until the external security audit is completed.');
    });

    it('allows mainnets when audit complete', () => {
      expect(canTransactOn(SUPPORTED_NETWORKS['ethereum-mainnet'], mockBothCompleteConfig).allowed).toBe(true);
      expect(canTransactOn(SUPPORTED_NETWORKS['solana-mainnet'], mockBothCompleteConfig).allowed).toBe(true);
    });

    it('uses default config when none provided', () => {
      // Default config has both incomplete
      expect(canTransactOn(SUPPORTED_NETWORKS['ethereum-mainnet']).allowed).toBe(false);
      expect(canTransactOn(SUPPORTED_NETWORKS['ethereum-sepolia']).allowed).toBe(true);
    });
  });

  describe('MainnetBlockedError', () => {
    it('has correct name and message', () => {
      const error = new MainnetBlockedError();
      expect(error.name).toBe('MainnetBlockedError');
      expect(error.message).toBe('Mainnet transactions are disabled until the external security audit is completed.');
    });

    it('accepts custom message', () => {
      const error = new MainnetBlockedError('Custom message');
      expect(error.message).toBe('Custom message');
    });
  });
});