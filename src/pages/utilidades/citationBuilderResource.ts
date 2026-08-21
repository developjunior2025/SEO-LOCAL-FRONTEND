export type CitationQaPresentation = {
  code: 'not_started' | 'pending' | 'approved' | 'review';
  label: string;
  score: string;
};

export function isLocalLabResourceUrl(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host === 'local-lab.test' || host.endsWith('.local-lab.test');
  } catch {
    return false;
  }
}

export function isLivePublicationStatus(value: unknown) {
  return ['live', 'updated'].includes(String(value ?? ''));
}

export function citationQaPresentation(status: unknown, checksValue: unknown): CitationQaPresentation {
  const checks = checksValue && typeof checksValue === 'object' && !Array.isArray(checksValue)
    ? checksValue as Record<string, unknown>
    : {};
  const values = Object.values(checks);
  if (!values.length) {
    if (!isLivePublicationStatus(status)) {
      return { code: 'not_started', label: 'QA no iniciado', score: 'No aplica todavía' };
    }
    return { code: 'pending', label: 'QA pendiente', score: 'Pendiente' };
  }
  const correct = values.filter(Boolean).length;
  const passed = correct === values.length;
  return {
    code: passed ? 'approved' : 'review',
    label: passed ? 'QA aprobado' : 'QA con incidencia',
    score: `${correct}/${values.length}${passed ? ' correcto' : ' revisar'}`,
  };
}
