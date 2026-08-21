import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuditTimeline from './AuditTimeline';

const snapshots = [
  { label: 'Ene 2026', health: '62', cvl: '54', nap: '81', response: '14h', cpl: '$28' },
  { label: 'Jul 2026', health: '78', cvl: '72', nap: '94', response: '6h', cpl: '$18' },
];

describe('AuditTimeline', () => {
  it('muestra estado seguro cuando no existen snapshots', () => {
    render(<AuditTimeline snapshots={[]} />);
    expect(screen.getByTestId('audit-timeline-empty')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay snapshots históricos.')).toBeInTheDocument();
  });

  it('muestra el snapshot más reciente cuando existen datos', () => {
    render(<AuditTimeline snapshots={snapshots} />);
    expect(screen.getByTestId('audit-timeline')).toBeInTheDocument();
    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });
});
