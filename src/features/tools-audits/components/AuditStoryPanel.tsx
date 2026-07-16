import { useState } from 'react';
import type { AuditStory } from '../types/audit';

interface AuditStoryPanelProps {
  stories: AuditStory[];
}

export default function AuditStoryPanel({ stories }: AuditStoryPanelProps) {
  const [active, setActive] = useState(stories[0]?.key ?? '');
  const current = stories.find((s) => s.key === active) || stories[0];

  return (
    <aside className="cc360-story">
      <h3 className="text-xs font-black mb-3">Historia del avance</h3>
      <div className="cc360-storylist">
        {stories.map((story) => (
          <button
            key={story.key}
            type="button"
            onClick={() => setActive(story.key)}
            className={`cc360-storyitem ${active === story.key ? 'cc360-storyitem-active' : ''}`}
          >
            <div className="cc360-sdot">{story.step}</div>
            <div>
              <b className="text-[10px] block">{story.title}</b>
              <small className="block text-[8px] text-[#aebdca] mt-0.5">{story.subtitle}</small>
            </div>
          </button>
        ))}
      </div>

      {current && (
        <div className="cc360-storydetail">
          <h4 className="text-[10px] font-black mb-1">{current.detailTitle}</h4>
          <p className="text-[8px] text-[#b6c4d0] leading-relaxed m-0">{current.detailText}</p>
          <div className="cc360-storystats">
            {current.stats.map((stat) => (
              <div key={stat.label} className="cc360-sstat">
                <small className="block text-[6px] text-[#9fb0be]">{stat.label}</small>
                <b className="block text-[13px] mt-1">{stat.value}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
