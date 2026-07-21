import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isValidAuditTab, type AuditTabKey } from '@/components/toolsDropdownConfig';
import { clientAuditDemoData as data } from '@/features/tools-audits/data/clientAuditDemoData';
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

export default function ClientAuditCommandCenterPage() {
  const [searchParams] = useSearchParams();
  const [drawerKey, setDrawerKey] = useState<string | null>(null);

  const activeTab: AuditTabKey = useMemo(() => {
    const raw = searchParams.get('tab');
    return raw && isValidAuditTab(raw) ? raw : 'summary';
  }, [searchParams]);

  const drawerDimension = useMemo(
    () => data.dimensions.find((d) => d.key === drawerKey) || null,
    [drawerKey]
  );

  return (
    <AuditShell
      title="Command Center 360"
      description="Historia, salud, evidencia, rankings, GBP, reputación, SEO técnico y SEM en una experiencia visual de alto nivel."
      activeTab={activeTab}
    >
      <section className="pb-8">
        {activeTab === 'summary' && (
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
                <span className="text-[10px] font-black text-emerald-600">€12.840 atribuidos</span>
              </div>
            </div>
            <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-3">
              <AuditTimeline snapshots={data.timeline.snapshots} />
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <h3 className="text-xs font-black text-[#333]">Responsabilidades y próximos pasos</h3>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border bg-red-50 text-red-700 border-red-100">
                    3 acciones
                  </span>
                </div>
                <div className="p-4">
                  <table className="w-full text-[10px]">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2">
                          <b className="block text-[#333]">Aprobar auditoría v2.1</b>
                          <span className="text-[8px] text-gray-500">Cliente · vence 17 jul</span>
                        </td>
                        <td className="py-2 text-right"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-100">Pendiente</span></td>
                      </tr>
                      <tr>
                        <td className="py-2">
                          <b className="block text-[#333]">Confirmar acceso GBP</b>
                          <span className="text-[8px] text-gray-500">Cliente · bloquea 2 tareas</span>
                        </td>
                        <td className="py-2 text-right"><span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border bg-red-50 text-red-700 border-red-100">Bloqueo</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proof' && (
          <AuditEvidenceChain chain={data.evidence.chain} ledger={data.evidence.ledger} />
        )}

        {activeTab === 'rankings' && (
          <AuditRankingsPanel
            kpis={data.rankings.kpis}
            geoKeyword={data.rankings.geoKeyword}
            geoGridSize={data.rankings.geoGridSize}
            geoPoints={data.rankings.geoPoints}
            competitors={data.rankings.competitors}
          />
        )}

        {activeTab === 'listings' && (
          <AuditListingsPanel kpis={data.listings.kpis} directories={data.listings.directories} />
        )}

        {activeTab === 'reviews' && (
          <AuditReputationPanel kpis={data.reviews.kpis} topics={data.reviews.topics} queue={data.reviews.queue} />
        )}

        {activeTab === 'site' && (
          <AuditTechnicalSeoPanel kpis={data.site.kpis} issues={data.site.issues} />
        )}

        {activeTab === 'ads' && (
          <AuditSemPanel kpis={data.ads.kpis} funnel={data.ads.funnel} campaigns={data.ads.campaigns} />
        )}

        {activeTab === 'files' && (
          <AuditDeliverablesPanel deliverables={data.files.deliverables} approvals={data.files.approvals} />
        )}
      </section>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[10px] font-bold text-gray-500">
          Datos demostrativos · sincronización real en próxima fase
        </span>
      </div>

      <AuditDetailDrawer
        dimension={drawerDimension}
        onClose={() => setDrawerKey(null)}
      />
    </AuditShell>
  );
}
