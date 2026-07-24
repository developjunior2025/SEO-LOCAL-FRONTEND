import type { ClientAuditData } from '../types/audit';

export const clientAuditDemoData: ClientAuditData = {
  project: {
    id: 'AUD-2026-1042',
    name: 'Clínica Dental Sonrisa',
    status: 'Activo',
    serviceLine: 'SEO Local + Google Ads',
    location: 'Barcelona',
    auditId: 'AUD-2026-1042',
    logoLetters: 'CD',
  },
  summary: {
    health: 72,
    healthDelta: 14,
    workVerified: 78,
    workDelta: 16,
    resultAchieved: 54,
    resultDelta: 13,
    dataConfidence: 93,
    confidenceLabel: 'Alta',
    roi: 3.4,
    roiLabel: 'Atribuido',
  },
  dimensions: [
    {
      key: 'visibility',
      label: 'Visibilidad',
      value: '32%',
      detail: 'Rendimiento por zona, keyword y competidor',
      detailKpis: [
        { label: 'CVL', value: '32%' },
        { label: 'Top 10', value: '61%' },
        { label: 'Posición', value: '12,4' },
        { label: 'Brecha', value: '−8 pp' },
      ],
      sourceKpis: [
        { label: 'Keyword', value: 'dentista cerca de mí' },
        { label: 'Zona ganada', value: 'Centro' },
        { label: 'Zona de riesgo', value: 'Oeste' },
        { label: 'Reauditoría', value: '18 jul' },
      ],
    },
    {
      key: 'presence',
      label: 'GBP y listings',
      value: '93%',
      detail: 'Integridad de presencia digital',
      detailKpis: [
        { label: 'Integridad', value: '93%' },
        { label: 'Listings', value: '47' },
        { label: 'Duplicados', value: '3' },
        { label: 'Acciones', value: '418' },
      ],
      sourceKpis: [
        { label: 'Google', value: 'Sincronizado' },
        { label: 'Apple', value: 'Pendiente' },
        { label: 'Bing', value: 'Duplicado' },
        { label: 'Yelp', value: 'Verificado' },
      ],
    },
    {
      key: 'reputation',
      label: 'Reputación',
      value: '4,6 ★',
      detail: 'Rating, volumen, respuesta y temas',
      detailKpis: [
        { label: 'Rating', value: '4,6' },
        { label: 'Reseñas', value: '284' },
        { label: 'Respuesta', value: '88%' },
        { label: 'Tiempo', value: '17 h' },
      ],
      sourceKpis: [
        { label: 'Positivo', value: '74%' },
        { label: 'Neutral', value: '18%' },
        { label: 'Negativo', value: '8%' },
        { label: 'Riesgo', value: 'Tiempo de espera' },
      ],
    },
    {
      key: 'site',
      label: 'SEO técnico',
      value: '84%',
      detail: 'Salud, indexación y autoridad',
      detailKpis: [
        { label: 'Salud', value: '84%' },
        { label: 'URLs', value: '1.284' },
        { label: 'Críticos', value: '3' },
        { label: 'Dominios', value: '146' },
      ],
      sourceKpis: [
        { label: 'Robots', value: '3 páginas' },
        { label: 'Alt text', value: '19 imágenes' },
        { label: 'Canibalización', value: '7 páginas' },
        { label: 'Links', value: '12 oportunidades' },
      ],
    },
    {
      key: 'ads',
      label: 'SEM',
      value: '4,1×',
      detail: 'Rendimiento publicitario',
      detailKpis: [
        { label: 'Inversión', value: '€3.780' },
        { label: 'Leads', value: '126' },
        { label: 'CPL', value: '€30' },
        { label: 'ROAS', value: '4,1×' },
      ],
      sourceKpis: [
        { label: 'Implantes', value: '5,2×' },
        { label: 'Urgencias', value: '4,4×' },
        { label: 'Ortodoncia', value: '2,8×' },
        { label: 'Negativas', value: '47 términos' },
      ],
    },
    {
      key: 'evidence',
      label: 'Evidencia',
      value: '78%',
      detail: 'Prueba, verificación y aprobación',
      detailKpis: [
        { label: 'Trabajo', value: '78%' },
        { label: 'Cadenas', value: '36' },
        { label: 'Archivos', value: '128' },
        { label: 'Aprobado', value: '11/14' },
      ],
      sourceKpis: [
        { label: 'GBP', value: '3 archivos' },
        { label: 'SEO', value: 'PR + crawler' },
        { label: 'Reputación', value: 'API GBP' },
        { label: 'NAP', value: '9 directorios' },
      ],
    },
    {
      key: 'method',
      label: 'Metodología',
      value: '100%',
      detail: 'Reglas de comparabilidad',
      detailKpis: [
        { label: 'Confianza', value: '93%' },
        { label: 'Comparabilidad', value: '100%' },
        { label: 'Fuentes', value: '6/7' },
        { label: 'Grid', value: '121' },
      ],
      sourceKpis: [
        { label: 'Centro', value: 'Mismo' },
        { label: 'Keywords', value: 'Mismas' },
        { label: 'Dispositivo', value: 'Móvil' },
        { label: 'Frecuencia', value: 'Semanal' },
      ],
    },
    {
      key: 'general',
      label: 'Salud general',
      value: '72/100',
      detail: 'Vista consolidada del proyecto',
      detailKpis: [
        { label: 'Salud', value: '72/100' },
        { label: 'Trabajo', value: '78%' },
        { label: 'Resultado', value: '54%' },
        { label: 'Confianza', value: '93%' },
      ],
      sourceKpis: [
        { label: 'Visibilidad', value: '68/100' },
        { label: 'GBP y listings', value: '92/100' },
        { label: 'Reputación', value: '79/100' },
        { label: 'SEO técnico', value: '84/100' },
      ],
    },
  ],
  compareRows: [
    { label: 'CVL Top 3', width: 52, value: '32%' },
    { label: 'NAP', width: 81, value: '93%' },
    { label: 'Respuesta', width: 86, value: '88%' },
    { label: 'CPL', width: 82, value: '€30' },
  ],
  sources: [
    { key: 'gbp', label: 'GBP', status: 'Conectado', updatedAt: 'Hace 2 h' },
    { key: 'ga4', label: 'GA4', status: 'Conectado', updatedAt: 'Hace 3 h' },
    { key: 'gsc', label: 'Search Console', status: 'Conectado', updatedAt: 'Hace 38 h' },
    { key: 'geogrid', label: 'GeoGrid', status: '121 puntos', updatedAt: '14 jul' },
  ],
  stories: [
    {
      key: 'work',
      step: 1,
      title: 'Qué se hizo',
      subtitle: '36 acciones y 128 evidencias.',
      detailTitle: 'Trabajo realizado y verificado',
      detailText: '36 acciones completadas, 128 evidencias registradas y 11 de 14 entregables aprobados.',
      stats: [
        { label: 'Trabajo', value: '78%' },
        { label: 'Aprobado', value: '11/14' },
      ],
    },
    {
      key: 'change',
      step: 2,
      title: 'Qué cambió',
      subtitle: 'CVL, NAP, reputación y CPL.',
      detailTitle: 'Cambios medidos',
      detailText: 'CVL +14 pp, NAP +22 pp, respuesta +42 pp y CPL −21,9%.',
      stats: [
        { label: 'CVL', value: '+14 pp' },
        { label: 'CPL', value: '−21,9%' },
      ],
    },
    {
      key: 'impact',
      step: 3,
      title: 'Qué produjo',
      subtitle: 'Leads, citas, clientes e ingresos.',
      detailTitle: 'Impacto comercial',
      detailText: '126 leads válidos, 79 citas, 48 clientes y €12.840 atribuidos.',
      stats: [
        { label: 'Leads', value: '126' },
        { label: 'ROI', value: '3,4×' },
      ],
    },
    {
      key: 'next',
      step: 4,
      title: 'Qué sigue',
      subtitle: 'Acciones de cliente y vendedor.',
      detailTitle: 'Próximas acciones',
      detailText: 'Dos acciones del cliente y cuatro del vendedor.',
      stats: [
        { label: 'Cliente', value: '2' },
        { label: 'Vendedor', value: '4' },
      ],
    },
  ],
  timeline: {
    points: [
      { label: 'SALUD', value: '72/100' },
      { label: 'CVL', value: '32%' },
      { label: 'NAP', value: '93%' },
      { label: 'RESPUESTA', value: '88%' },
      { label: 'CPL', value: '€30,00' },
    ],
    snapshots: [
      { label: '05 may · 58/100', health: '58/100', cvl: '18%', nap: '71%', response: '46%', cpl: '€38,40' },
      { label: '19 may · 61/100', health: '61/100', cvl: '21%', nap: '76%', response: '58%', cpl: '€36,90' },
      { label: '05 jun · 65/100', health: '65/100', cvl: '24%', nap: '82%', response: '69%', cpl: '€34,80' },
      { label: '28 jun · 69/100', health: '69/100', cvl: '28%', nap: '88%', response: '79%', cpl: '€32,20' },
      { label: '14 jul · 72/100', health: '72/100', cvl: '32%', nap: '93%', response: '88%', cpl: '€30,00' },
    ],
  },
  evidence: {
    chain: [
      { number: 1, phase: 'TRABAJO', title: 'Optimizar categorías GBP', description: 'Responsable, fecha y alcance.' },
      { number: 2, phase: 'EVIDENCIA', title: 'Antes y después', description: 'Capturas, archivos y versiones.' },
      { number: 3, phase: 'VERIFICACIÓN', title: 'Reescaneo comparable', description: 'Mismos parámetros y fuente.' },
      { number: 4, phase: 'CAMBIO', title: 'CVL +14 pp', description: '18% inicial → 32% actual.' },
      { number: 5, phase: 'RESULTADO', title: '+31 solicitudes', description: 'Confianza de atribución 86%.' },
    ],
    ledger: [
      { id: 'EV-036', action: 'Categorías GBP', evidence: '3 archivos', verification: 'GeoGrid', change: '+14 pp', status: 'Aprobado' },
      { id: 'EV-035', action: 'Schema LocalBusiness', evidence: 'PR + captura', verification: 'Crawler', change: '12 → 3 errores', status: 'Aprobado' },
      { id: 'EV-034', action: 'Respuestas de reseñas', evidence: 'API GBP', verification: 'Observación', change: '46% → 88%', status: 'Revisión' },
    ],
  },
  rankings: {
    kpis: [
      { label: 'CVL TOP 3', value: '32%', delta: '+14 pp', positive: true },
      { label: 'TOP 10', value: '61%', delta: '+19 pp', positive: true },
      { label: 'POSICIÓN DE RED', value: '12,4', delta: '−4,6', positive: true },
      { label: 'BRECHA LÍDER', value: '−8 pp', delta: 'Dental BCN', positive: false },
    ],
    geoKeyword: 'dentista cerca de mí',
    geoGridSize: '11 × 11 · 5 km',
    geoPoints: Array.from({ length: 121 }, (_, i) => {
      const seq = [5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 1, 2, 3, 4, 5, 0, 2, 3, 4, 1, 2, 3];
      const bucket = seq[(i * 5 + (i % 7)) % seq.length] as 0 | 1 | 2 | 3 | 4 | 5;
      let label = '–';
      if (bucket === 1) label = String(1 + (i % 3));
      else if (bucket === 2) label = String(4 + (i % 3));
      else if (bucket === 3) label = String(7 + (i % 4));
      else if (bucket === 4) label = String(11 + (i % 10));
      else if (bucket === 5) label = String(21 + (i % 20));
      return { rankBucket: bucket, label };
    }),
    competitors: [
      { name: 'Dental BCN', cvl: 40, tag: 'Líder' },
      { name: 'Clínica Sonrisa', cvl: 32, tag: 'Cliente' },
      { name: 'Sonríe Más', cvl: 27, tag: 'Emergente' },
      { name: 'Dental Plus', cvl: 18, tag: 'Estable' },
    ],
  },
  listings: {
    kpis: [
      { label: 'INTEGRIDAD', value: '93%', delta: '+22 pp', positive: true },
      { label: 'LISTINGS ACTIVOS', value: '47', delta: '9 corregidos', positive: true },
      { label: 'DUPLICADOS', value: '3', delta: '2 pendientes', positive: false },
      { label: 'ACCIONES GBP', value: '418', delta: '+29%', positive: true },
    ],
    directories: [
      { directory: 'Google Business Profile', nap: 'Correcto', hours: 'Correcto', category: 'Correcta', duplicate: 'No', status: 'Sincronizado' },
      { directory: 'Apple Business Connect', nap: 'Teléfono antiguo', hours: 'Correcto', category: 'Correcta', duplicate: 'No', status: 'En proceso' },
      { directory: 'Bing Places', nap: 'Correcto', hours: 'Antiguo', category: 'Correcta', duplicate: 'Sí', status: 'Conflicto' },
      { directory: 'Yelp', nap: 'Correcto', hours: 'Correcto', category: 'Correcta', duplicate: 'No', status: 'Verificado' },
    ],
  },
  reviews: {
    kpis: [
      { label: 'RATING', value: '4,6 ★', delta: '+0,3', positive: true },
      { label: 'RESEÑAS', value: '284', delta: '+47', positive: true },
      { label: 'TASA RESPUESTA', value: '88%', delta: '+42 pp', positive: true },
      { label: 'TIEMPO RESPUESTA', value: '17 h', delta: '−29 h', positive: true },
    ],
    topics: [
      { topic: 'Atención', mentions: 96, score: 4.8, trend: 'Fortaleza' },
      { topic: 'Tiempo de espera', mentions: 41, score: 3.7, trend: 'Riesgo' },
      { topic: 'Tratamiento', mentions: 68, score: 4.7, trend: 'Mejora' },
      { topic: 'Precios', mentions: 23, score: 4.1, trend: 'Vigilar' },
    ],
    queue: [
      { platform: 'Google', rating: 1, age: 'Hace 3 h', priority: 'Urgente' },
      { platform: 'Facebook', rating: 3, age: 'Hace 11 h', priority: 'Revisar' },
      { platform: 'Google', rating: 5, age: 'Hace 14 h', priority: 'Responder' },
    ],
  },
  site: {
    kpis: [
      { label: 'SALUD TÉCNICA', value: '84%', delta: '+19 puntos', positive: true },
      { label: 'ERRORES CRÍTICOS', value: '3', delta: '−9', positive: true },
      { label: 'SHARE OF VOICE', value: '18,7%', delta: '+5,4 pp', positive: true },
      { label: 'DOMINIOS', value: '146', delta: '+18', positive: true },
    ],
    issues: [
      { severity: 'Crítico', finding: '3 páginas bloqueadas por robots', impact: 'Alto', confidence: '98%', status: 'En ejecución' },
      { severity: 'Alto', finding: '19 imágenes sin alt', impact: 'Medio', confidence: '100%', status: 'Planificado' },
      { severity: 'Alto', finding: '7 páginas con intención duplicada', impact: 'Alto', confidence: '84%', status: 'Análisis' },
    ],
  },
  ads: {
    kpis: [
      { label: 'INVERSIÓN', value: '€3.780', delta: '94,5% presupuesto', positive: true },
      { label: 'LEADS VÁLIDOS', value: '126', delta: '+28%', positive: true },
      { label: 'CPL', value: '€30,00', delta: '−€8,40', positive: true },
      { label: 'ROAS', value: '4,1×', delta: 'Meta 3,5×', positive: true },
    ],
    funnel: [
      { label: 'Impresiones', value: '284.300' },
      { label: 'Clics', value: '8.420' },
      { label: 'Leads', value: '214' },
      { label: 'Leads válidos', value: '126' },
      { label: 'Citas', value: '79' },
      { label: 'Clientes', value: '48' },
    ],
    campaigns: [
      { name: 'Implantes', platform: 'Google Ads', roas: 5.2, status: 'Escalar' },
      { name: 'Urgencias', platform: 'Google Ads', roas: 4.4, status: 'Óptima' },
      { name: 'Ortodoncia', platform: 'Meta Ads', roas: 2.8, status: 'Optimizar' },
    ],
  },
  files: {
    deliverables: [
      { name: 'Auditoría SEO Local v2.1', type: 'PDF · 4,8 MB', status: 'En revisión' },
      { name: 'Matriz de hallazgos', type: 'XLS · 1,3 MB', status: 'Aprobado' },
      { name: 'Reporte GeoGrid', type: 'URL interactiva', status: 'Compartido' },
      { name: 'Paquete de evidencias', type: 'ZIP · 128 archivos', status: 'Inmutable' },
    ],
    approvals: [
      { name: 'Auditoría v2.1', detail: '2 comentarios', status: 'Acción cliente' },
      { name: 'Acceso GBP', detail: 'Bloquea tareas', status: 'Pendiente' },
    ],
  },
  actions: [
    { key: 'approve-audit', title: 'Aprobar auditoría v2.1', subtitle: 'Cliente · vence 17 jul', owner: 'cliente', status: 'Pendiente', priority: 'media' },
    { key: 'confirm-gbp', title: 'Confirmar acceso GBP', subtitle: 'Cliente · bloquea 2 tareas', owner: 'cliente', status: 'Bloqueo', priority: 'alta' },
  ],
};
