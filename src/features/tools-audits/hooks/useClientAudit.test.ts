import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClientAudit } from './useClientAudit';
import * as clientAuditApi from '../services/clientAuditApi';
import { clientAuditDemoData } from '../data/clientAuditDemoData';
import { ApiError } from '@/lib/apiConfig';

beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_DEMO_DATA', 'false');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useClientAudit', () => {
  it('carga auditoría real y expone datos', async () => {
    vi.spyOn(clientAuditApi, 'fetchClientAudit').mockResolvedValue(clientAuditDemoData);

    const { result } = renderHook(() => useClientAudit());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data?.project.name).toBe(clientAuditDemoData.project.name);
  });

  it('muestra error cuando la carga falla', async () => {
    vi.spyOn(clientAuditApi, 'fetchClientAudit').mockRejectedValue(
      new ApiError('No se pudo conectar con el servidor.', 'network')
    );

    const { result } = renderHook(() => useClientAudit());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain('No se pudo conectar');
    expect(result.current.data).toBeNull();
  });
});
