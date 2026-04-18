'use client';

import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { ReactNode } from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';
import {
  isDescendantDropTarget,
  isWpsBlockDragPayload,
  isWpsDragPayload,
  pathKeyToIndices,
  type WpsDropTarget,
} from './editorUi';

type DropZoneProps = {
  dropZoneId: string;
  sectionIdx: number;
  pathKey: string;
  insertIndex: number;
  isDragActive: boolean;
  children?: ReactNode;
};

function WpsDropZoneComponent({
  dropZoneId,
  sectionIdx,
  pathKey,
  insertIndex,
  isDragActive,
  children,
}: DropZoneProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const blockIndices = useMemo(() => pathKeyToIndices(pathKey), [pathKey]);
  const targetData = useMemo<WpsDropTarget>(() => ({
    type: 'dropzone',
    dropZoneId,
    sectionIdx,
    blockIndices,
    insertIndex,
  }), [blockIndices, dropZoneId, insertIndex, sectionIdx]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const inactiveClasses = ['border-white/15', 'bg-white/[0.02]'];
    const activeClasses = ['border-sky-400/80', 'bg-sky-400/15'];
    const setActive = (value: boolean) => {
      element.classList.toggle(activeClasses[0], value);
      element.classList.toggle(activeClasses[1], value);
      element.classList.toggle(inactiveClasses[0], !value);
      element.classList.toggle(inactiveClasses[1], !value);
    };

    return dropTargetForElements({
      element,
      getData: () => targetData,
      getIsSticky: () => false,
      canDrop: ({ source }) => {
        if (!isWpsDragPayload(source.data)) return false;
        if (isWpsBlockDragPayload(source.data) && isDescendantDropTarget(source.data, targetData)) {
          return false;
        }
        return true;
      },
      onDragEnter: () => setActive(true),
      onDrag: () => setActive(true),
      onDragLeave: () => setActive(false),
      onDrop: () => setActive(false),
    });
  }, [targetData]);

  return (
    <div
      ref={ref}
      className={`rounded border-2 border-dashed border-white/15 bg-white/[0.02] ${
        isDragActive ? 'min-h-[52px]' : 'min-h-[18px]'
      }`}
    >
      {children ?? (
        <div className={`flex h-full items-center px-3 text-[11px] text-white/45 ${isDragActive ? 'opacity-100' : 'opacity-0'}`}>
          Drop here
        </div>
      )}
    </div>
  );
}

export const WpsDropZone = memo(WpsDropZoneComponent);
