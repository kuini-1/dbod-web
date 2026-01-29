'use client';

import { useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';

export default function AdminItemsPage() {
  const [actionResult, setActionResult] = useState('');

  const [giveCharId, setGiveCharId] = useState('');
  const [giveItemTblidx, setGiveItemTblidx] = useState('');
  const [giveCount, setGiveCount] = useState('1');

  const [giveAllItemTblidx, setGiveAllItemTblidx] = useState('');
  const [giveAllCount, setGiveAllCount] = useState('1');

  const [customCharId, setCustomCharId] = useState('');
  const [customItemTblidx, setCustomItemTblidx] = useState('');
  const [customCount, setCustomCount] = useState('1');
  const [customRank, setCustomRank] = useState('');
  const [customGrade, setCustomGrade] = useState('');
  const [customDurability, setCustomDurability] = useState('');
  const [customBattleAttribute, setCustomBattleAttribute] = useState('');
  const [customRestrictState, setCustomRestrictState] = useState('');
  const [customNeedIdentify, setCustomNeedIdentify] = useState(false);
  const [customDurationType, setCustomDurationType] = useState('');
  const [customDurationSeconds, setCustomDurationSeconds] = useState('');
  const [customUseDefaultOptions, setCustomUseDefaultOptions] = useState(true);
  const [customEnchantAble, setCustomEnchantAble] = useState(false);
  const [customOptionTblidx, setCustomOptionTblidx] = useState('');
  const [customRandomOptions, setCustomRandomOptions] = useState('');
  const [customMaker, setCustomMaker] = useState('');

  async function postAdmin(url: string, body: any) {
    const res = await API.post(url, body, { cache: 'no-store' });
    if (res.status !== 200) {
      throw new Error(res.data?.error || res.statusText || 'Request failed');
    }
    return res.data;
  }

  function setResult(label: string, result: any) {
    setActionResult(`${label}: result=${result.resultCode} affected=${result.affectedCount || 0}`);
  }

  function parseOptionTblidx(values: string) {
    return values
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((value) => Number.isFinite(value));
  }

  function parseRandomOptions(values: string) {
    if (!values.trim()) return [];
    try {
      const parsed = JSON.parse(values);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      return [];
    }
    return [];
  }

  return (
    <AdminShell title="Item Tools" subtitle="Deliver items to one player or every online character.">
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Give Item (Single)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={giveCharId}
              onChange={(event) => setGiveCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Item Tblidx"
              value={giveItemTblidx}
              onChange={(event) => setGiveItemTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Count"
              value={giveCount}
              onChange={(event) => setGiveCount(event.target.value)}
            />
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={async () => {
                const result = await postAdmin('/admin/give-item', {
                  charId: giveCharId,
                  itemTblidx: Number(giveItemTblidx || 0),
                  count: Number(giveCount || 1)
                });
                setResult('Give Item', result);
              }}
            >
              Give Item
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Give Item (All Players)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Item Tblidx"
              value={giveAllItemTblidx}
              onChange={(event) => setGiveAllItemTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Count"
              value={giveAllCount}
              onChange={(event) => setGiveAllCount(event.target.value)}
            />
            <button
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
              onClick={async () => {
                const result = await postAdmin('/admin/give-item-all', {
                  itemTblidx: Number(giveAllItemTblidx || 0),
                  count: Number(giveAllCount || 1)
                });
                setResult('Give Item All', result);
              }}
            >
              Give Item to All
            </button>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Custom Item Builder" description="Full item customization (options, duration, maker).">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Char ID"
            value={customCharId}
            onChange={(event) => setCustomCharId(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Item Tblidx"
            value={customItemTblidx}
            onChange={(event) => setCustomItemTblidx(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Count"
            value={customCount}
            onChange={(event) => setCustomCount(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Rank (optional)"
            value={customRank}
            onChange={(event) => setCustomRank(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Grade (optional)"
            value={customGrade}
            onChange={(event) => setCustomGrade(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Durability (optional)"
            value={customDurability}
            onChange={(event) => setCustomDurability(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Battle Attribute (optional)"
            value={customBattleAttribute}
            onChange={(event) => setCustomBattleAttribute(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Restrict State (optional)"
            value={customRestrictState}
            onChange={(event) => setCustomRestrictState(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Duration Type (optional)"
            value={customDurationType}
            onChange={(event) => setCustomDurationType(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Duration Seconds (optional)"
            value={customDurationSeconds}
            onChange={(event) => setCustomDurationSeconds(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Maker Name (optional)"
            value={customMaker}
            onChange={(event) => setCustomMaker(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Option Tblidx list (comma separated)"
            value={customOptionTblidx}
            onChange={(event) => setCustomOptionTblidx(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Random Options (JSON array)"
            value={customRandomOptions}
            onChange={(event) => setCustomRandomOptions(event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={customNeedIdentify}
              onChange={(event) => setCustomNeedIdentify(event.target.checked)}
            />
            Need Identify
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={customUseDefaultOptions}
              onChange={(event) => setCustomUseDefaultOptions(event.target.checked)}
            />
            Use Default Options
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={customEnchantAble}
              onChange={(event) => setCustomEnchantAble(event.target.checked)}
            />
            Enchantable
          </label>
        </div>

        <button
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          onClick={async () => {
            const result = await postAdmin('/admin/give-item-custom', {
              charId: customCharId,
              itemTblidx: Number(customItemTblidx || 0),
              count: Number(customCount || 1),
              rank: customRank === '' ? undefined : Number(customRank),
              grade: customGrade === '' ? undefined : Number(customGrade),
              durability: customDurability === '' ? undefined : Number(customDurability),
              battleAttribute:
                customBattleAttribute === '' ? undefined : Number(customBattleAttribute),
              restrictState:
                customRestrictState === '' ? undefined : Number(customRestrictState),
              needIdentify: customNeedIdentify,
              durationType: customDurationType === '' ? undefined : Number(customDurationType),
              durationSeconds: Number(customDurationSeconds || 0),
              useDefaultOptions: customUseDefaultOptions,
              enchantAble: customEnchantAble,
              optionTblidx: parseOptionTblidx(customOptionTblidx),
              randomOptions: parseRandomOptions(customRandomOptions),
              maker: customMaker
            });
            setResult('Custom Item', result);
          }}
        >
          Create Custom Item
        </button>
      </AdminCard>

      {actionResult ? (
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
          {actionResult}
        </div>
      ) : null}
    </AdminShell>
  );
}
