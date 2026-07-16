import {
  Crosshair,
  Globe2,
  ShieldCheck,
  Star,
  WalletCards,
  Link2,
} from 'lucide-react';
import type { AuditSummary, AuditDimension } from '../types/audit';

interface AuditOrbitCockpitProps {
  summary: AuditSummary;
  dimensions: AuditDimension[];
  onOpenDetail: (key: string) => void;
}

const orbitItems: Array<{ key: string; icon: React.ElementType; position: string }> = [
  { key: 'visibility', icon: Crosshair, position: 'cc360-orb-o1' },
  { key: 'presence', icon: Globe2, position: 'cc360-orb-o2' },
  { key: 'reputation', icon: Star, position: 'cc360-orb-o3' },
  { key: 'site', icon: ShieldCheck, position: 'cc360-orb-o4' },
  { key: 'ads', icon: WalletCards, position: 'cc360-orb-o5' },
  { key: 'evidence', icon: Link2, position: 'cc360-orb-o6' },
];

export default function AuditOrbitCockpit({ summary, dimensions, onOpenDetail }: AuditOrbitCockpitProps) {
  const findDim = (key: string) => dimensions.find((d) => d.key === key);

  return (
    <div className="cc360-cockpit">
      <button
        type="button"
        onClick={() => onOpenDetail('general')}
        className="cc360-core"
        aria-label="Salud general"
      >
        <div className="cc360-core-inner">
          <strong className="text-[48px] leading-none text-white">{summary.health}</strong>
          <small className="block text-[9px] text-[#aebdca] mt-1">/100 · Salud general</small>
          <span className="block text-[8px] text-emerald-400 font-black mt-1">+{summary.healthDelta} puntos</span>
        </div>
      </button>

      {orbitItems.map((item) => {
        const dim = findDim(item.key);
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onOpenDetail(item.key)}
            className={`cc360-orb ${item.position}`}
            aria-label={dim?.label ?? item.key}
          >
            <span className="cc360-orb-icon"><Icon className="w-4 h-4" /></span>
            <b className="text-[9px] block mt-1.5 text-white">{dim?.label ?? item.key}</b>
            <strong className="text-[19px] block text-white">{dim?.value ?? ''}</strong>
            <small className="text-[7px] text-[#acbac7]">{dim?.detail ?? ''}</small>
          </button>
        );
      })}

      <div className="cc360-spark">
        <svg viewBox="0 0 600 90" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cc360-spark-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D32323" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D32323" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 76 L95 69 L190 61 L285 51 L380 42 L475 27 L600 15 L600 90 L0 90 Z"
            fill="url(#cc360-spark-gradient)"
          />
          <polyline
            points="0,76 95,69 190,61 285,51 380,42 475,27 600,15"
            fill="none"
            stroke="#D32323"
            strokeWidth="4"
          />
        </svg>
      </div>
    </div>
  );
}
