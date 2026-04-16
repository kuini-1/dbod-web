'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Save, Trash2 } from 'lucide-react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';

type CashshopItem = { id: string; tblidx: number; wszName: string; szIcon_Name: string; dwCash: number; byStackCount: number; active?: boolean };
type EventReward = { id: number; eventId: number; requiredLevel: number; itemId: number; amount: number; item?: CashshopItem | null };
type LevelupEvent = { id: number; title: string; slug: string; startDate: string; endDate: string; isActive: boolean; rewards: EventReward[] };

function iconPath(name: string): string {
    const trimmed = (name || '').trim();
    if (!trimmed) return '/icon/i_empty_cs_s.png';
    return trimmed.endsWith('.png') ? `/icon/${trimmed}` : `/icon/${trimmed}.png`;
}

export default function AdminEventLevelupPage() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    const [events, setEvents] = useState<LevelupEvent[]>([]);
    const [cashshopItems, setCashshopItems] = useState<CashshopItem[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [itemAmountDraft, setItemAmountDraft] = useState('1');
    const [newEventDraft, setNewEventDraft] = useState({ title: '', slug: '', startDate: '', endDate: '', isActive: true });
    const [selectedEventDraft, setSelectedEventDraft] = useState({ title: '', slug: '', startDate: '', endDate: '', isActive: true });
    const [newLevelDraft, setNewLevelDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
    const [addItemDraft, setAddItemDraft] = useState<Record<number, { amount: string }>>({});
    const [editRewardDraft, setEditRewardDraft] = useState<Record<number, { requiredLevel: string; amount: string }>>({});

    const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) || null, [events, selectedEventId]);
    const selectedReward = useMemo(
        () => selectedEvent?.rewards.find((row) => row.requiredLevel === selectedLevel) || null,
        [selectedEvent, selectedLevel]
    );
    const itemByTblidx = useMemo(() => {
        const map = new Map<number, CashshopItem>();
        for (const item of cashshopItems) {
            const tblidx = Number(item.tblidx);
            if (tblidx > 0 && !map.has(tblidx)) map.set(tblidx, item);
        }
        return map;
    }, [cashshopItems]);
    const selectedItem = useMemo(
        () => (selectedReward?.itemId ? itemByTblidx.get(Number(selectedReward.itemId)) ?? null : null),
        [selectedReward, itemByTblidx]
    );
    const filteredCashshopItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return cashshopItems;
        return cashshopItems.filter((row) => String(row.tblidx).includes(q) || (row.wszName || '').toLowerCase().includes(q));
    }, [cashshopItems, query]);
    const sortedRewards = useMemo(
        () => [...(selectedEvent?.rewards || [])].sort((a, b) => a.requiredLevel - b.requiredLevel),
        [selectedEvent?.rewards]
    );

    async function loadData() {
        setLoading(true);
        setError('');
        try {
            const res = await API.get('/admin/event-levelup', { cache: 'no-store' });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Could not load level-up event admin data.');
            const nextEvents: LevelupEvent[] = res.data.events || [];
            setEvents(nextEvents);
            setCashshopItems(res.data.cashshopItems || []);
            const nextEventId = selectedEventId && nextEvents.some((e) => e.id === selectedEventId) ? selectedEventId : nextEvents[0]?.id ?? null;
            setSelectedEventId(nextEventId);
            const ev = nextEvents.find((e) => e.id === nextEventId) || null;
            const nextLevel = ev?.rewards?.[0]?.requiredLevel ?? null;
            setSelectedLevel(nextLevel);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Load failed.', '불러오기 실패.'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void loadData(); }, []);
    useEffect(() => {
        if (!selectedEvent) {
            setSelectedEventDraft({ title: '', slug: '', startDate: '', endDate: '', isActive: true });
            setEditRewardDraft({});
            return;
        }
        setSelectedEventDraft({
            title: selectedEvent.title || '',
            slug: selectedEvent.slug || '',
            startDate: selectedEvent.startDate || '',
            endDate: selectedEvent.endDate || '',
            isActive: !!selectedEvent.isActive,
        });
        const nextDraft: Record<number, { requiredLevel: string; amount: string }> = {};
        for (const reward of selectedEvent.rewards || []) {
            nextDraft[reward.id] = {
                requiredLevel: String(Math.max(1, Number(reward.requiredLevel || 1))),
                amount: String(Math.max(1, Number(reward.amount || 1))),
            };
        }
        setEditRewardDraft(nextDraft);
    }, [selectedEvent?.id, selectedEvent?.title, selectedEvent?.slug, selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.isActive, selectedEvent?.rewards]);
    useEffect(() => {
        if (!selectedReward) {
            setItemAmountDraft('1');
            return;
        }
        setItemAmountDraft(String(Math.max(1, Number(selectedReward.amount || 1))));
    }, [selectedReward?.id, selectedReward?.amount]);

    async function createEvent() {
        if (!newEventDraft.title || !newEventDraft.startDate || !newEventDraft.endDate) {
            setError(tx('Title/start/end are required.', '제목/시작/종료일은 필수입니다.'));
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup', newEventDraft);
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Create event failed.');
            setNewEventDraft({ title: '', slug: '', startDate: '', endDate: '', isActive: true });
            await loadData();
            if (res.data?.event?.id) setSelectedEventId(Number(res.data.event.id));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Create failed.', '생성 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function saveSelectedEvent() {
        if (!selectedEvent) return;
        if (!selectedEventDraft.title || !selectedEventDraft.startDate || !selectedEventDraft.endDate) {
            setError(tx('Title/start/end are required.', '제목/시작/종료일은 필수입니다.'));
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup/update', {
                id: selectedEvent.id,
                title: selectedEventDraft.title,
                slug: selectedEventDraft.slug,
                startDate: selectedEventDraft.startDate,
                endDate: selectedEventDraft.endDate,
                isActive: selectedEventDraft.isActive,
            });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Update event failed.');
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Save failed.', '저장 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function createMilestone() {
        if (!selectedEvent) return;
        const requiredLevel = Math.max(1, Number(newLevelDraft || 0));
        if (!requiredLevel) return;
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup-rewards/upsert', { eventId: selectedEvent.id, requiredLevel });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Create milestone failed.');
            setNewLevelDraft('');
            await loadData();
            setSelectedLevel(requiredLevel);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Save failed.', '저장 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function assignItem(item: CashshopItem) {
        if (!selectedEvent || !selectedLevel) return;
        const rowDraft = addItemDraft[item.tblidx]?.amount;
        const amount = Math.max(1, Number(rowDraft || itemAmountDraft || 1));
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup-rewards/upsert', {
                id: selectedReward?.id,
                eventId: selectedEvent.id,
                requiredLevel: selectedLevel,
                itemId: Number(item.tblidx),
                amount,
            });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Assign failed.');
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Assign failed.', '지정 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function saveSelectedAmount() {
        if (!selectedEvent || !selectedLevel || !selectedReward) return;
        if (!selectedReward.itemId || Number(selectedReward.itemId) <= 0) {
            setError(tx('Assign an item first.', '먼저 아이템을 지정하세요.'));
            return;
        }
        const amount = Math.max(1, Number(itemAmountDraft || 1));
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup-rewards/upsert', {
                id: selectedReward.id,
                eventId: selectedEvent.id,
                requiredLevel: selectedLevel,
                itemId: Number(selectedReward.itemId),
                amount,
            });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Amount save failed.');
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Save failed.', '저장 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function removeMilestone(level: number) {
        if (!selectedEvent) return;
        setSaving(true);
        setError('');
        try {
            const reward = selectedEvent.rewards.find((r) => r.requiredLevel === level);
            const res = await API.post('/admin/event-levelup-rewards/delete', reward?.id ? { id: reward.id } : { eventId: selectedEvent.id, requiredLevel: level });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Delete failed.');
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Delete failed.', '삭제 실패.'));
        } finally {
            setSaving(false);
        }
    }

    async function saveRewardRow(reward: EventReward) {
        if (!selectedEvent) return;
        const draft = editRewardDraft[reward.id] || {
            requiredLevel: String(reward.requiredLevel),
            amount: String(reward.amount),
        };
        const requiredLevel = Math.max(1, Number(draft.requiredLevel || reward.requiredLevel || 1));
        const amount = Math.max(1, Number(draft.amount || reward.amount || 1));
        setSaving(true);
        setError('');
        try {
            const res = await API.post('/admin/event-levelup-rewards/upsert', {
                id: reward.id,
                eventId: selectedEvent.id,
                requiredLevel,
                itemId: Number(reward.itemId || 0),
                amount,
            });
            if (res.status !== 200 || !res.data?.success) throw new Error(res.data?.message || 'Update reward failed.');
            await loadData();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : tx('Save failed.', '저장 실패.'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminShell title={tx('Level-Up Event Manager', '레벨업 이벤트 관리자')} subtitle={tx('Create events, add milestone levels, then assign cashshop items.', '이벤트 생성 → 마일스톤 레벨 추가 → 캐시샵 아이템 지정 순서로 설정하세요.')}>
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                <AdminCard title={tx('Events', '이벤트')} description={tx('Select or create level-up events.', '레벨업 이벤트를 선택하거나 생성하세요.')}>
                    <div className="space-y-3">
                        <div className="max-h-60 overflow-auto rounded-xl border border-white/10">
                            {events.map((event) => (
                                <button key={event.id} onClick={() => setSelectedEventId(event.id)} className={`flex w-full items-center justify-between border-b border-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${selectedEventId === event.id ? 'bg-white/10' : ''}`}>
                                    <span className="truncate">{event.title || `Event ${event.id}`}</span>
                                    <span className="text-xs text-white/60">{event.startDate}</span>
                                </button>
                            ))}
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">{tx('Create event', '이벤트 생성')}</p>
                            <input value={newEventDraft.title} onChange={(e) => setNewEventDraft((p) => ({ ...p, title: e.target.value }))} placeholder={tx('Title', '제목')} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
                            <input value={newEventDraft.slug} onChange={(e) => setNewEventDraft((p) => ({ ...p, slug: e.target.value }))} placeholder="slug (optional)" className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={newEventDraft.startDate} onChange={(e) => setNewEventDraft((p) => ({ ...p, startDate: e.target.value }))} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
                                <input type="date" value={newEventDraft.endDate} onChange={(e) => setNewEventDraft((p) => ({ ...p, endDate: e.target.value }))} className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
                            </div>
                            <button onClick={createEvent} disabled={saving} className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60">{tx('Create Event', '이벤트 생성')}</button>
                        </div>
                    </div>
                </AdminCard>

                <div className="flex flex-col gap-6">
                    <AdminCard title={tx('Selected Event', '선택 이벤트')} description={tx('Manage milestones and assigned rewards for this event.', '이 이벤트의 마일스톤 및 보상 아이템을 관리합니다.')}>
                        {!selectedEvent ? <p className="text-sm text-white/70">{tx('Select an event first.', '먼저 이벤트를 선택하세요.')}</p> : (
                            <>
                                <div className="mb-4 grid gap-3 md:grid-cols-2">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-white/65">{tx('Event Title', '이벤트 제목')}</span>
                                        <input
                                            value={selectedEventDraft.title}
                                            onChange={(e) => setSelectedEventDraft((prev) => ({ ...prev, title: e.target.value }))}
                                            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-white/65">Slug</span>
                                        <input
                                            value={selectedEventDraft.slug}
                                            onChange={(e) => setSelectedEventDraft((prev) => ({ ...prev, slug: e.target.value }))}
                                            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-white/65">{tx('Start Date', '시작일')}</span>
                                        <input
                                            type="date"
                                            value={selectedEventDraft.startDate}
                                            onChange={(e) => setSelectedEventDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                                            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-white/65">{tx('End Date', '종료일')}</span>
                                        <input
                                            type="date"
                                            value={selectedEventDraft.endDate}
                                            onChange={(e) => setSelectedEventDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                                            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                                        />
                                    </label>
                                </div>
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    <label className="inline-flex items-center gap-2 text-sm text-white/80">
                                        <input
                                            type="checkbox"
                                            checked={selectedEventDraft.isActive}
                                            onChange={(e) => setSelectedEventDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                                        />
                                        {tx('Active Event', '활성 이벤트')}
                                    </label>
                                    <button
                                        onClick={() => void saveSelectedEvent()}
                                        disabled={saving}
                                        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                                    >
                                        {tx('Save Event', '이벤트 저장')}
                                    </button>
                                    <span className="text-xs text-white/50">ID: {selectedEvent.id}</span>
                                </div>

                                <div className="mb-3 flex gap-2">
                                    <input value={newLevelDraft} onChange={(e) => setNewLevelDraft(e.target.value)} placeholder={tx('Required level', '필수 레벨')} className="w-40 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm" />
                                    <button onClick={createMilestone} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 disabled:opacity-60"><Plus className="h-4 w-4" />{tx('Add Level', '레벨 추가')}</button>
                                </div>

                                <div className="rounded-xl border border-white/10">
                                    <div className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/50">
                                        {tx('Assigned Rewards', '지정된 보상')}
                                    </div>
                                    <div className="max-h-72 overflow-auto">
                                        {!!sortedRewards.length && (
                                            <div className="grid grid-cols-[80px_50px_1fr_90px_auto_auto] items-center gap-2 border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/55">
                                                <span>{tx('Level', '레벨')}</span>
                                                <span>{tx('Icon', '아이콘')}</span>
                                                <span>{tx('Item', '아이템')}</span>
                                                <span>{tx('Amount', '수량')}</span>
                                                <span>{tx('Save', '저장')}</span>
                                                <span>{tx('Remove', '삭제')}</span>
                                            </div>
                                        )}
                                    {sortedRewards.map((reward) => {
                                        const rewardItem = reward.itemId > 0 ? itemByTblidx.get(Number(reward.itemId)) ?? null : null;
                                        const draft = editRewardDraft[reward.id] || {
                                            requiredLevel: String(reward.requiredLevel),
                                            amount: String(reward.amount),
                                        };
                                        return (
                                        <div
                                            key={reward.id || reward.requiredLevel}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setSelectedLevel(reward.requiredLevel)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedLevel(reward.requiredLevel);
                                                }
                                            }}
                                            className={`grid grid-cols-[80px_50px_1fr_90px_auto_auto] cursor-pointer items-center gap-2 border-b border-white/5 px-3 py-2 text-sm outline-none transition hover:bg-white/5 ${selectedLevel === reward.requiredLevel ? 'bg-white/10 ring-1 ring-inset ring-white/15' : ''}`}
                                        >
                                            <input
                                                value={draft.requiredLevel}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                    setEditRewardDraft((prev) => ({
                                                        ...prev,
                                                        [reward.id]: {
                                                            ...(prev[reward.id] || { requiredLevel: String(reward.requiredLevel), amount: String(reward.amount) }),
                                                            requiredLevel: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs font-semibold"
                                            />
                                            <div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                <Image
                                                    src={brokenIcons[`m-${reward.id}`] ? '/icon/i_empty_cs_s.png' : iconPath(rewardItem?.szIcon_Name || '')}
                                                    alt={rewardItem?.wszName || `item-${reward.itemId}`}
                                                    width={16}
                                                    height={16}
                                                    unoptimized
                                                    className="object-contain"
                                                    onError={() => setBrokenIcons((prev) => ({ ...prev, [`m-${reward.id}`]: true }))}
                                                />
                                            </div>
                                            <span className="truncate">{reward.itemId > 0 ? (rewardItem?.wszName || `Item ${reward.itemId}`) : tx('No item assigned', '아이템 미지정')}</span>
                                            <input
                                                value={draft.amount}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                    setEditRewardDraft((prev) => ({
                                                        ...prev,
                                                        [reward.id]: {
                                                            ...(prev[reward.id] || { requiredLevel: String(reward.requiredLevel), amount: String(reward.amount) }),
                                                            amount: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void saveRewardRow(reward);
                                                }}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/20 hover:bg-white/10"
                                                title={tx('Save row', '행 저장')}
                                            >
                                                <Save className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void removeMilestone(reward.requiredLevel);
                                                }}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-500/30 text-red-200 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );})}
                                    {!sortedRewards.length ? (
                                        <p className="px-3 py-4 text-sm text-white/60">{tx('No milestones yet.', '아직 마일스톤이 없습니다.')}</p>
                                    ) : null}
                                    </div>
                                </div>
                            </>
                        )}
                    </AdminCard>

                    <AdminCard title={tx('All Cashshop Items', '전체 캐시샵 아이템')} description={tx('Preview and add any item to the selected milestone level.', '선택한 마일스톤 레벨에 아이템을 지정합니다.')}>
                        {!selectedEvent || !selectedLevel ? <p className="text-sm text-white/70">{tx('Select a milestone level first.', '먼저 마일스톤 레벨을 선택하세요.')}</p> : (
                            <>
                                <div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                                    <p className="text-white/70">
                                        {tx('Selected milestone', '선택 마일스톤')}: <span className="font-bold">{tx('Level', '레벨')} {selectedLevel}</span>
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center">
                                            <Image
                                                src={brokenIcons['selected-item'] ? '/icon/i_empty_cs_s.png' : iconPath(selectedItem?.szIcon_Name || '')}
                                                alt={selectedItem?.wszName || 'Selected item'}
                                                width={20}
                                                height={20}
                                                unoptimized
                                                className="object-contain"
                                                onError={() => setBrokenIcons((prev) => ({ ...prev, ['selected-item']: true }))}
                                            />
                                        </div>
                                        <span className="text-white/85">{selectedItem?.wszName || tx('No item assigned', '아이템 미지정')}</span>
                                        {selectedReward?.itemId ? <span className="text-xs text-white/60">x{selectedReward.amount}</span> : null}
                                    </div>
                                </div>

                                <div className="mb-3 flex items-center gap-2">
                                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx('Search by tblidx or name', 'tblidx 또는 이름 검색')} className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" />
                                    <input value={itemAmountDraft} onChange={(e) => setItemAmountDraft(e.target.value)} placeholder={tx('Default amount', '기본 수량')} className="w-28 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" />
                                    <button onClick={() => void saveSelectedAmount()} disabled={saving || !selectedReward || !selectedReward.itemId} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-60 whitespace-nowrap">
                                        {tx('Save Amount', '수량 저장')}
                                    </button>
                                </div>
                                <div className="max-h-[34rem] overflow-auto rounded-xl border border-white/10">
                                    <table className="min-w-full text-sm">
                                        <thead className="sticky top-0 bg-stone-900/95">
                                            <tr className="text-left text-white/60">
                                                <th className="px-3 py-2">Icon</th><th className="px-3 py-2">tblidx</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">CP</th><th className="px-3 py-2">{tx('Amount', '수량')}</th><th className="px-3 py-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCashshopItems.map((item) => {
                                                const draft = addItemDraft[item.tblidx] || { amount: itemAmountDraft || '1' };
                                                return (
                                                <tr key={`${item.id}-${item.tblidx}`} className="border-t border-white/5 text-white/85">
                                                    <td className="px-3 py-2"><div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center"><Image src={brokenIcons[item.id] ? '/icon/i_empty_cs_s.png' : iconPath(item.szIcon_Name)} alt={item.wszName || `item-${item.tblidx}`} width={24} height={24} unoptimized className="object-contain" onError={() => setBrokenIcons((prev) => ({ ...prev, [item.id]: true }))} /></div></td>
                                                    <td className="px-3 py-2 font-mono text-xs">{item.tblidx}</td>
                                                    <td className="px-3 py-2">{item.wszName || '-'}</td>
                                                    <td className="px-3 py-2">{item.dwCash}</td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            value={draft.amount}
                                                            onChange={(event) =>
                                                                setAddItemDraft((prev) => ({
                                                                    ...prev,
                                                                    [item.tblidx]: { amount: event.target.value },
                                                                }))
                                                            }
                                                            className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2"><button onClick={() => void assignItem(item)} disabled={saving} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-60"><Plus className="h-3.5 w-3.5" /></button></td>
                                                </tr>
                                            );})}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </AdminCard>
                </div>
            </div>
            {error ? <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
        </AdminShell>
    );
}
