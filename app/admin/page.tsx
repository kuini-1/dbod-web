'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';

type HealthStatus = {
  ok?: boolean;
  connected?: boolean;
  error?: string;
};

export default function AdminPage() {
  const [status, setStatus] = useState<any>(null);
  const [statusError, setStatusError] = useState('');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState('');

  useEffect(() => {
    loadStatus();
    loadHealth();
    const interval = setInterval(() => {
      loadStatus();
      loadHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const res = await API.get('/status', { cache: 'no-store' });
      if (res.status === 200) {
        setStatus(res.data);
        setStatusError('');
      } else {
        throw new Error(res.statusText || 'Status fetch failed');
      }
    } catch (error: any) {
      setStatusError(error.message || 'Status fetch failed');
    }
  }

  async function loadHealth() {
    try {
      const res = await API.get('/admin/health', { cache: 'no-store' });
      if (res.status === 200) {
        setHealth(res.data);
        setHealthError('');
      } else {
        throw new Error(res.statusText || 'Health fetch failed');
      }
    } catch (error: any) {
      setHealthError(error.message || 'Health fetch failed');
    }
  }

  return (
    <AdminShell
      title="Admin Overview"
      subtitle="Monitor core services and jump into player tools fast."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Master Status" description="Database + core service health">
          {statusError ? (
            <p className="text-sm text-red-300">{statusError}</p>
          ) : (
            <div className="space-y-2 text-sm text-white/80">
              <p>Auth: {status?.auth ? 'Down' : 'Up'}</p>
              <p>Character: {status?.char ? 'Down' : 'Up'}</p>
              <p>Game: {status?.game ? 'Down' : 'Up'}</p>
              <p>Query: {status?.query ? 'Down' : 'Up'}</p>
              <p>Chat: {status?.chat ? 'Down' : 'Up'}</p>
            </div>
          )}
        </AdminCard>

        <AdminCard title="Web Bridge" description="Live link from website to MasterServer">
          {healthError ? (
            <p className="text-sm text-red-300">{healthError}</p>
          ) : (
            <div className="space-y-2 text-sm text-white/80">
              <p>Bridge: {health?.ok ? 'Online' : 'Offline'}</p>
              <p>Master Connected: {health?.connected ? 'Yes' : 'No'}</p>
              {health?.error ? <p className="text-red-300">{health.error}</p> : null}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Quick Actions" description="Jump into detailed controls">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/players">
            Player Controls
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/buffs">
            Buff Manager
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/items">
            Item Tools
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/server">
            Server Tools
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/wps">
            WPS Scripts
          </a>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
