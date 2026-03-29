'use client';

import dynamic from 'next/dynamic';

export const DynamicNewsBlockNoteField = dynamic(() => import('./NewsBlockNoteField'), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[320px] w-full min-w-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-sm text-white/40">
            Loading editor…
        </div>
    ),
});
