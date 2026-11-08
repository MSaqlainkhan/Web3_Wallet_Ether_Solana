import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityChecklistCard } from '../SecurityChecklistCard';

vi.mock('@aetheris/common/config/audit', () => ({
  auditConfig: {
    penetrationTest: {
      completed: true,
      auditor: 'Trail of Bits',
      reportUrl: 'https://example.com/pen-test.pdf',
      completedAt: '2026-01-01',
    },
    formalVerification: {
      completed: true,
      auditor: 'OpenZeppelin',
      reportUrl: 'https://example.com/formal-verification.pdf',
      completedAt: '2026-02-01',
    },
  },
}));

vi.mock('@aetheris/common', async (importActual) => {
  const actual = await importActual<typeof import('@aetheris/common')>();
  return {
    ...actual,
    auditConfig: {
      penetrationTest: {
        completed: true,
        auditor: 'Trail of Bits',
        reportUrl: 'https://example.com/pen-test.pdf',
        completedAt: '2026-01-01',
      },
      formalVerification: {
        completed: true,
        auditor: 'OpenZeppelin',
        reportUrl: 'https://example.com/formal-verification.pdf',
        completedAt: '2026-02-01',
      },
    },
  };
});

describe('SecurityChecklistCard - audit complete', () => {
  it('shows IMPLEMENTED with auditor names and View report links', () => {
    render(<SecurityChecklistCard />);
    expect(screen.getByText('IMPLEMENTED')).toBeInTheDocument();
    expect(screen.getByText('Trail of Bits')).toBeInTheDocument();
    expect(screen.getByText('OpenZeppelin')).toBeInTheDocument();
    expect(screen.getAllByText('View report')).toHaveLength(2);
    expect(screen.queryByText('REQUIRED PRE-MAINNET')).not.toBeInTheDocument();
  });

  it('renders each title horizontally, never one letter per line', () => {
    render(<SecurityChecklistCard />);
    const titles = ['Client-Side Key Boundary', 'AES-GCM WebCrypto Encryption at Rest', 'Mandatory Pre-Flight Simulation', 'External Security Audit Requirement'];
    for (const title of titles) {
      const el = screen.getByText(title);
      expect(el.className).toContain('break-normal');
      expect(el.className).not.toContain('break-all');
      expect(el.className).not.toContain('break-words');
      expect(el.className).toContain('[overflow-wrap:anywhere]');
    }
  });
});
