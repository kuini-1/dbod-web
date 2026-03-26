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
    <section className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-red-950/40 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t('adminControl')}</p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <AdminNav />
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
