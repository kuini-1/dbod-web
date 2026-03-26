'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';

type HealthStatus = {
  ok?: boolean;
  connected?: boolean;
  error?: string;
};

export default function AdminPage() {
  const { t, locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
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
      title={t('adminOverview')}
      subtitle={t('adminOverviewSubtitle')}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title={t('adminMasterStatus')} description={tx('Database + core service health', '데이터베이스 + 코어 서비스 상태')}>
          {statusError ? (
            <p className="text-sm text-red-300">{statusError}</p>
          ) : (
            <div className="space-y-2 text-sm text-white/80">
              <p>{tx('Auth', '인증')}: {status?.auth ? tx('Down', '오프라인') : tx('Up', '온라인')}</p>
              <p>{tx('Character', '캐릭터')}: {status?.char ? tx('Down', '오프라인') : tx('Up', '온라인')}</p>
              <p>{tx('Game', '게임')}: {status?.game ? tx('Down', '오프라인') : tx('Up', '온라인')}</p>
              <p>{tx('Query', '쿼리')}: {status?.query ? tx('Down', '오프라인') : tx('Up', '온라인')}</p>
              <p>{tx('Chat', '채팅')}: {status?.chat ? tx('Down', '오프라인') : tx('Up', '온라인')}</p>
            </div>
          )}
        </AdminCard>

        <AdminCard title={t('adminWebBridge')} description={tx('Live link from website to MasterServer', '웹사이트와 마스터 서버 간 실시간 연결')}>
          {healthError ? (
            <p className="text-sm text-red-300">{healthError}</p>
          ) : (
            <div className="space-y-2 text-sm text-white/80">
              <p>{tx('Bridge', '브리지')}: {health?.ok ? tx('Online', '온라인') : tx('Offline', '오프라인')}</p>
              <p>{tx('Master Connected', '마스터 연결됨')}: {health?.connected ? tx('Yes', '예') : tx('No', '아니오')}</p>
              {health?.error ? <p className="text-red-300">{health.error}</p> : null}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard title={t('adminQuickActions')} description={tx('Jump into detailed controls', '상세 제어 화면으로 이동')}>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/players">
            {tx('Player Controls', '플레이어 제어')}
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/buffs">
            {tx('Buff Manager', '버프 관리')}
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/items">
            {tx('Item Tools', '아이템 도구')}
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/server">
            {tx('Server Tools', '서버 도구')}
          </a>
          <a className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10" href="/admin/wps">
            {t('adminWpsScripts')}
          </a>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
