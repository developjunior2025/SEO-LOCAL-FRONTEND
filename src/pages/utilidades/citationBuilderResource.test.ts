import { describe, expect, it } from 'vitest';
import {
  citationQaPresentation,
  isLivePublicationStatus,
  isLocalLabResourceUrl,
} from './citationBuilderResource';

describe('Citation Builder V24.3 resource policy', () => {
  it('detecta recursos Local Lab que deben abrir preview interno', () => {
    expect(isLocalLabResourceUrl('https://evidence.local-lab.test/citation/1')).toBe(true);
    expect(isLocalLabResourceUrl('https://directory.local-lab.test/demo')).toBe(true);
    expect(isLocalLabResourceUrl('https://example.com/listing')).toBe(false);
  });

  it('diferencia QA no iniciado de QA pendiente', () => {
    expect(citationQaPresentation('preparing', {}).label).toBe('QA no iniciado');
    expect(citationQaPresentation('live', {}).label).toBe('QA pendiente');
  });

  it('mantiene QA aprobado y con incidencia', () => {
    expect(citationQaPresentation('live', { name: true, phone: true }).code).toBe('approved');
    expect(citationQaPresentation('live', { name: true, phone: false }).code).toBe('review');
    expect(isLivePublicationStatus('updated')).toBe(true);
  });
});
