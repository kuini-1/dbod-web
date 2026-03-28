'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Save, Trash2 } from 'lucide-react';
import { API } from '@/lib/api/client';
import { iconPublicPathFromFilename } from '@/lib/utils/icon-public-path';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';

type SlotRow = {
    id: number;
    tblidx: number;
    amount: number;
    feq: number;
};

type CashshopItem = {
    id: string;
    tblidx: number;
    wszName: string;
    szIcon_Name: string;
    dwCash: number;
    byStackCount: number;
    active?: boolean;
};

function iconPath(szIcon_Name: string): string {
    return iconPublicPathFromFilename(szIcon_Name) ?? '/icon/i_empty_cs_s.png';
}

function iconBrokenKey(kind: 'shop' | 'pool', id: string | number): string {
    return `${kind}:${id}`;
}

type CatalogRowProps = {
    item: CashshopItem;
    amount: string;
    feq: string;
    saving: boolean;
    iconBroken: boolean;
    iconKey: string;
    markIconBroken: (key: string) => void;
    onAmountChange: (tblidx: number, value: string) => void;
    onFeqChange: (tblidx: number, value: string) => void;
    onAdd: (item: CashshopItem) => void;
    addLabel: string;
};

const CashshopCatalogRow = memo(function CashshopCatalogRow({
    item,
    amount,
    feq,
    saving,
    iconBroken,
    iconKey,
    markIconBroken,
    onAmountChange,
    onFeqChange,
    onAdd,
    addLabel,
}: CatalogRowProps) {
    const t = item.tblidx;
    const handleIconError = useCallback(() => {
        markIconBroken(iconKey);
    }, [markIconBroken, iconKey]);

    return (
        <tr className="border-t border-white/5 text-white/85">
            <td className="px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-black/35">
                    <Image
                        src={iconBroken ? '/icon/i_empty_cs_s.png' : iconPath(item.szIcon_Name)}
                        alt={item.wszName || `item-${t}`}
                        width={24}
                        height={24}
                        unoptimized
                        className="object-contain"
                        onError={handleIconError}
                    />
                </div>
            </td>
            <td className="px-3 py-2 font-mono text-xs">{t}</td>
            <td className="max-w-[220px] truncate px-3 py-2" title={item.wszName}>
                {item.wszName || '—'}
            </td>
            <td className="px-3 py-2 text-xs text-white/70">{item.dwCash}</td>
            <td className="px-3 py-2">
                <input
                    value={amount}
                    onChange={(e) => onAmountChange(t, e.target.value)}
                    className="w-14 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    value={feq}
                    onChange={(e) => onFeqChange(t, e.target.value)}
                    className="w-12 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                />
            </td>
            <td className="px-3 py-2">
                <button
                    type="button"
                    onClick={() => onAdd(item)}
                    disabled={saving}
                    title={addLabel}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
});

const SEARCH_DEBOUNCE_MS = 280;

export default function AdminSlotMachinePage() {
    const { locale } = useLocale();
    const tx = useCallback((en: string, kr: string) => (locale === 'kr' ? kr : en), [locale]);

    const [rows, setRows] = useState<SlotRow[]>([]);
    const [cashshopItems, setCashshopItems] = useState<CashshopItem[]>([]);
    const [drafts, setDrafts] = useState<Record<number, { tblidx: string; amount: string; feq: string }>>({});
    const [addItemDraft, setAddItemDraft] = useState<Record<number, { amount: string; feq: string }>>({});
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [initialLoading, setInitialLoading] = useState(true);
    const [poolBusy, setPoolBusy] = useState(false);
    const [catalogBusy, setCatalogBusy] = useState(false);

    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});

    const addItemDraftRef = useRef(addItemDraft);
    addItemDraftRef.current = addItemDraft;

    const markIconBroken = useCallback((key: string) => {
        setBrokenIcons((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    }, []);

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
        return () => window.clearTimeout(id);
    }, [searchInput]);

    const fetchPool = useCallback(async () => {
        setPoolBusy(true);
        setError('');
        try {
            const slotRes = await API.get('/admin/slot-machine-items', { cache: 'no-store' });
            if (slotRes.status !== 200 || !slotRes.data?.success) {
                throw new Error(slotRes.data?.message || tx('Could not load slot rows.', '슬롯 행을 불러오지 못했습니다.'));
            }
            const list: SlotRow[] = (slotRes.data.items || []).map((r: SlotRow) => ({
                id: Number(r.id),
                tblidx: Number(r.tblidx),
                amount: Number(r.amount),
                feq: Number(r.feq),
            }));
            setRows(list);
            const nextDrafts: Record<number, { tblidx: string; amount: string; feq: string }> = {};
            for (const r of list) {
                nextDrafts[r.id] = {
                    tblidx: String(r.tblidx),
                    amount: String(r.amount),
                    feq: String(r.feq),
                };
            }
            setDrafts(nextDrafts);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : tx('Load failed.', '불러오기 실패.');
            setError(msg);
        } finally {
            setPoolBusy(false);
        }
    }, [tx]);

    const fetchCatalog = useCallback(async () => {
        setCatalogBusy(true);
        setError('');
        try {
            const shopRes = await API.get('/admin/cashshop-items', { cache: 'no-store' });
            if (shopRes.status !== 200 || !shopRes.data?.success) {
                throw new Error(shopRes.data?.message || tx('Could not load cashshop catalog.', '캐시샵 목록을 불러오지 못했습니다.'));
            }
            setCashshopItems(shopRes.data.items || []);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : tx('Load failed.', '불러오기 실패.');
            setError(msg);
        } finally {
            setCatalogBusy(false);
        }
    }, [tx]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setInitialLoading(true);
            setError('');
            try {
                const [slotRes, shopRes] = await Promise.all([
                    API.get('/admin/slot-machine-items', { cache: 'no-store' }),
                    API.get('/admin/cashshop-items', { cache: 'no-store' }),
                ]);
                if (cancelled) return;
                if (slotRes.status !== 200 || !slotRes.data?.success) {
                    throw new Error(slotRes.data?.message || tx('Could not load slot rows.', '슬롯 행을 불러오지 못했습니다.'));
                }
                if (shopRes.status !== 200 || !shopRes.data?.success) {
                    throw new Error(shopRes.data?.message || tx('Could not load cashshop catalog.', '캐시샵 목록을 불러오지 못했습니다.'));
                }
                const list: SlotRow[] = (slotRes.data.items || []).map((r: SlotRow) => ({
                    id: Number(r.id),
                    tblidx: Number(r.tblidx),
                    amount: Number(r.amount),
                    feq: Number(r.feq),
                }));
                setRows(list);
                const nextDrafts: Record<number, { tblidx: string; amount: string; feq: string }> = {};
                for (const r of list) {
                    nextDrafts[r.id] = {
                        tblidx: String(r.tblidx),
                        amount: String(r.amount),
                        feq: String(r.feq),
                    };
                }
                setDrafts(nextDrafts);
                setCashshopItems(shopRes.data.items || []);
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : tx('Load failed.', '불러오기 실패.'));
                }
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [tx]);

    const itemMetaByTblidx = useMemo(() => {
        const m = new Map<number, CashshopItem>();
        for (const it of cashshopItems) {
            const t = Number(it.tblidx);
            if (!m.has(t)) m.set(t, it);
        }
        return m;
    }, [cashshopItems]);

    const filteredCashshopItems = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) return cashshopItems;
        return cashshopItems.filter(
            (row) =>
                String(row.tblidx).includes(q) ||
                (row.wszName || '').toLowerCase().includes(q)
        );
    }, [cashshopItems, debouncedSearch]);

    const sortedRows = useMemo(() => [...rows].sort((a, b) => a.id - b.id), [rows]);

    function clampFeq(n: number): number {
        return Math.max(1, Math.min(10, Math.floor(Number.isFinite(n) ? n : 5)));
    }

    const defaultDraftFor = useCallback((item: CashshopItem) => {
        return {
            amount: String(Math.max(1, item.byStackCount || 1)),
            feq: '5',
        };
    }, []);

    const onCatalogAmountChange = useCallback((tblidx: number, value: string) => {
        setAddItemDraft((prev) => {
            const item = cashshopItems.find((i) => i.tblidx === tblidx);
            const base = prev[tblidx] ?? (item ? defaultDraftFor(item) : { amount: '1', feq: '5' });
            return {
                ...prev,
                [tblidx]: { ...base, amount: value },
            };
        });
    }, [cashshopItems, defaultDraftFor]);

    const onCatalogFeqChange = useCallback((tblidx: number, value: string) => {
        setAddItemDraft((prev) => {
            const item = cashshopItems.find((i) => i.tblidx === tblidx);
            const base = prev[tblidx] ?? (item ? defaultDraftFor(item) : { amount: '1', feq: '5' });
            return {
                ...prev,
                [tblidx]: { ...base, feq: value },
            };
        });
    }, [cashshopItems, defaultDraftFor]);

    async function saveRow(id: number) {
        const d = drafts[id];
        if (!d) return;
        const tblidx = Math.max(0, Math.floor(Number(d.tblidx)));
        const amount = Math.max(1, Math.floor(Number(d.amount) || 1));
        const feq = clampFeq(Number(d.feq));
        if (!tblidx) {
            setError(tx('tblidx must be a positive number.', 'tblidx는 0보다 커야 합니다.'));
            return;
        }
        setSavingId(id);
        setError('');
        try {
            const res = await API.post('/admin/slot-machine-items/upsert', {
                id,
                tblidx,
                amount,
                feq,
            });
            if (res.status !== 200 || !res.data?.success) {
                throw new Error(res.data?.message || tx('Save failed.', '저장 실패.'));
            }
            await fetchPool();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Save failed.', '저장 실패.'));
        } finally {
            setSavingId(null);
        }
    }

    const addFromCatalog = useCallback(async (item: CashshopItem) => {
        const tblidx = Number(item.tblidx);
        if (!tblidx) return;
        const draft = addItemDraftRef.current[tblidx] ?? defaultDraftFor(item);
        const amount = Math.max(1, Math.floor(Number(draft.amount) || 1));
        const feq = clampFeq(Number(draft.feq));
        setSavingId(-1);
        setError('');
        try {
            const res = await API.post('/admin/slot-machine-items/upsert', {
                tblidx,
                amount,
                feq,
            });
            if (res.status !== 200 || !res.data?.success) {
                throw new Error(res.data?.message || tx('Add failed.', '추가 실패.'));
            }
            await fetchPool();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Add failed.', '추가 실패.'));
        } finally {
            setSavingId(null);
        }
    }, [defaultDraftFor, fetchPool, tx]);

    async function deleteRow(id: number) {
        const ok = window.confirm(tx('Delete this slot row?', '이 슬롯 행을 삭제할까요?'));
        if (!ok) return;
        setSavingId(id);
        setError('');
        try {
            const res = await API.post('/admin/slot-machine-items/delete', { id });
            if (res.status !== 200 || !res.data?.success) {
                throw new Error(res.data?.message || tx('Delete failed.', '삭제 실패.'));
            }
            await fetchPool();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Delete failed.', '삭제 실패.'));
        } finally {
            setSavingId(null);
        }
    }

    const addLabel = tx('Add to slot pool', '슬롯 풀에 추가');

    return (
        <AdminShell
            title={tx('Slot machine pool', '슬롯 머신 풀')}
            subtitle={tx(
                'Pick items from the cashshop catalog (same as donation tiers). feq 1 = rarest, 10 = most common. Spin odds use effective weight feq² (low feq is much rarer than high feq).',
                '후원 티어와 동일하게 캐시샵 목록에서 선택하세요. feq 1=가장 희귀, 10=가장 흔합니다. 당첨 확률은 feq²를 가중치로 씁니다(낮은 feq는 훨씬 드묾).'
            )}
        >
            <div className="flex flex-col gap-6">
                <AdminCard
                    title={tx('Current pool', '현재 풀')}
                    description={tx('Rewards in the slot machine. Edit amount/feq or remove.', '슬롯에 들어간 보상입니다. 수량·빈도 수정 또는 삭제.')}
                >
                    <div className="mb-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void fetchPool()}
                            disabled={poolBusy}
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
                        >
                            {poolBusy ? tx('Updating…', '갱신 중…') : tx('Refresh pool', '풀 새로고침')}
                        </button>
                    </div>
                    {initialLoading ? (
                        <p className="text-sm text-white/60">{tx('Loading…', '불러오는 중…')}</p>
                    ) : (
                        <div
                            className={`max-h-[40rem] overflow-auto rounded-xl border border-white/10 ${poolBusy ? 'opacity-60' : ''}`}
                        >
                            <table className="min-w-full text-left text-sm">
                                <thead className="sticky top-0 bg-neutral-900/95 text-xs uppercase text-white/50">
                                    <tr>
                                        <th className="px-2 py-2 w-10" />
                                        <th className="px-2 py-2">{tx('Name', '이름')}</th>
                                        <th className="px-2 py-2">tbl</th>
                                        <th className="px-2 py-2">amt</th>
                                        <th className="px-2 py-2">feq</th>
                                        <th className="px-2 py-2 w-20" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-6 text-center text-white/50 text-sm">
                                                {tx('No items yet. Add from the catalog below.', '항목이 없습니다. 아래 목록에서 추가하세요.')}
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedRows.map((row) => {
                                            const d = drafts[row.id] ?? {
                                                tblidx: String(row.tblidx),
                                                amount: String(row.amount),
                                                feq: String(row.feq),
                                            };
                                            const meta = itemMetaByTblidx.get(row.tblidx);
                                            const name = meta?.wszName || `Item ${row.tblidx}`;
                                            const bk = iconBrokenKey('pool', row.id);
                                            const imgSrc = brokenIcons[bk]
                                                ? '/icon/i_empty_cs_s.png'
                                                : iconPath(meta?.szIcon_Name || '');
                                            return (
                                                <tr key={row.id} className="border-t border-white/5">
                                                    <td className="px-2 py-2">
                                                        <div className="relative h-8 w-8 overflow-hidden rounded border border-white/10 bg-black/40">
                                                            <Image
                                                                src={imgSrc}
                                                                alt=""
                                                                width={32}
                                                                height={32}
                                                                className="object-contain p-0.5"
                                                                unoptimized
                                                                onError={() =>
                                                                    setBrokenIcons((prev) => ({ ...prev, [bk]: true }))
                                                                }
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="max-w-[140px] truncate px-2 py-2 text-xs" title={name}>
                                                        {name}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            value={d.tblidx}
                                                            onChange={(e) =>
                                                                setDrafts((prev) => ({
                                                                    ...prev,
                                                                    [row.id]: { ...d, tblidx: e.target.value },
                                                                }))
                                                            }
                                                            className="w-16 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[11px] text-white"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            value={d.amount}
                                                            onChange={(e) =>
                                                                setDrafts((prev) => ({
                                                                    ...prev,
                                                                    [row.id]: { ...d, amount: e.target.value },
                                                                }))
                                                            }
                                                            className="w-12 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[11px] text-white"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            value={d.feq}
                                                            onChange={(e) =>
                                                                setDrafts((prev) => ({
                                                                    ...prev,
                                                                    [row.id]: { ...d, feq: e.target.value },
                                                                }))
                                                            }
                                                            className="w-10 rounded border border-white/15 bg-black/40 px-1 py-0.5 text-[11px] text-white"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="flex gap-0.5">
                                                            <button
                                                                type="button"
                                                                title={tx('Save', '저장')}
                                                                onClick={() => void saveRow(row.id)}
                                                                disabled={savingId !== null}
                                                                className="rounded border border-emerald-500/40 bg-emerald-500/15 p-1 text-emerald-200 disabled:opacity-40"
                                                            >
                                                                <Save className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title={tx('Delete', '삭제')}
                                                                onClick={() => void deleteRow(row.id)}
                                                                disabled={savingId !== null}
                                                                className="rounded border border-red-500/40 bg-red-500/15 p-1 text-red-200 disabled:opacity-40"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>

                <AdminCard
                    title={tx('All cashshop items', '전체 캐시샵 아이템')}
                    description={tx(
                        'Search, set stack amount and feq (1–10), then add to the slot pool. Weight for each row is feq squared.',
                        '검색 후 수량·빈도(1–10)를 정하고 풀에 추가하세요. 각 행 가중치는 feq의 제곱입니다.'
                    )}
                >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={tx('Search by tblidx or name', 'tblidx 또는 이름 검색')}
                            className="min-w-[12rem] flex-1 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => void fetchCatalog()}
                            disabled={catalogBusy}
                            className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
                        >
                            {catalogBusy
                                ? tx('Updating…', '갱신 중…')
                                : tx('Refresh catalog', '목록 새로고침')}
                        </button>
                    </div>
                    {initialLoading ? (
                        <p className="text-sm text-white/70">{tx('Loading catalog…', '목록 불러오는 중…')}</p>
                    ) : (
                        <div
                            className={`max-h-[40rem] overflow-auto rounded-xl border border-white/10 ${catalogBusy ? 'opacity-60' : ''}`}
                        >
                            <table className="min-w-full text-sm">
                                <thead className="sticky top-0 bg-stone-900/95">
                                    <tr className="text-left text-xs uppercase text-white/55">
                                        <th className="px-3 py-2">{tx('Icon', '아이콘')}</th>
                                        <th className="px-3 py-2">tblidx</th>
                                        <th className="px-3 py-2">{tx('Name', '이름')}</th>
                                        <th className="px-3 py-2">CP</th>
                                        <th className="px-3 py-2">{tx('Amount', '수량')}</th>
                                        <th className="px-3 py-2">feq</th>
                                        <th className="px-3 py-2 w-14">{tx('Add', '추가')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCashshopItems.map((item) => {
                                        const draft = addItemDraft[item.tblidx] ?? defaultDraftFor(item);
                                        const bk = iconBrokenKey('shop', item.id);
                                        return (
                                            <CashshopCatalogRow
                                                key={`${item.id}-${item.tblidx}`}
                                                item={item}
                                                amount={draft.amount}
                                                feq={draft.feq}
                                                saving={savingId !== null}
                                                iconBroken={Boolean(brokenIcons[bk])}
                                                iconKey={bk}
                                                markIconBroken={markIconBroken}
                                                onAmountChange={onCatalogAmountChange}
                                                onFeqChange={onCatalogFeqChange}
                                                onAdd={addFromCatalog}
                                                addLabel={addLabel}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                            {!initialLoading && filteredCashshopItems.length === 0 ? (
                                <p className="px-3 py-6 text-center text-sm text-white/50">
                                    {tx('No items match your search.', '검색 결과가 없습니다.')}
                                </p>
                            ) : null}
                        </div>
                    )}
                </AdminCard>
            </div>

            {error ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}
        </AdminShell>
    );
}
