'use client';

import { memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WpsSection, WpsScript } from '@/lib/wps/types';
import { WpsBlockList } from './WpsBlockList';
import { ChevronDown, ChevronRight } from 'lucide-react';

type WpsSectionCardProps = {
  setScript: Dispatch<SetStateAction<WpsScript>>;
  sectionIdx: number;
  section: WpsSection;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  collapsedIds: Set<string>;
  onToggleCollapsedBlock: (id: string) => void;
  isDragActive: boolean;
  selectedPathKey: string | null;
  onSelectBlock: (pathKey: string) => void;
  showAllDetails: boolean;
};

function WpsSectionCardComponent({
  setScript,
  sectionIdx,
  section,
  isCollapsed,
  onToggleCollapsed,
  collapsedIds,
  onToggleCollapsedBlock,
  isDragActive,
  selectedPathKey,
  onSelectBlock,
  showAllDetails,
}: WpsSectionCardProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-black/30 p-4">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="mb-3 flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white/90">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {section.type === 'gameStage' ? `Game Stage ${section.stageNumber}` : 'Game Failed'}
        </span>
        <span className="text-xs text-white/45">{section.body.length} block(s)</span>
      </button>
      {!isCollapsed && (
        <WpsBlockList
          body={section.body}
          setScript={setScript}
          sectionIdx={sectionIdx}
          pathKey=""
          collapsedIds={collapsedIds}
          onToggleCollapsed={onToggleCollapsedBlock}
          isDragActive={isDragActive}
          selectedPathKey={selectedPathKey}
          onSelectBlock={onSelectBlock}
          showAllDetails={showAllDetails}
        />
      )}
    </div>
  );
}

export const WpsSectionCard = memo(
  WpsSectionCardComponent,
  (prev, next) =>
    prev.section === next.section &&
    prev.isCollapsed === next.isCollapsed &&
    prev.collapsedIds === next.collapsedIds &&
    prev.isDragActive === next.isDragActive &&
    prev.selectedPathKey === next.selectedPathKey &&
    prev.showAllDetails === next.showAllDetails &&
    prev.setScript === next.setScript &&
    prev.onSelectBlock === next.onSelectBlock &&
    prev.onToggleCollapsed === next.onToggleCollapsed &&
    prev.onToggleCollapsedBlock === next.onToggleCollapsedBlock &&
    prev.sectionIdx === next.sectionIdx
);
