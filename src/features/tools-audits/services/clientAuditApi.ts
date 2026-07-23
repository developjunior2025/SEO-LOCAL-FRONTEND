import { apiFetch, isDemoDataEnabled } from '@/lib/apiConfig';
import type { ClientAuditData } from '../types/audit';
import { clientAuditDemoData } from '../data/clientAuditDemoData';

export interface ClientAuditApiState {
  data: ClientAuditData | null;
  loading: boolean;
  error: string | null;
}

export async function fetchClientAudit(signal?: AbortSignal): Promise<ClientAuditData> {
  if (isDemoDataEnabled()) {
    return clientAuditDemoData;
  }
  return apiFetch<ClientAuditData>('/client/audits/current', {}, { signal });
}
