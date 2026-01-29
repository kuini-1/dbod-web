'use client';

import { useState } from 'react';
import { DRAG_TYPE_PALETTE } from './BlockPalette';

const DRAG_TYPE_BLOCK = 'application/x-wps-block';

type DropZoneProps = {
  sectionIdx: number;
  blockIndices: number[];
  insertIndex: number;
  onDropPalette: (sectionIdx: number, blockIndices: number[], index: number, kind: 'action' | 'condition', name: string) => void;
  onDropBlock: (fromSectionIdx: number, fromBlockIndices: number[], fromIndex: number, toSectionIdx: number, toBlockIndices: number[], toIndex: number) => void;
  children?: React.ReactNode;
};

export function WpsDropZone({
  sectionIdx,
  blockIndices,
  insertIndex,
  onDropPalette,
  onDropBlock,
  children,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  }

  function handleDragLeave() {
    setIsOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsOver(false);
    const palette = e.dataTransfer.getData(DRAG_TYPE_PALETTE);
    if (palette) {
      try {
        const { kind, name } = JSON.parse(palette) as { kind: 'action' | 'condition'; name: string };
        onDropPalette(sectionIdx, blockIndices, insertIndex, kind, name);
      } catch (_) {}
      return;
    }
    const block = e.dataTransfer.getData(DRAG_TYPE_BLOCK);
    if (block) {
      try {
        const { sectionIdx: fromSectionIdx, blockIndices: fromBlockIndices, index: fromIndex } = JSON.parse(block) as {
          sectionIdx: number;
          blockIndices: number[];
          index: number;
        };
        onDropBlock(fromSectionIdx, fromBlockIndices, fromIndex, sectionIdx, blockIndices, insertIndex);
      } catch (_) {}
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-[28px] rounded border-2 border-dashed transition ${
        isOver ? 'border-white/50 bg-white/10' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {children}
    </div>
  );
}

export { DRAG_TYPE_BLOCK };
