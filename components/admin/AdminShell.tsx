'use client';

import type { ReactNode } from 'react';
import AdminNav from './AdminNav';
import { useLocale } from '@/components/LocaleProvider';

type AdminShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const { t } = useLocale();

  return (
    <section className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-red-950/40 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-none flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('adminControl')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <AdminNav />
          <div className="flex min-w-0 flex-col gap-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
