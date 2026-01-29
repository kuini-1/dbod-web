'use client';

import type { WpsScript } from '@/lib/wps/types';
import { getBody } from '@/lib/wps/scriptMutate';
import { WpsBlockCard } from './WpsBlockCard';
import { WpsDropZone } from './WpsDropZone';
import { addBlock, moveBlock } from '@/lib/wps/scriptMutate';

type WpsBlockListProps = {
  script: WpsScript;
  setScript: (s: WpsScript) => void;
  sectionIdx: number;
  blockIndices: number[];
};

export function WpsBlockList({
  script,
  setScript,
  sectionIdx,
  blockIndices,
}: WpsBlockListProps) {
  const body = getBody(script, sectionIdx, blockIndices);

  function handleDropPalette(
    secIdx: number,
    blkIndices: number[],
    idx: number,
    kind: 'action' | 'condition',
    name: string
  ) {
    setScript(addBlock(script, secIdx, blkIndices, idx, kind, name));
  }

  function handleDropBlock(
    fromSectionIdx: number,
    fromBlockIndices: number[],
    fromIndex: number,
    toSectionIdx: number,
    toBlockIndices: number[],
    toIndex: number
  ) {
    setScript(
      moveBlock(script, fromSectionIdx, fromBlockIndices, fromIndex, toSectionIdx, toBlockIndices, toIndex)
    );
  }

  return (
    <div className="space-y-2">
      {body.map((block, i) => (
        <div key={`${sectionIdx}-${blockIndices.join('-')}-${i}`} className="space-y-2">
          <WpsDropZone
            sectionIdx={sectionIdx}
            blockIndices={blockIndices}
            insertIndex={i}
            onDropPalette={handleDropPalette}
            onDropBlock={handleDropBlock}
          />
          <WpsBlockCard
            script={script}
            setScript={setScript}
            sectionIdx={sectionIdx}
            blockIndices={blockIndices}
            index={i}
            block={block}
          />
        </div>
      ))}
      <WpsDropZone
        sectionIdx={sectionIdx}
        blockIndices={blockIndices}
        insertIndex={body.length}
        onDropPalette={handleDropPalette}
        onDropBlock={handleDropBlock}
      >
        <span className="inline-block px-2 py-2 text-xs text-white/40">Drop block here</span>
      </WpsDropZone>
    </div>
  );
}
