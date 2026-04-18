'use client';

export type WpsPaletteDragPayload = {
  type: 'palette';
  kind: 'action' | 'condition';
  name: string;
  label: string;
};

export type WpsBlockDragPayload = {
  type: 'block';
  sectionIdx: number;
  blockIndices: number[];
  index: number;
  blockId: string;
  label: string;
};

export type WpsDragPayload = WpsPaletteDragPayload | WpsBlockDragPayload;

export type WpsDropTarget = {
  type: 'dropzone';
  dropZoneId: string;
  sectionIdx: number;
  blockIndices: number[];
  insertIndex: number;
};

export function indicesToPathKey(indices: number[]): string {
  return indices.join('.');
}

export function pathKeyToIndices(pathKey: string): number[] {
  if (!pathKey) return [];
  return pathKey
    .split('.')
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));
}

export function isSameOrAncestorPath(ancestorPathKey: string, targetPathKey: string | null): boolean {
  if (targetPathKey == null) return false;
  if (ancestorPathKey === '') return true;
  return targetPathKey === ancestorPathKey || targetPathKey.startsWith(`${ancestorPathKey}.`);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number' && !Number.isNaN(entry));
}

export function isWpsBlockDragPayload(payload: WpsDragPayload): payload is WpsBlockDragPayload {
  return payload.type === 'block';
}

export function isWpsDragPayload(value: unknown): value is WpsDragPayload {
  if (typeof value !== 'object' || value == null) return false;
  const payload = value as Record<string, unknown>;
  if (payload.type === 'palette') {
    return (
      (payload.kind === 'action' || payload.kind === 'condition') &&
      typeof payload.name === 'string' &&
      typeof payload.label === 'string'
    );
  }
  if (payload.type === 'block') {
    return (
      typeof payload.sectionIdx === 'number' &&
      isNumberArray(payload.blockIndices) &&
      typeof payload.index === 'number' &&
      typeof payload.blockId === 'string' &&
      typeof payload.label === 'string'
    );
  }
  return false;
}

export function isWpsDropTarget(value: unknown): value is WpsDropTarget {
  if (typeof value !== 'object' || value == null) return false;
  const target = value as Record<string, unknown>;
  return (
    target.type === 'dropzone' &&
    typeof target.dropZoneId === 'string' &&
    typeof target.sectionIdx === 'number' &&
    isNumberArray(target.blockIndices) &&
    typeof target.insertIndex === 'number'
  );
}

export function isDescendantDropTarget(payload: WpsBlockDragPayload, target: WpsDropTarget): boolean {
  if (payload.sectionIdx !== target.sectionIdx) return false;
  const draggedPath = [...payload.blockIndices, payload.index];
  if (target.blockIndices.length < draggedPath.length) return false;
  return draggedPath.every((value, idx) => target.blockIndices[idx] === value);
}
