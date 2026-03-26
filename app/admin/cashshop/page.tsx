'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type AdminCashshopItem = {
  id: string;
  tblidx: number;
  wszName: string;
  szIcon_Name: string;
  dwPriority: number;
  dwCash: number;
  byStackCount: number;
  byDiscount: number;
  table_id: string;
  active: boolean;
};

function iconPath(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '/icon/i_empty_cs_s.png';
  return trimmed.endsWith('.png') ? `/icon/${trimmed}` : `/icon/${trimmed}.png`;
}

export default function AdminCashshopPage() {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
  const [rows, setRows] = useState<AdminCashshopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
  const [rowDrafts, setRowDrafts] = useState<Record<string, { wszName: string; dwCash: string; byStackCount: string }>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  async function loadRows() {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/admin/cashshop-items', { cache: 'no-store' });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || res.statusText || 'Could not load cashshop rows');
      }
      const list: AdminCashshopItem[] = res.data.items || [];
      setRows(list);
      const nextDrafts: Record<string, { wszName: string; dwCash: string; byStackCount: string }> = {};
      for (const row of list) {
        nextDrafts[row.id] = {
          wszName: row.wszName || '',
          dwCash: String(row.dwCash ?? 0),
          byStackCount: String(row.byStackCount ?? 1)
        };
      }
      setRowDrafts(nextDrafts);
    } catch (err: any) {
      setError(err.message || 'Could not load cashshop rows');
    } finally {
      setLoading(false);
    }
  }

  async function saveRow(row: AdminCashshopItem) {
    const draft = rowDrafts[row.id];
    if (!draft) return;
    setSavingRows((prev) => ({ ...prev, [row.id]: true }));
    try {
      const res = await API.post('/admin/cashshop-items/update', {
        id: row.id,
        wszName: draft.wszName,
        dwCash: Number(draft.dwCash || 0),
        byStackCount: Number(draft.byStackCount || 1)
      });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Failed to save row');
      }
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                wszName: draft.wszName,
                dwCash: Number(draft.dwCash || 0),
                byStackCount: Number(draft.byStackCount || 1)
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save row');
    } finally {
      setSavingRows((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function toggleActive(row: AdminCashshopItem) {
    const nextPriority = row.active ? 0 : 555;
    setSavingRows((prev) => ({ ...prev, [row.id]: true }));
    try {
      const res = await API.post('/admin/cashshop-items/update', {
        id: row.id,
        dwPriority: nextPriority
      });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Failed to toggle status');
      }
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, dwPriority: nextPriority, active: nextPriority === 555 }
            : item
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status');
    } finally {
      setSavingRows((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = rows.filter((row) => {
    if (statusFilter === 'active') return row.active;
    if (statusFilter === 'inactive') return !row.active;
    return true;
  });

  return (
    <AdminShell
      title={tx('Cashshop Manager', '캐시샵 관리자')}
      subtitle={tx('All cashshop rows from Supabase. Active rows use dwPriority=555.', 'Supabase의 캐시샵 행 관리. 활성 행은 dwPriority=555를 사용합니다.')}
    >
      <AdminCard title="Cashshop Rows" description="Status colors: green=active, gray=inactive">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-white/60">
            Total rows: <span className="font-semibold text-white/80">{filteredRows.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={loadRows}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-white/70">Loading cashshop rows...</p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : (
          <div className="max-h-[36rem] overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-stone-900/95">
                <tr className="text-left text-white/60">
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Icon</th>
                  <th className="px-3 py-2">tblidx</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Stack</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={`${row.tblidx}-${idx}`} className="border-t border-white/5 text-white/85">
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleActive(row)}
                        disabled={Boolean(savingRows[row.id])}
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-stone-500/20 text-stone-300 border border-stone-400/30'
                        } cursor-pointer disabled:opacity-60`}
                      >
                        {row.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center">
                        <Image
                          src={brokenIcons[row.id] ? '/icon/i_empty_cs_s.png' : iconPath(row.szIcon_Name)}
                          alt={row.wszName || `item-${row.tblidx}`}
                          width={24}
                          height={24}
                          unoptimized
                          className="object-contain"
                          onError={() =>
                            setBrokenIcons((prev) => ({
                              ...prev,
                              [row.id]: true
                            }))
                          }
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.tblidx}</td>
                    <td className="px-3 py-2">
                      <input
                        value={rowDrafts[row.id]?.wszName ?? ''}
                        onChange={(e) =>
                          setRowDrafts((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...(prev[row.id] || { wszName: '', dwCash: '0', byStackCount: '1' }),
                              wszName: e.target.value
                            }
                          }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">{row.dwPriority}</td>
                    <td className="px-3 py-2">
                      <input
                        value={rowDrafts[row.id]?.byStackCount ?? '1'}
                        onChange={(e) =>
                          setRowDrafts((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...(prev[row.id] || { wszName: '', dwCash: '0', byStackCount: '1' }),
                              byStackCount: e.target.value
                            }
                          }))
                        }
                        className="w-20 rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={rowDrafts[row.id]?.dwCash ?? '0'}
                        onChange={(e) =>
                          setRowDrafts((prev) => ({
                            ...prev,
                            [row.id]: {
                              ...(prev[row.id] || { wszName: '', dwCash: '0', byStackCount: '1' }),
                              dwCash: e.target.value
                            }
                          }))
                        }
                        className="w-28 rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={Boolean(savingRows[row.id])}
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10 cursor-pointer disabled:opacity-60"
                      >
                        {savingRows[row.id] ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminShell>
  );
}
