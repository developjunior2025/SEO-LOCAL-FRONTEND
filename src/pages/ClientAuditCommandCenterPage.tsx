import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { isValidAuditTab, type AuditTabKey } from '@/components/toolsDropdownConfig';
import { useClientAudit } from '@/features/tools-audits/hooks/useClientAudit';
import AuditShell from '@/features/tools-audits/components/AuditShell';
import AuditStoryPanel from '@/features/tools-audits/components/AuditStoryPanel';
import AuditOrbitCockpit from '@/features/tools-audits/components/AuditOrbitCockpit';
import AuditExecutiveSummary from '@/features/tools-audits/components/AuditExecutiveSummary';
import AuditDetailDrawer from '@/features/tools-audits/components/AuditDetailDrawer';
import AuditTimeline from '@/features/tools-audits/components/AuditTimeline';
import AuditEvidenceChain from '@/features/tools-audits/components/AuditEvidenceChain';
import AuditRankingsPanel from '@/features/tools-audits/components/AuditRankingsPanel';
import AuditListingsPanel from '@/features/tools-audits/components/AuditListingsPanel';
import AuditReputationPanel from '@/features/tools-audits/components/AuditReputationPanel';
import AuditTechnicalSeoPanel from '@/features/tools-audits/components/AuditTechnicalSeoPanel';
import AuditSemPanel from '@/features/tools-audits/components/AuditSemPanel';
import AuditDeliverablesPanel from '@/features/tools-audits/components/AuditDeliverablesPanel';
import '@/features/tools-audits/styles/command-center-360.css';

function AuditSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-gray-200 rounded-2xl" />
    </div>
  );
}

function AuditError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="w-8 h-8 text-[#D32323] mx-auto mb-3" />
      <p className="text-sm font-black text-[#333] mb-2">No se pudo cargar la auditoría</p>
      <p className="text-xs text-gray-600 mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-[#D32323] text-white px-4 py-2 text-xs font-black hover:bg-[#b01c1c]"
      >
        <RefreshCw className="w-4 h-4" /> Reintentar
      </button>
    </div>
  );
}

export default function ClientAuditCommandCenterPage() {
  const [searchParams] = useSearchParams();
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const { data, loading, error, retry } = useClientAudit();

  const activeTab: AuditTabKey = useMemo(() => {
    const raw = searchParams.get('tab');
    return raw && isValidAuditTab(raw) ? raw : 'summary';
  }, [searchParams]);

  const drawerDimension = useMemo(
    () => data?.dimensions.find((d) => d.key === drawerKey) || null,
    [data?.dimensions, drawerKey]
  );

  return (
    <AuditShell
      title="Command Center 360"
      description="Historia, salud, evidencia, rankings, GBP, reputación, SEO técnico y SEM en una experiencia visual de alto nivel."
      activeTab={activeTab}
    >
      <section className="pb-8">
        {loading && <AuditSkeleton />}

        {!loading && error && <AuditError message={error} onRetry={retry} />}

        {!loading && !error && !data && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-sm font-black text-amber-900">No hay auditoría configurada</p>
            <p className="text-xs text-amber-700 mt-1">Tu cuenta aún no tiene un proyecto de auditoría activo.</p>
          </div>
        )}

        {data && activeTab === 'summary' && (
          <div className="space-y-3">
            <section className="cc360-hero mb-3">
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 relative z-[2]">
                <div className="cc360-command">
                  <AuditStoryPanel stories={data.stories} />
                  <AuditOrbitCockpit summary={data.summary} dimensions={data.dimensions} onOpenDetail={setDrawerKey} />
                </div>
                <AuditExecutiveSummary summary={data.summary} compareRows={data.compareRows} sources={data.sources} />
              </div>
            </section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <small className="block text-[8px] text-gray-500 font-black uppercase">Trabajo verificado</small>
                <strong className="block text-2xl font-black text-[#333] my-1">{data.summary.workVerified}%</strong>
                <span className="text-[10px] font-black text-emerald-600">+{data.summary.workDelta} puntos</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <small className="block text-[8px] text-gray-500 font-black uppercase">Resultado alcanzado</small>
                <strong className="block text-2xl font-black text-[#333] my-1">{data.summary.resultAchieved}%</strong>
                <span className="text-[10px] font-black text-emerald-600">+{data.summary.resultDelta} puntos</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <small className="block text-[8px] text-gray-500 font-black uppercase">Confianza de datos</small>
                <strong className="block text-2xl font-black text-[#333] my-1">{data.summary.dataConfidence}%</strong>
                <span className="text-[10px] font-black text-emerald-600">{data.summary.confidenceLabel}</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <small className="block text-[8px] text-gray-500 font-black uppercase">ROI atribuible</small>
                <strong className="block text-2xl font-black text-[#333] my-1">{data.summary.roi}×</strong>
                <span className="text-[10px] font-black text-emerald-600">{data.summary.roiLabel || 'Atribuido'}</span>
              </div>
            </div>
            <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-3">
              <AuditTimeline snapshots={data.timeline.snapshots} />
              {(data.actions && data.actions.length > 0) && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <h3 className="text-xs font-black text-[#333]">Responsabilidades y próximos pasos</h3>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border bg-red-50 text-red-700 border-red-100">
                      {data.actions.length} accione{data.actions.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="p-4">
                    <table className="w-full text-[10px]">
                      <tbody className="divide-y divide-gray-100">
                        {data.actions.map((action) => (
                          <tr key={action.key}>
                            <td className="py-2">
                              <b className="block text-[#333]">{action.title}</b>
                              {action.subtitle && <span className="text-[8px] text-gray-500">{action.subtitle}</span>}
                            </td>
                            <td className="py-2 text-right">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                                action.status === 'Bloqueo'
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : action.status === 'Pendiente'
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {action.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {data && activeTab === 'proof' && (
          <AuditEvidenceChain chain={data.evidence.chain} ledger={data.evidence.ledger} />
        )}

        {data && activeTab === 'rankings' && (
          <AuditRankingsPanel
            kpis={data.rankings.kpis}
            geoKeyword={data.rankings.geoKeyword}
            geoGridSize={data.rankings.geoGridSize}
            geoPoints={data.rankings.geoPoints}
            competitors={data.rankings.competitors}
          />
        )}

        {data && activeTab === 'listings' && (
          <AuditListingsPanel kpis={data.listings.kpis} directories={data.listings.directories} />
        )}

        {data && activeTab === 'reviews' && (
          <AuditReputationPanel kpis={data.reviews.kpis} topics={data.reviews.topics} queue={data.reviews.queue} />
        )}

        {data && activeTab === 'site' && (
          <AuditTechnicalSeoPanel kpis={data.site.kpis} issues={data.site.issues} />
        )}

        {data && activeTab === 'ads' && (
          <AuditSemPanel kpis={data.ads.kpis} funnel={data.ads.funnel} campaigns={data.ads.campaigns} />
        )}

        {data && activeTab === 'files' && (
          <AuditDeliverablesPanel deliverables={data.files.deliverables} approvals={data.files.approvals} />
        )}
      </section>

      <AuditDetailDrawer
        dimension={drawerDimension}
        onClose={() => setDrawerKey(null)}
      />
    </AuditShell>
  );
}
