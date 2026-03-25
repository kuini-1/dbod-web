'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Save, Trash2 } from 'lucide-react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';

type CashshopItem = {
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

type TierRewardItem = {
  id: number;
  tierId: number;
  tblidx: number;
  amount: number;
  sortOrder: number;
  item?: CashshopItem | null;
};

type DonationTier = {
  id: number;
  amount: number;
  title: string;
  icon: string;
  order: number;
  rewardItems: TierRewardItem[];
};

function iconPath(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '/icon/i_empty_cs_s.png';
  return trimmed.endsWith('.png') ? `/icon/${trimmed}` : `/icon/${trimmed}.png`;
}

export default function AdminDonationTiersPage() {
  const [tiers, setTiers] = useState<DonationTier[]>([]);
  const [cashshopItems, setCashshopItems] = useState<CashshopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const [newTierDraft, setNewTierDraft] = useState({
    title: '',
    amount: '0',
    icon: 'award',
    order: '0'
  });
  const [selectedTierDraft, setSelectedTierDraft] = useState({
    title: '',
    amount: '0',
    icon: 'award',
    order: '0'
  });

  const [addItemDraft, setAddItemDraft] = useState<Record<number, { amount: string; sortOrder: string }>>({});
  const [editItemDraft, setEditItemDraft] = useState<Record<number, { amount: string; sortOrder: string }>>({});

  const selectedTier = useMemo(
    () => tiers.find((tier) => tier.id === selectedTierId) || null,
    [tiers, selectedTierId]
  );

  const filteredCashshopItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return cashshopItems;
    return cashshopItems.filter((row) => {
      return (
        String(row.tblidx).includes(normalizedQuery) ||
        row.wszName.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [cashshopItems, query]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/admin/donation-tiers', { cache: 'no-store' });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Could not load donation tier admin data');
      }
      const nextTiers: DonationTier[] = res.data.tiers || [];
      const nextCashshopItems: CashshopItem[] = res.data.cashshopItems || [];
      setTiers(nextTiers);
      setCashshopItems(nextCashshopItems);
      const nextSelectedTierId =
        selectedTierId && nextTiers.some((tier) => tier.id === selectedTierId)
          ? selectedTierId
          : nextTiers[0]?.id ?? null;
      setSelectedTierId(nextSelectedTierId);
      const activeTier = nextTiers.find((tier) => tier.id === nextSelectedTierId);
      if (activeTier) {
        setSelectedTierDraft({
          title: activeTier.title || '',
          amount: String(activeTier.amount ?? 0),
          icon: activeTier.icon || 'award',
          order: String(activeTier.order ?? 0)
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load donation tier admin data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTier) return;
    setSelectedTierDraft({
      title: selectedTier.title || '',
      amount: String(selectedTier.amount ?? 0),
      icon: selectedTier.icon || 'award',
      order: String(selectedTier.order ?? 0)
    });
  }, [selectedTier]);

  async function createTier() {
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/admin/donation-tiers', {
        title: newTierDraft.title,
        amount: Number(newTierDraft.amount || 0),
        icon: newTierDraft.icon,
        order: Number(newTierDraft.order || 0)
      });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Failed to create tier');
      }
      setNewTierDraft({ title: '', amount: '0', icon: 'award', order: '0' });
      await loadAll();
      if (res.data?.tier?.id) {
        setSelectedTierId(Number(res.data.tier.id));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create tier');
    } finally {
      setSaving(false);
    }
  }

  async function saveSelectedTier() {
    if (!selectedTier) return;
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/admin/donation-tiers/update', {
        id: selectedTier.id,
        title: selectedTierDraft.title,
        amount: Number(selectedTierDraft.amount || 0),
        icon: selectedTierDraft.icon,
        order: Number(selectedTierDraft.order || 0)
      });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Failed to update tier');
      }
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to update tier');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedTier() {
    if (!selectedTier) return;
    const ok = window.confirm(`Delete tier "${selectedTier.title}" and all of its items?`);
    if (!ok) return;
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/admin/donation-tiers/delete', { id: selectedTier.id });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(res.data?.message || 'Failed to delete tier');
      }
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete tier');
    } finally {
      setSaving(false);
    }
  }

  async function upsertTierItem(payload: { id?: number; tierId: number; tblidx: number; amount: number; sortOrder: number }) {
    const res = await API.post('/admin/donation-tier-items/upsert', payload);
    if (res.status !== 200 || !res.data?.success) {
      throw new Error(res.data?.message || 'Failed to save tier item');
    }
    return res.data?.item as { id: number; tierId: number; tblidx: number; amount: number; sortOrder: number } | undefined;
  }

  async function removeTierItem(payload: { id?: number; tierId?: number; tblidx?: number }) {
    const res = await API.post('/admin/donation-tier-items/delete', payload);
    if (res.status !== 200 || !res.data?.success) {
      throw new Error(res.data?.message || 'Failed to remove tier item');
    }
  }

  async function handleAddToTier(item: CashshopItem) {
    if (!selectedTier) return;
    setSaving(true);
    setError('');
    try {
      const draft = addItemDraft[item.tblidx] || { amount: '1', sortOrder: '0' };
      const nextAmount = Math.max(1, Number(draft.amount || 1));
      const nextSortOrder = Math.max(0, Number(draft.sortOrder || 0));
      const savedItem = await upsertTierItem({
        tierId: selectedTier.id,
        tblidx: item.tblidx,
        amount: nextAmount,
        sortOrder: nextSortOrder
      });
      const savedId = Number(savedItem?.id || 0);
      setTiers((prev) =>
        prev.map((tier) => {
          if (tier.id !== selectedTier.id) return tier;
          const existingIndex = (tier.rewardItems || []).findIndex((reward) => reward.tblidx === item.tblidx);
          if (existingIndex >= 0) {
            return {
              ...tier,
              rewardItems: (tier.rewardItems || []).map((reward, idx) =>
                idx === existingIndex
                  ? {
                      ...reward,
                      id: savedId || reward.id,
                      amount: nextAmount,
                      sortOrder: nextSortOrder,
                      item
                    }
                  : reward
              )
            };
          }
          return {
            ...tier,
            rewardItems: [
              ...(tier.rewardItems || []),
              {
                id: savedId,
                tierId: selectedTier.id,
                tblidx: item.tblidx,
                amount: nextAmount,
                sortOrder: nextSortOrder,
                item
              }
            ]
          };
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to add item to tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTierItem(item: TierRewardItem) {
    if (!selectedTier) return;
    setSaving(true);
    setError('');
    try {
      const draft = editItemDraft[item.id] || { amount: String(item.amount), sortOrder: String(item.sortOrder ?? 0) };
      const nextAmount = Math.max(1, Number(draft.amount || 1));
      const nextSortOrder = Math.max(0, Number(draft.sortOrder || 0));
      await upsertTierItem({
        id: item.id,
        tierId: selectedTier.id,
        tblidx: item.tblidx,
        amount: nextAmount,
        sortOrder: nextSortOrder
      });
      setTiers((prev) =>
        prev.map((tier) =>
          tier.id !== selectedTier.id
            ? tier
            : {
                ...tier,
                rewardItems: (tier.rewardItems || []).map((reward) =>
                  reward.id === item.id
                    ? { ...reward, amount: nextAmount, sortOrder: nextSortOrder }
                    : reward
                )
              }
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update tier item');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTierItem(item: TierRewardItem) {
    if (!selectedTier) return;
    setSaving(true);
    setError('');
    try {
      await removeTierItem({ id: item.id });
      setTiers((prev) =>
        prev.map((tier) =>
          tier.id !== selectedTier.id
            ? tier
            : {
                ...tier,
                rewardItems: (tier.rewardItems || []).filter((reward) => reward.id !== item.id)
              }
        )
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to remove tier item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Donation Tiers Manager"
      subtitle="Create and edit donation tiers, then attach or adjust cashshop reward items per tier."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard title="Tier List" description="Select a tier to edit or create a new one.">
          <div className="space-y-3">
            <div className="max-h-72 overflow-auto rounded-xl border border-white/10">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`flex w-full items-center justify-between border-b border-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${
                    selectedTierId === tier.id ? 'bg-white/10' : ''
                  }`}
                >
                  <span>{tier.title}</span>
                  <span className="text-xs text-white/60">${tier.amount}</span>
                </button>
              ))}
              {tiers.length === 0 ? (
                <p className="px-3 py-4 text-sm text-white/60">No tiers found.</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/50">Create Tier</p>
              <div className="grid gap-2">
                <input
                  placeholder="Title"
                  value={newTierDraft.title}
                  onChange={(event) => setNewTierDraft((prev) => ({ ...prev, title: event.target.value }))}
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Amount"
                    value={newTierDraft.amount}
                    onChange={(event) => setNewTierDraft((prev) => ({ ...prev, amount: event.target.value }))}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Order"
                    value={newTierDraft.order}
                    onChange={(event) => setNewTierDraft((prev) => ({ ...prev, order: event.target.value }))}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  placeholder="Icon"
                  value={newTierDraft.icon}
                  onChange={(event) => setNewTierDraft((prev) => ({ ...prev, icon: event.target.value }))}
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm"
                />
                <button
                  onClick={createTier}
                  disabled={saving}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                >
                  Create Tier
                </button>
              </div>
            </div>
          </div>
        </AdminCard>

        <div className="flex flex-col gap-6">
          <AdminCard title="Selected Tier" description="Edit tier fields and assigned reward items.">
            {!selectedTier ? (
              <p className="text-sm text-white/60">Select a tier to begin editing.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/65">Tier Title</span>
                    <input
                      value={selectedTierDraft.title}
                      onChange={(event) => setSelectedTierDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                      placeholder="Tier title"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/65">Icon</span>
                    <input
                      value={selectedTierDraft.icon}
                      onChange={(event) => setSelectedTierDraft((prev) => ({ ...prev, icon: event.target.value }))}
                      className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                      placeholder="Icon"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/65">Required Amount ($)</span>
                    <input
                      value={selectedTierDraft.amount}
                      onChange={(event) => setSelectedTierDraft((prev) => ({ ...prev, amount: event.target.value }))}
                      className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                      placeholder="Amount"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/65">Display Order</span>
                    <input
                      value={selectedTierDraft.order}
                      onChange={(event) => setSelectedTierDraft((prev) => ({ ...prev, order: event.target.value }))}
                      className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                      placeholder="Order"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={saveSelectedTier}
                    disabled={saving}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60"
                  >
                    Save Tier
                  </button>
                  <button
                    onClick={deleteSelectedTier}
                    disabled={saving}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Delete Tier
                  </button>
                </div>

                <div className="rounded-xl border border-white/10">
                  <div className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/50">
                    Assigned Items
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {!!selectedTier.rewardItems?.length && (
                      <div className="grid grid-cols-[50px_90px_1fr_90px_90px_auto_auto] items-center gap-2 border-b border-white/10 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/55">
                        <span>Icon</span>
                        <span>tblidx</span>
                        <span>Item</span>
                        <span>Amount</span>
                        <span>Sort</span>
                        <span>Save</span>
                        <span>Remove</span>
                      </div>
                    )}
                    {(selectedTier.rewardItems || []).map((rewardItem) => {
                      const draft = editItemDraft[rewardItem.id] || {
                        amount: String(rewardItem.amount ?? 1),
                        sortOrder: String(rewardItem.sortOrder ?? 0)
                      };
                      return (
                        <div key={rewardItem.id} className="grid grid-cols-[50px_90px_1fr_90px_90px_auto_auto] items-center gap-2 border-b border-white/5 px-3 py-2 text-sm">
                          <div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center">
                            <Image
                              src={
                                rewardItem.item?.id && brokenIcons[rewardItem.item.id]
                                  ? '/icon/i_empty_cs_s.png'
                                  : iconPath(rewardItem.item?.szIcon_Name || '')
                              }
                              alt={rewardItem.item?.wszName || `item-${rewardItem.tblidx}`}
                              width={24}
                              height={24}
                              unoptimized
                              className="object-contain"
                              onError={() => {
                                if (!rewardItem.item?.id) return;
                                setBrokenIcons((prev) => ({
                                  ...prev,
                                  [rewardItem.item!.id]: true
                                }));
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs">{rewardItem.tblidx}</span>
                          <span className="truncate">
                            {rewardItem.item?.wszName || `Item ${rewardItem.tblidx}`}
                          </span>
                          <input
                            value={draft.amount}
                            onChange={(event) =>
                              setEditItemDraft((prev) => ({
                                ...prev,
                                [rewardItem.id]: {
                                  ...(prev[rewardItem.id] || { amount: '1', sortOrder: '0' }),
                                  amount: event.target.value
                                }
                              }))
                            }
                            className="rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                          />
                          <input
                            value={draft.sortOrder}
                            onChange={(event) =>
                              setEditItemDraft((prev) => ({
                                ...prev,
                                [rewardItem.id]: {
                                  ...(prev[rewardItem.id] || { amount: '1', sortOrder: '0' }),
                                  sortOrder: event.target.value
                                }
                              }))
                            }
                            className="rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleSaveTierItem(rewardItem)}
                            title="Save item changes"
                            aria-label="Save item changes"
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/20 hover:bg-white/10"
                            disabled={saving}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveTierItem(rewardItem)}
                            title="Remove item from tier"
                            aria-label="Remove item from tier"
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-red-500/30 text-red-200 hover:bg-red-500/10"
                            disabled={saving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {!selectedTier.rewardItems?.length ? (
                      <p className="px-3 py-4 text-sm text-white/60">No items assigned to this tier.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </AdminCard>

          <AdminCard title="All Cashshop Items" description="Preview and add any item to the selected tier.">
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by tblidx or name"
                className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
              />
              <button
                onClick={loadAll}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-white/70">Loading data...</p>
            ) : (
              <div className="max-h-[34rem] overflow-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-stone-900/95">
                    <tr className="text-left text-white/60">
                      <th className="px-3 py-2">Icon</th>
                      <th className="px-3 py-2">tblidx</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Sort</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCashshopItems.map((item) => {
                      const draft = addItemDraft[item.tblidx] || { amount: '1', sortOrder: '0' };
                      return (
                        <tr key={`${item.id}-${item.tblidx}`} className="border-t border-white/5 text-white/85">
                          <td className="px-3 py-2">
                            <div className="h-8 w-8 rounded border border-white/10 bg-black/35 flex items-center justify-center">
                              <Image
                                src={brokenIcons[item.id] ? '/icon/i_empty_cs_s.png' : iconPath(item.szIcon_Name)}
                                alt={item.wszName || `item-${item.tblidx}`}
                                width={24}
                                height={24}
                                unoptimized
                                className="object-contain"
                                onError={() =>
                                  setBrokenIcons((prev) => ({
                                    ...prev,
                                    [item.id]: true
                                  }))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{item.tblidx}</td>
                          <td className="px-3 py-2">{item.wszName || '-'}</td>
                          <td className="px-3 py-2">{item.dwCash}</td>
                          <td className="px-3 py-2">
                            <input
                              value={draft.amount}
                              onChange={(event) =>
                                setAddItemDraft((prev) => ({
                                  ...prev,
                                  [item.tblidx]: {
                                    ...(prev[item.tblidx] || { amount: '1', sortOrder: '0' }),
                                    amount: event.target.value
                                  }
                                }))
                              }
                              className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={draft.sortOrder}
                              onChange={(event) =>
                                setAddItemDraft((prev) => ({
                                  ...prev,
                                  [item.tblidx]: {
                                    ...(prev[item.tblidx] || { amount: '1', sortOrder: '0' }),
                                    sortOrder: event.target.value
                                  }
                                }))
                              }
                              className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => handleAddToTier(item)}
                              disabled={saving || !selectedTier}
                              title={selectedTier ? 'Add item to selected tier' : 'Select a tier first'}
                              aria-label="Add item to selected tier"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-60"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </AdminShell>
  );
}
