'use client';

import { memo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WpsBlock, WpsScript } from '@/lib/wps/types';
import { WpsBlockCard } from './WpsBlockCard';
import { WpsDropZone } from './WpsDropZone';
import { useLocale } from '@/components/LocaleProvider';

type WpsBlockListProps = {
  body: WpsBlock[];
  setScript: Dispatch<SetStateAction<WpsScript>>;
  sectionIdx: number;
  pathKey: string;
  collapsedIds: Set<string>;
  onToggleCollapsed: (id: string) => void;
  isDragActive: boolean;
  selectedPathKey: string | null;
  onSelectBlock: (pathKey: string) => void;
  showAllDetails: boolean;
};

function WpsBlockListComponent({
  body,
  setScript,
  sectionIdx,
  pathKey,
  collapsedIds,
  onToggleCollapsed,
  isDragActive,
  selectedPathKey,
  onSelectBlock,
  showAllDetails,
}: WpsBlockListProps) {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

  return (
    <div className="space-y-2">
      {body.map((block, i) => (
        <div key={block.uiId ?? `${sectionIdx}-${pathKey}-${i}`} className="space-y-2">
          <WpsDropZone
            dropZoneId={`${sectionIdx}:${pathKey}:${i}`}
            sectionIdx={sectionIdx}
            pathKey={pathKey}
            insertIndex={i}
            isDragActive={isDragActive}
          />
          <WpsBlockCard
            setScript={setScript}
            sectionIdx={sectionIdx}
            parentPathKey={pathKey}
            index={i}
            block={block}
            collapsedIds={collapsedIds}
            onToggleCollapsed={onToggleCollapsed}
            isDragActive={isDragActive}
            selectedPathKey={selectedPathKey}
            onSelectBlock={onSelectBlock}
            showAllDetails={showAllDetails}
          />
        </div>
      ))}
      <WpsDropZone
        dropZoneId={`${sectionIdx}:${pathKey}:${body.length}`}
        sectionIdx={sectionIdx}
        pathKey={pathKey}
        insertIndex={body.length}
        isDragActive={isDragActive}
      >
        <span className="inline-flex min-h-[52px] items-center px-3 text-xs text-white/55">{tx('Drop block here', '여기에 블록 놓기')}</span>
      </WpsDropZone>
    </div>
  );
}

export const WpsBlockList = memo(
  WpsBlockListComponent,
  (prev, next) =>
    prev.body === next.body &&
    prev.pathKey === next.pathKey &&
    prev.collapsedIds === next.collapsedIds &&
    prev.isDragActive === next.isDragActive &&
    prev.selectedPathKey === next.selectedPathKey &&
    prev.showAllDetails === next.showAllDetails &&
    prev.setScript === next.setScript &&
    prev.onSelectBlock === next.onSelectBlock &&
    prev.onToggleCollapsed === next.onToggleCollapsed &&
    prev.sectionIdx === next.sectionIdx
);
