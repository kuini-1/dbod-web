'use client';

import { useEffect, useMemo, useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';

export default function AdminServerPage() {
  const [actionResult, setActionResult] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeChannel, setNoticeChannel] = useState('');
  const [gmCharId, setGmCharId] = useState('');
  const [gmCommand, setGmCommand] = useState('');

  const [masterQueryType, setMasterQueryType] = useState('masterUptime');
  const [masterQueryResult, setMasterQueryResult] = useState('');
  const [masterQueryPage, setMasterQueryPage] = useState(0);
  const [masterQueryPageSize, setMasterQueryPageSize] = useState(50);

  const [soloExpBonus, setSoloExpBonus] = useState('');
  const [partyExpBonus, setPartyExpBonus] = useState('');
  const [questExpBonus, setQuestExpBonus] = useState('');
  const [craftExpBonus, setCraftExpBonus] = useState('');
  const [zeniDropBonus, setZeniDropBonus] = useState('');
  const [questMoneyBonus, setQuestMoneyBonus] = useState('');
  const [upgradeRateBonus, setUpgradeRateBonus] = useState('');

  const [monsterAggressive, setMonsterAggressive] = useState(false);
  const [monsterWorldRuleType, setMonsterWorldRuleType] = useState('0'); // 0 = GAMERULE_NORMAL
  const [monsterMaxLpBonus, setMonsterMaxLpBonus] = useState('');
  const [monsterMaxEpBonus, setMonsterMaxEpBonus] = useState('');
  const [monsterPhysOffBonus, setMonsterPhysOffBonus] = useState('');
  const [monsterEngOffBonus, setMonsterEngOffBonus] = useState('');
  const [monsterPhysDefBonus, setMonsterPhysDefBonus] = useState('');
  const [monsterEngDefBonus, setMonsterEngDefBonus] = useState('');
  const [monsterAttackRateBonus, setMonsterAttackRateBonus] = useState('');
  const [monsterDodgeRateBonus, setMonsterDodgeRateBonus] = useState('');

  const [monsterBuffSkillTblidx, setMonsterBuffSkillTblidx] = useState('');
  const [monsterBuffDurationSeconds, setMonsterBuffDurationSeconds] = useState('');
  const [monsterBuffEffectValues, setMonsterBuffEffectValues] = useState('');

  const [channelBonusChannelId, setChannelBonusChannelId] = useState('');
  const [channelMaxLpBonus, setChannelMaxLpBonus] = useState('');
  const [channelMaxEpBonus, setChannelMaxEpBonus] = useState('');
  const [channelPhysOffBonus, setChannelPhysOffBonus] = useState('');
  const [channelEngOffBonus, setChannelEngOffBonus] = useState('');
  const [channelPhysDefBonus, setChannelPhysDefBonus] = useState('');
  const [channelEngDefBonus, setChannelEngDefBonus] = useState('');
  const [channelAttackRateBonus, setChannelAttackRateBonus] = useState('');
  const [channelDodgeRateBonus, setChannelDodgeRateBonus] = useState('');

  const [killDebuffEnabled, setKillDebuffEnabled] = useState(false);
  const [killDebuffSkillTblidx, setKillDebuffSkillTblidx] = useState('');
  const [killDebuffDurationSeconds, setKillDebuffDurationSeconds] = useState('');
  const [killDebuffEffectValues, setKillDebuffEffectValues] = useState('');

  const [bonusState, setBonusState] = useState<any | null>(null);

  const masterQueries = useMemo(
    () => [
      { id: 'masterUptime', label: 'Master Uptime' },
      { id: 'masterTime', label: 'Master Time' },
      { id: 'masterConfig', label: 'Master Config' },
      { id: 'serverCounts', label: 'Server Counts' },
      { id: 'sessionCounts', label: 'Session Counts' },
      { id: 'playerCounts', label: 'Player Counts' },
      { id: 'gameFarmList', label: 'Game Farm List' },
      { id: 'gameChannelList', label: 'Game Channel List' },
      { id: 'authServerList', label: 'Auth Server List' },
      { id: 'charServerList', label: 'Character Server List' },
      { id: 'chatServerList', label: 'Chat Server List' },
      { id: 'gameServerList', label: 'Game Server List' },
      { id: 'queryServerList', label: 'Query Server List' },
      { id: 'serverListAll', label: 'All Servers List' },
      { id: 'onlineCountByChannel', label: 'Online Count By Channel' },
      { id: 'onlineCountByFarm', label: 'Online Count By Farm' },
      { id: 'onlineAccountList', label: 'Online Account List' },
      { id: 'webRequestStats', label: 'Web Request Stats' },
      { id: 'serverLoadSummary', label: 'Server Load Summary' },
      { id: 'channelVisibilityList', label: 'Channel Visibility List' },
      { id: 'scrambleChannelList', label: 'Scramble Channel List' }
    ],
    []
  );

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

  async function loadBonusState() {
    try {
      const result = await postAdmin('/admin/bonus-state', {});
      setBonusState(result);
    } catch (error) {
      setBonusState(null);
    }
  }

  useEffect(() => {
    loadBonusState();
  }, []);

  return (
    <AdminShell title="Server Tools" subtitle="Broadcast messages and run master queries.">
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Current Bonus State">
          <div className="flex flex-col gap-2 text-sm text-white/70">
            <button
              className="self-start rounded-xl border border-white/10 px-3 py-1 text-xs hover:bg-white/10"
              onClick={loadBonusState}
            >
              Refresh Bonus State
            </button>
            {!bonusState && <span>No bonus state loaded.</span>}
            {bonusState && (
              <div className="flex flex-col gap-1">
                <span>Solo EXP Bonus: {bonusState.soloExpBonus}%</span>
                <span>Party EXP Bonus: {bonusState.partyExpBonus}%</span>
                <span>Quest EXP Bonus: {bonusState.questExpBonus}%</span>
                <span>Craft EXP Bonus: {bonusState.craftExpBonus}%</span>
                <span>Zeni Drop Bonus: {bonusState.zeniDropBonus}%</span>
                <span>Quest Money Bonus: {bonusState.questMoneyBonus}%</span>
                <span>Upgrade Rate Bonus: {bonusState.upgradeRateBonus}%</span>
                <span>Monster Aggressive: {bonusState.monsterAggressive ? 'On' : 'Off'}</span>
                <span>Monster LP Bonus: {bonusState.monsterMaxLpPercent}%</span>
                <span>Monster EP Bonus: {bonusState.monsterMaxEpPercent}%</span>
                <span>Monster Physical Off: {bonusState.monsterPhysicalOffencePercent}%</span>
                <span>Monster Energy Off: {bonusState.monsterEnergyOffencePercent}%</span>
                <span>Monster Physical Def: {bonusState.monsterPhysicalDefencePercent}%</span>
                <span>Monster Energy Def: {bonusState.monsterEnergyDefencePercent}%</span>
                <span>Monster Attack Rate: {bonusState.monsterAttackRatePercent}%</span>
                <span>Monster Dodge Rate: {bonusState.monsterDodgeRatePercent}%</span>
                <span>Kill Debuff: {bonusState.killDebuffEnabled ? 'Enabled' : 'Disabled'}</span>
                <span>Kill Debuff Skill: {bonusState.killDebuffSkillTblidx}</span>
                <span>Kill Debuff Duration: {bonusState.killDebuffDurationSeconds}s</span>
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard title="Channel Bonuses">
          <div className="flex flex-col gap-2 text-sm text-white/70">
            {!bonusState?.channelBonuses?.length && <span>No channel bonuses set.</span>}
            {bonusState?.channelBonuses?.length > 0 &&
              bonusState.channelBonuses.map((bonus: any) => (
                <div key={bonus.channelId} className="rounded-xl border border-white/10 px-3 py-2">
                  <div>Channel {bonus.channelId}</div>
                  <div>LP {bonus.maxLpPercent}% EP {bonus.maxEpPercent}%</div>
                  <div>Phys Off {bonus.physicalOffencePercent}% Eng Off {bonus.energyOffencePercent}%</div>
                  <div>Phys Def {bonus.physicalDefencePercent}% Eng Def {bonus.energyDefencePercent}%</div>
                  <div>Attack {bonus.attackRatePercent}% Dodge {bonus.dodgeRatePercent}%</div>
                </div>
              ))}
          </div>
        </AdminCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Send Notice">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Message"
              value={noticeMessage}
              onChange={(event) => setNoticeMessage(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Channel ID (blank = all)"
              value={noticeChannel}
              onChange={(event) => setNoticeChannel(event.target.value)}
            />
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={async () => {
                const result = await postAdmin('/admin/notice', {
                  message: noticeMessage,
                  channelId: noticeChannel === '' ? undefined : Number(noticeChannel)
                });
                setResult('Notice', result);
              }}
            >
              Send Notice
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Execute GM Command">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={gmCharId}
              onChange={(event) => setGmCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="GM command (example: @notice 1 hello)"
              value={gmCommand}
              onChange={(event) => setGmCommand(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/exec-gm-command', {
                  charId: gmCharId,
                  command: gmCommand
                });
                setResult('GM Command', result);
              }}
            >
              Execute Command
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Event Bonuses">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Solo EXP Bonus %"
              value={soloExpBonus}
              onChange={(event) => setSoloExpBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-solo-exp-bonus', {
                  bonusPercent: Number(soloExpBonus || 0)
                });
                setResult('Solo EXP Bonus', result);
              }}
            >
              Set Solo EXP Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Party EXP Bonus %"
              value={partyExpBonus}
              onChange={(event) => setPartyExpBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-party-exp-bonus', {
                  bonusPercent: Number(partyExpBonus || 0)
                });
                setResult('Party EXP Bonus', result);
              }}
            >
              Set Party EXP Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Quest EXP Bonus %"
              value={questExpBonus}
              onChange={(event) => setQuestExpBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-quest-exp-bonus', {
                  bonusPercent: Number(questExpBonus || 0)
                });
                setResult('Quest EXP Bonus', result);
              }}
            >
              Set Quest EXP Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Craft EXP Bonus %"
              value={craftExpBonus}
              onChange={(event) => setCraftExpBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-craft-exp-bonus', {
                  bonusPercent: Number(craftExpBonus || 0)
                });
                setResult('Craft EXP Bonus', result);
              }}
            >
              Set Craft EXP Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Zeni Drop Bonus %"
              value={zeniDropBonus}
              onChange={(event) => setZeniDropBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-zeni-drop-bonus', {
                  bonusPercent: Number(zeniDropBonus || 0)
                });
                setResult('Zeni Drop Bonus', result);
              }}
            >
              Set Zeni Drop Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Quest Money Bonus %"
              value={questMoneyBonus}
              onChange={(event) => setQuestMoneyBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-quest-money-bonus', {
                  bonusPercent: Number(questMoneyBonus || 0)
                });
                setResult('Quest Money Bonus', result);
              }}
            >
              Set Quest Money Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Upgrade Rate Bonus %"
              value={upgradeRateBonus}
              onChange={(event) => setUpgradeRateBonus(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-upgrade-rate-bonus', {
                  bonusPercent: Number(upgradeRateBonus || 0)
                });
                setResult('Upgrade Rate Bonus', result);
              }}
            >
              Set Upgrade Rate Bonus
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Monster Controls">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={monsterAggressive}
                onChange={(event) => setMonsterAggressive(event.target.checked)}
              />
              Force Aggressive
            </label>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-monster-aggressive', {
                  enable: monsterAggressive
                });
                setResult('Monster Aggressive', result);
              }}
            >
              Apply Aggressive Toggle
            </button>

            <label className="text-sm text-white/80">World Type</label>
            <select
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              value={monsterWorldRuleType}
              onChange={(event) => setMonsterWorldRuleType(event.target.value)}
            >
              <option value="0">Normal World</option>
              <option value="5">Ultimate Dungeon (Hunt)</option>
              <option value="6">Time Machine Quest</option>
              <option value="14">CCBD</option>
              <option value="3">Dojo</option>
              <option value="1">Rank Battle</option>
              <option value="8">Minor Match</option>
              <option value="9">Major Match</option>
              <option value="10">Final Match</option>
              <option value="2">Mudosa</option>
              <option value="4">Raid</option>
              <option value="7">Tutorial</option>
              <option value="11">Teinkaichi Budokai</option>
              <option value="12">TLQ</option>
              <option value="13">DWC</option>
            </select>

            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Max LP %"
                value={monsterMaxLpBonus}
                onChange={(event) => setMonsterMaxLpBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Max EP %"
                value={monsterMaxEpBonus}
                onChange={(event) => setMonsterMaxEpBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Physical Off %"
                value={monsterPhysOffBonus}
                onChange={(event) => setMonsterPhysOffBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Energy Off %"
                value={monsterEngOffBonus}
                onChange={(event) => setMonsterEngOffBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Physical Def %"
                value={monsterPhysDefBonus}
                onChange={(event) => setMonsterPhysDefBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Energy Def %"
                value={monsterEngDefBonus}
                onChange={(event) => setMonsterEngDefBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Attack Rate %"
                value={monsterAttackRateBonus}
                onChange={(event) => setMonsterAttackRateBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Dodge Rate %"
                value={monsterDodgeRateBonus}
                onChange={(event) => setMonsterDodgeRateBonus(event.target.value)}
              />
            </div>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-monster-stat-bonus', {
                  worldRuleType: Number(monsterWorldRuleType || 0),
                  maxLpPercent: Number(monsterMaxLpBonus || 0),
                  maxEpPercent: Number(monsterMaxEpBonus || 0),
                  physicalOffencePercent: Number(monsterPhysOffBonus || 0),
                  energyOffencePercent: Number(monsterEngOffBonus || 0),
                  physicalDefencePercent: Number(monsterPhysDefBonus || 0),
                  energyDefencePercent: Number(monsterEngDefBonus || 0),
                  attackRatePercent: Number(monsterAttackRateBonus || 0),
                  dodgeRatePercent: Number(monsterDodgeRateBonus || 0)
                });
                setResult('Monster Stat Bonus', result);
                loadBonusState();
              }}
            >
              Apply Monster Stat Bonus
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Buff Skill Tblidx"
              value={monsterBuffSkillTblidx}
              onChange={(event) => setMonsterBuffSkillTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration Seconds"
              value={monsterBuffDurationSeconds}
              onChange={(event) => setMonsterBuffDurationSeconds(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect Values (comma-separated)"
              value={monsterBuffEffectValues}
              onChange={(event) => setMonsterBuffEffectValues(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/monster-buff-all', {
                  skillTblidx: Number(monsterBuffSkillTblidx || 0),
                  durationSeconds: Number(monsterBuffDurationSeconds || 0),
                  effectValues: monsterBuffEffectValues
                });
                setResult('Monster Buff All', result);
              }}
            >
              Apply Monster Buff (All)
            </button>

            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/clear-monster-buffs-all', {});
                setResult('Clear Monster Buffs', result);
              }}
            >
              Clear All Monster Buffs
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Channel Stat Bonus">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Channel ID"
              value={channelBonusChannelId}
              onChange={(event) => setChannelBonusChannelId(event.target.value)}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Max LP %"
                value={channelMaxLpBonus}
                onChange={(event) => setChannelMaxLpBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Max EP %"
                value={channelMaxEpBonus}
                onChange={(event) => setChannelMaxEpBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Physical Off %"
                value={channelPhysOffBonus}
                onChange={(event) => setChannelPhysOffBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Energy Off %"
                value={channelEngOffBonus}
                onChange={(event) => setChannelEngOffBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Physical Def %"
                value={channelPhysDefBonus}
                onChange={(event) => setChannelPhysDefBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Energy Def %"
                value={channelEngDefBonus}
                onChange={(event) => setChannelEngDefBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Attack Rate %"
                value={channelAttackRateBonus}
                onChange={(event) => setChannelAttackRateBonus(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Dodge Rate %"
                value={channelDodgeRateBonus}
                onChange={(event) => setChannelDodgeRateBonus(event.target.value)}
              />
            </div>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-channel-stat-bonus', {
                  channelId: Number(channelBonusChannelId || 0),
                  maxLpPercent: Number(channelMaxLpBonus || 0),
                  maxEpPercent: Number(channelMaxEpBonus || 0),
                  physicalOffencePercent: Number(channelPhysOffBonus || 0),
                  energyOffencePercent: Number(channelEngOffBonus || 0),
                  physicalDefencePercent: Number(channelPhysDefBonus || 0),
                  energyDefencePercent: Number(channelEngDefBonus || 0),
                  attackRatePercent: Number(channelAttackRateBonus || 0),
                  dodgeRatePercent: Number(channelDodgeRateBonus || 0)
                });
                setResult('Channel Stat Bonus', result);
                loadBonusState();
              }}
            >
              Apply Channel Bonus
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Kill Debuff">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={killDebuffEnabled}
                onChange={(event) => setKillDebuffEnabled(event.target.checked)}
              />
              Enable Kill Debuff
            </label>
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Debuff Skill Tblidx"
              value={killDebuffSkillTblidx}
              onChange={(event) => setKillDebuffSkillTblidx(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration Seconds"
              value={killDebuffDurationSeconds}
              onChange={(event) => setKillDebuffDurationSeconds(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Effect Values (comma-separated)"
              value={killDebuffEffectValues}
              onChange={(event) => setKillDebuffEffectValues(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-kill-debuff', {
                  enable: killDebuffEnabled,
                  skillTblidx: Number(killDebuffSkillTblidx || 0),
                  durationSeconds: Number(killDebuffDurationSeconds || 0),
                  effectValues: killDebuffEffectValues
                });
                setResult('Kill Debuff', result);
                loadBonusState();
              }}
            >
              Apply Kill Debuff
            </button>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Master Queries">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={masterQueryType}
            onChange={(event) => setMasterQueryType(event.target.value)}
          >
            {masterQueries.map((query) => (
              <option key={query.id} value={query.id}>
                {query.label}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Page"
            value={masterQueryPage}
            onChange={(event) => setMasterQueryPage(Number(event.target.value || 0))}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Page size"
            value={masterQueryPageSize}
            onChange={(event) => setMasterQueryPageSize(Number(event.target.value || 50))}
          />
        </div>

        <button
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          onClick={async () => {
            const result = await postAdmin('/admin/master-query', {
              type: masterQueryType,
              page: masterQueryPage,
              pageSize: masterQueryPageSize
            });
            setMasterQueryResult(JSON.stringify(result, null, 2));
          }}
        >
          Run Query
        </button>

        {masterQueryResult ? (
          <pre className="mt-4 max-h-[400px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
            {masterQueryResult}
          </pre>
        ) : null}
      </AdminCard>

      {actionResult ? (
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/80">
          {actionResult}
        </div>
      ) : null}
    </AdminShell>
  );
}
