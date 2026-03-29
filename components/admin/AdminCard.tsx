import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AdminCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export default function AdminCard({ title, description, children, className }: AdminCardProps) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg', className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-white/60">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
