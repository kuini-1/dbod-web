'use client';

import { useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';

export default function AdminBuffsPage() {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
  const [actionResult, setActionResult] = useState('');

  const [skillCharId, setSkillCharId] = useState('');
  const [skillTblidx, setSkillTblidx] = useState('');
  const [skillDuration, setSkillDuration] = useState('0');
  const [skillValues, setSkillValues] = useState('');

  const [skillAllTblidx, setSkillAllTblidx] = useState('');
  const [skillAllDuration, setSkillAllDuration] = useState('0');
  const [skillAllValues, setSkillAllValues] = useState('');

  const [itemCharId, setItemCharId] = useState('');
  const [useItemTblidx, setUseItemTblidx] = useState('');
  const [itemDuration, setItemDuration] = useState('0');
  const [itemValues, setItemValues] = useState('');

  const [useItemAllTblidx, setUseItemAllTblidx] = useState('');
  const [itemAllDuration, setItemAllDuration] = useState('0');
  const [itemAllValues, setItemAllValues] = useState('');

  const [removeSkillCharId, setRemoveSkillCharId] = useState('');
  const [removeSkillTblidx, setRemoveSkillTblidx] = useState('');
  const [removeSkillAllTblidx, setRemoveSkillAllTblidx] = useState('');

  const [removeEffectCharId, setRemoveEffectCharId] = useState('');
  const [removeEffectCode, setRemoveEffectCode] = useState('');
  const [removeEffectAllCode, setRemoveEffectAllCode] = useState('');

  const [clearCharId, setClearCharId] = useState('');

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

  return (
    <AdminShell title={tx('Buff Manager', '버프 관리자')} subtitle={tx('Apply skill or item buffs with custom duration and values.', '지속시간과 수치를 지정해 스킬/아이템 버프를 적용합니다.')}>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Apply Skill Buff (Single)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={skillCharId}
              onChange={(event) => setSkillCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Skill Tblidx"
              value={skillTblidx}
              onChange={(event) => setSkillTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration seconds (0 = table)"
              value={skillDuration}
              onChange={(event) => setSkillDuration(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect values (comma separated)"
              value={skillValues}
              onChange={(event) => setSkillValues(event.target.value)}
            />
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={async () => {
                const result = await postAdmin('/admin/apply-buff', {
                  charId: skillCharId,
                  skillTblidx: Number(skillTblidx || 0),
                  durationSeconds: Number(skillDuration || 0),
                  effectValues: skillValues
                });
                setResult('Apply Skill', result);
              }}
            >
              Apply Buff
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Apply Skill Buff (All Players)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Skill Tblidx"
              value={skillAllTblidx}
              onChange={(event) => setSkillAllTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration seconds (0 = table)"
              value={skillAllDuration}
              onChange={(event) => setSkillAllDuration(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect values (comma separated)"
              value={skillAllValues}
              onChange={(event) => setSkillAllValues(event.target.value)}
            />
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={async () => {
                const result = await postAdmin('/admin/apply-buff-all', {
                  skillTblidx: Number(skillAllTblidx || 0),
                  durationSeconds: Number(skillAllDuration || 0),
                  effectValues: skillAllValues
                });
                setResult('Apply Skill All', result);
              }}
            >
              Apply Buff to All
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Apply Use Item Buff (Single)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={itemCharId}
              onChange={(event) => setItemCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Use Item Tblidx"
              value={useItemTblidx}
              onChange={(event) => setUseItemTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration seconds (0 = table)"
              value={itemDuration}
              onChange={(event) => setItemDuration(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect values (comma separated)"
              value={itemValues}
              onChange={(event) => setItemValues(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/apply-buff-item', {
                  charId: itemCharId,
                  useItemTblidx: Number(useItemTblidx || 0),
                  durationSeconds: Number(itemDuration || 0),
                  effectValues: itemValues
                });
                setResult('Apply Use Item', result);
              }}
            >
              Apply Use Item Buff
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Apply Use Item Buff (All Players)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Use Item Tblidx"
              value={useItemAllTblidx}
              onChange={(event) => setUseItemAllTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration seconds (0 = table)"
              value={itemAllDuration}
              onChange={(event) => setItemAllDuration(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect values (comma separated)"
              value={itemAllValues}
              onChange={(event) => setItemAllValues(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/apply-buff-item-all', {
                  useItemTblidx: Number(useItemAllTblidx || 0),
                  durationSeconds: Number(itemAllDuration || 0),
                  effectValues: itemAllValues
                });
                setResult('Apply Use Item All', result);
              }}
            >
              Apply Use Item Buff to All
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Remove Buff by Skill">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={removeSkillCharId}
              onChange={(event) => setRemoveSkillCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Skill Tblidx"
              value={removeSkillTblidx}
              onChange={(event) => setRemoveSkillTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/remove-buff-skill', {
                  charId: removeSkillCharId,
                  skillTblidx: Number(removeSkillTblidx || 0)
                });
                setResult('Remove Skill', result);
              }}
            >
              Remove Skill Buff
            </button>
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Skill Tblidx (all players)"
              value={removeSkillAllTblidx}
              onChange={(event) => setRemoveSkillAllTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/remove-buff-skill-all', {
                  skillTblidx: Number(removeSkillAllTblidx || 0)
                });
                setResult('Remove Skill All', result);
              }}
            >
              Remove Skill Buffs (All)
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Remove Buff by Effect">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={removeEffectCharId}
              onChange={(event) => setRemoveEffectCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect Code"
              value={removeEffectCode}
              onChange={(event) => setRemoveEffectCode(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/remove-buff-effect', {
                  charId: removeEffectCharId,
                  effectCode: Number(removeEffectCode || 0)
                });
                setResult('Remove Effect', result);
              }}
            >
              Remove Effect Buff
            </button>
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect Code (all players)"
              value={removeEffectAllCode}
              onChange={(event) => setRemoveEffectAllCode(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/remove-buff-effect-all', {
                  effectCode: Number(removeEffectAllCode || 0)
                });
                setResult('Remove Effect All', result);
              }}
            >
              Remove Effect Buffs (All)
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Clear Buffs (Single)">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={clearCharId}
              onChange={(event) => setClearCharId(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/clear-buffs', { charId: clearCharId });
                setResult('Clear Buffs', result);
              }}
            >
              Clear Buffs
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Clear Buffs (All Players)">
          <div className="flex flex-col gap-3">
            <button
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
              onClick={async () => {
                const result = await postAdmin('/admin/clear-buffs-all', {});
                setResult('Clear Buffs All', result);
              }}
            >
              Clear Buffs for All Players
            </button>
          </div>
        </AdminCard>
      </div>

      {actionResult ? (
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
          {actionResult}
        </div>
      ) : null}
    </AdminShell>
  );
}
