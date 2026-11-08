import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityChecklistCard } from '../SecurityChecklistCard';

describe('SecurityChecklistCard - audit incomplete', () => {
  it('shows REQUIRED PRE-MAINNET and the two-row checklist', () => {
    render(<SecurityChecklistCard />);
    expect(screen.getByText('REQUIRED PRE-MAINNET')).toBeInTheDocument();
    expect(screen.getByText('Penetration testing')).toBeInTheDocument();
    expect(screen.getByText('Formal verification')).toBeInTheDocument();
    expect(screen.queryByText('IMPLEMENTED')).not.toBeInTheDocument();
    expect(screen.queryByText('View report')).not.toBeInTheDocument();
    expect(screen.queryByText('Trail of Bits')).not.toBeInTheDocument();
  });
});
