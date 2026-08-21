import { describe, expect, it } from 'vitest';
import { normalizeClientAuditData } from './clientAuditApi';

const partialPayload = {
  project: { name: 'Cliente SEOLOCAL' },
  summary: { health: 0 },
  timeline: { snapshots: [] },
};

describe('normalizeClientAuditData', () => {
  it('completa la estructura cuando el backend devuelve un payload parcial', () => {
    const data = normalizeClientAuditData(partialPayload);

    expect(data.project.name).toBe('Cliente SEOLOCAL');
    expect(data.summary.health).toBe(0);
    expect(data.timeline.snapshots).toEqual([]);
    expect(data.rankings.kpis).toEqual([]);
    expect(data.listings.directories).toEqual([]);
    expect(data.files.deliverables).toEqual([]);
  });

  it('tolera payload indefinido sin dejar ramas undefined', () => {
    const data = normalizeClientAuditData(undefined);

    expect(data.project.name).toBe('Proyecto SEO Local');
    expect(data.timeline.snapshots).toEqual([]);
    expect(data.evidence.chain).toEqual([]);
    expect(data.actions).toEqual([]);
  });
});
