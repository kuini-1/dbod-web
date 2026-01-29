'use client';

import type { WpsSection, WpsScript } from '@/lib/wps/types';
import { WpsBlockList } from './WpsBlockList';

type WpsSectionCardProps = {
  script: WpsScript;
  setScript: (s: WpsScript) => void;
  sectionIdx: number;
  section: WpsSection;
};

export function WpsSectionCard({
  script,
  setScript,
  sectionIdx,
  section,
}: WpsSectionCardProps) {
  const blockIndices: number[] = [];

  return (
    <div className="rounded-xl border border-white/20 bg-black/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white/90">
        {section.type === 'gameStage' ? `Game Stage ${section.stageNumber}` : 'Game Failed'}
      </h3>
      <WpsBlockList
        script={script}
        setScript={setScript}
        sectionIdx={sectionIdx}
        blockIndices={blockIndices}
      />
    </div>
  );
}
