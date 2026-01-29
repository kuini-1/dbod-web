'use client';

import { blockLabel } from '@/lib/wps/schema';
import { WPS_ACTIONS, WPS_CONDITIONS } from '@/lib/wps/schema';

const DRAG_TYPE_PALETTE = 'application/x-wps-palette';

export function BlockPalette() {
  function handleDragStart(e: React.DragEvent, kind: 'action' | 'condition', name: string) {
    e.dataTransfer.setData(DRAG_TYPE_PALETTE, JSON.stringify({ kind, name }));
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {WPS_ACTIONS.map((name) => (
          <div
            key={`action-${name}`}
            draggable
            onDragStart={(e) => handleDragStart(e, 'action', name)}
            className="cursor-grab rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-white/90 transition hover:border-emerald-500/60 hover:bg-emerald-500/20 active:cursor-grabbing"
          >
            {blockLabel(name)}
          </div>
        ))}
      </div>
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/60">Conditions</h3>
      <div className="flex flex-wrap gap-2">
        {WPS_CONDITIONS.map((name) => (
          <div
            key={`condition-${name}`}
            draggable
            onDragStart={(e) => handleDragStart(e, 'condition', name)}
            className="cursor-grab rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-white/90 transition hover:border-amber-500/60 hover:bg-amber-500/20 active:cursor-grabbing"
          >
            {blockLabel(name)}
          </div>
        ))}
      </div>
    </div>
  );
}

export { DRAG_TYPE_PALETTE };
