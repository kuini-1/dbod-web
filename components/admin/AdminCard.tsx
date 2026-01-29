import type { ReactNode } from 'react';

type AdminCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export default function AdminCard({ title, description, children }: AdminCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-white/60">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
