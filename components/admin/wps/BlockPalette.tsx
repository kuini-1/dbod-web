'use client';

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useRef, useState } from 'react';
import { blockLabel } from '@/lib/wps/schema';
import { WPS_ACTIONS, WPS_CONDITIONS } from '@/lib/wps/schema';
import { useLocale } from '@/components/LocaleProvider';
import { GripVertical } from 'lucide-react';
import type { WpsPaletteDragPayload } from './editorUi';

type PaletteItemProps = {
  payload: WpsPaletteDragPayload;
  tone: 'action' | 'condition';
};

function PaletteItem({ payload, tone }: PaletteItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: () => payload,
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [payload]);

  const toneClasses =
    tone === 'action'
      ? 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500/60 hover:bg-emerald-500/20'
      : 'border-amber-500/40 bg-amber-500/10 hover:border-amber-500/60 hover:bg-amber-500/20';
  const iconTone = tone === 'action' ? 'text-emerald-200/80' : 'text-amber-200/80';

  return (
    <button
      ref={ref}
      type="button"
      className={`flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 text-left text-white/90 transition active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      } ${toneClasses}`}
    >
      <GripVertical className={`h-4 w-4 ${iconTone}`} />
      {payload.label}
    </button>
  );
}

export function BlockPalette() {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">{tx('Actions', '액션')}</h3>
      <div className="flex flex-wrap gap-2">
        {WPS_ACTIONS.map((name) => (
          <PaletteItem
            key={`action-${name}`}
            tone="action"
            payload={{ type: 'palette', kind: 'action', name, label: blockLabel(name) }}
          />
        ))}
      </div>
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/60">{tx('Conditions', '조건')}</h3>
      <div className="flex flex-wrap gap-2">
        {WPS_CONDITIONS.map((name) => (
          <PaletteItem
            key={`condition-${name}`}
            tone="condition"
            payload={{ type: 'palette', kind: 'condition', name, label: blockLabel(name) }}
          />
        ))}
      </div>
    </div>
  );
}
