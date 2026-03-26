'use client';

import { useEffect, useMemo, useState } from 'react';
import { API } from '@/lib/api/client';
import AdminShell from '@/components/admin/AdminShell';
import AdminCard from '@/components/admin/AdminCard';
import { useLocale } from '@/components/LocaleProvider';

type OnlinePlayer = {
  accountId: number;
  charId: number;
  charName: string;
  serverFarmId: number;
  serverChannelId: number;
};

export default function AdminPlayersPage() {
  const { locale } = useLocale();
  const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineTotal, setOnlineTotal] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [actionResult, setActionResult] = useState('');

  const [kickTarget, setKickTarget] = useState('');
  const [healCharId, setHealCharId] = useState('');
  const [zeniCharId, setZeniCharId] = useState('');
  const [zeniAmount, setZeniAmount] = useState('');
  const [zeniAdd, setZeniAdd] = useState(true);

  const [levelCharId, setLevelCharId] = useState('');
  const [levelValue, setLevelValue] = useState('');
  const [classCharId, setClassCharId] = useState('');
  const [classValue, setClassValue] = useState('');
  const [killCharId, setKillCharId] = useState('');

  const [portalCharId, setPortalCharId] = useState('');
  const [portalTblidx, setPortalTblidx] = useState('');
  const [worldCharId, setWorldCharId] = useState('');
  const [worldId, setWorldId] = useState('');
  const [coordCharId, setCoordCharId] = useState('');
  const [coordWorldId, setCoordWorldId] = useState('');
  const [coordX, setCoordX] = useState('');
  const [coordY, setCoordY] = useState('');
  const [coordZ, setCoordZ] = useState('');

  const [muteCharId, setMuteCharId] = useState('');
  const [muteMinutes, setMuteMinutes] = useState('10');
  const [muteReason, setMuteReason] = useState('');
  const [unmuteCharId, setUnmuteCharId] = useState('');

  const [expCharId, setExpCharId] = useState('');
  const [expEnable, setExpEnable] = useState(true);
  const [resetExpCharId, setResetExpCharId] = useState('');

  const [learnSkillCharId, setLearnSkillCharId] = useState('');
  const [learnSkillTblidx, setLearnSkillTblidx] = useState('');
  const [addTitleCharId, setAddTitleCharId] = useState('');
  const [addTitleTblidx, setAddTitleTblidx] = useState('');
  const [removeTitleCharId, setRemoveTitleCharId] = useState('');
  const [removeTitleTblidx, setRemoveTitleTblidx] = useState('');

  const [resetSkillCooldownCharId, setResetSkillCooldownCharId] = useState('');

  const filteredPlayers = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    const channelFilter = filterChannel.trim();
    return onlinePlayers.filter((player) => {
      const matchesText =
        text.length === 0 ||
        player.charName.toLowerCase().includes(text) ||
        String(player.charId).includes(text) ||
        String(player.accountId).includes(text);
      const matchesChannel =
        channelFilter.length === 0 || String(player.serverChannelId) === channelFilter;
      return matchesText && matchesChannel;
    });
  }, [onlinePlayers, filterText, filterChannel]);

  async function postAdmin(url: string, body: any) {
    const res = await API.post(url, body, { cache: 'no-store' });
    if (res.status !== 200) {
      throw new Error(res.data?.error || res.statusText || 'Request failed');
    }
    return res.data;
  }

  async function loadOnlinePlayers() {
    try {
      const res = await postAdmin('/admin/online-players', {});
      setOnlinePlayers(res.players || []);
      setOnlineTotal(res.totalCount || 0);
    } catch (err: any) {
      setActionResult(err.message || 'Online players fetch failed');
    }
  }

  useEffect(() => {
    loadOnlinePlayers();
    // Intentionally run once on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setResult(label: string, result: any) {
    setActionResult(`${label}: result=${result.resultCode} affected=${result.affectedCount || 0}`);
  }

  return (
    <AdminShell title={tx('Player Controls', '플레이어 제어')} subtitle={tx('Live roster and actions on connected players.', '접속 중인 플레이어 목록과 관리 작업')}>
      <AdminCard title={tx('Online Players', '온라인 플레이어')} description={`${tx('Total online', '총 접속자')}: ${onlineTotal}`}>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder={tx('Search name, charId, accountId', '이름, 캐릭터 ID, 계정 ID 검색')}
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
          />
          <input
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder={tx('Filter channel', '채널 필터')}
            value={filterChannel}
            onChange={(event) => setFilterChannel(event.target.value)}
          />
          <button
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            onClick={loadOnlinePlayers}
          >
            {tx('Refresh List', '목록 새로고침')}
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm text-white/80">
            <thead className="bg-white/5 text-xs uppercase text-white/60">
              <tr>
                <th className="px-3 py-2 text-left">{tx('Name', '이름')}</th>
                <th className="px-3 py-2 text-left">{tx('Char ID', '캐릭터 ID')}</th>
                <th className="px-3 py-2 text-left">{tx('Account', '계정')}</th>
                <th className="px-3 py-2 text-left">{tx('Channel', '채널')}</th>
                <th className="px-3 py-2 text-left">{tx('Actions', '작업')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.charId} className="border-t border-white/5">
                  <td className="px-3 py-2">{player.charName}</td>
                  <td className="px-3 py-2">{player.charId}</td>
                  <td className="px-3 py-2">{player.accountId}</td>
                  <td className="px-3 py-2">{player.serverChannelId}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10"
                        onClick={() => setHealCharId(String(player.charId))}
                      >
                        {tx('Heal', '회복')}
                      </button>
                      <button
                        className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10"
                        onClick={() => setKickTarget(String(player.charId))}
                      >
                        {tx('Kick', '강제 종료')}
                      </button>
                      <button
                        className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10"
                        onClick={() => setMuteCharId(String(player.charId))}
                      >
                        {tx('Mute', '채팅 금지')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-white/50" colSpan={5}>
                    {tx('No players match filters.', '필터와 일치하는 플레이어가 없습니다.')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Kick Player">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={kickTarget}
              onChange={(event) => setKickTarget(event.target.value)}
            />
            <button
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              onClick={async () => {
                const result = await postAdmin('/admin/kick', {
                  type: 'char',
                  target: kickTarget
                });
                setResult('Kick', result);
              }}
            >
              Kick Player
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Heal Full">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={healCharId}
              onChange={(event) => setHealCharId(event.target.value)}
            />
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={async () => {
                const result = await postAdmin('/admin/heal-full', { charId: healCharId });
                setResult('Heal', result);
              }}
            >
              Heal Player
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Zeni Control">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={zeniCharId}
              onChange={(event) => setZeniCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Amount"
              value={zeniAmount}
              onChange={(event) => setZeniAmount(event.target.value)}
            />
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={zeniAdd}
                  onChange={(event) => setZeniAdd(event.target.checked)}
                />
                Add (unchecked = remove)
              </label>
            </div>
            <button
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
              onClick={async () => {
                const result = await postAdmin('/admin/add-zeni', {
                  charId: zeniCharId,
                  amount: Number(zeniAmount || 0),
                  add: zeniAdd
                });
                setResult('Zeni', result);
              }}
            >
              Apply Zeni
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Level + Class">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={levelCharId}
              onChange={(event) => setLevelCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Level"
              value={levelValue}
              onChange={(event) => setLevelValue(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-level', {
                  charId: levelCharId,
                  level: Number(levelValue || 0)
                });
                setResult('Set Level', result);
              }}
            >
              Set Level
            </button>
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID for class (optional)"
              value={classCharId}
              onChange={(event) => setClassCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Class ID"
              value={classValue}
              onChange={(event) => setClassValue(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/set-class', {
                  charId: classCharId || levelCharId,
                  classId: Number(classValue || 0)
                });
                setResult('Set Class', result);
              }}
            >
              Set Class
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Teleport Tools">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID (portal)"
              value={portalCharId}
              onChange={(event) => setPortalCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Portal Tblidx"
              value={portalTblidx}
              onChange={(event) => setPortalTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/teleport-portal', {
                  charId: portalCharId,
                  portalTblidx: Number(portalTblidx || 0)
                });
                setResult('Teleport Portal', result);
              }}
            >
              Teleport Portal
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID (world)"
              value={worldCharId}
              onChange={(event) => setWorldCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="World ID"
              value={worldId}
              onChange={(event) => setWorldId(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/teleport-world', {
                  charId: worldCharId,
                  worldId: Number(worldId || 0)
                });
                setResult('Teleport World', result);
              }}
            >
              Teleport World
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Teleport Coordinates">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={coordCharId}
              onChange={(event) => setCoordCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="World ID"
              value={coordWorldId}
              onChange={(event) => setCoordWorldId(event.target.value)}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="X"
                value={coordX}
                onChange={(event) => setCoordX(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Y"
                value={coordY}
                onChange={(event) => setCoordY(event.target.value)}
              />
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                placeholder="Z"
                value={coordZ}
                onChange={(event) => setCoordZ(event.target.value)}
              />
            </div>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/teleport-coords', {
                  charId: coordCharId,
                  worldId: Number(coordWorldId || 0),
                  x: Number(coordX || 0),
                  y: Number(coordY || 0),
                  z: Number(coordZ || 0)
                });
                setResult('Teleport Coords', result);
              }}
            >
              Teleport Coordinates
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Mute & Unmute">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={muteCharId}
              onChange={(event) => setMuteCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Duration (minutes)"
              value={muteMinutes}
              onChange={(event) => setMuteMinutes(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Reason"
              value={muteReason}
              onChange={(event) => setMuteReason(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/mute-player', {
                  charId: muteCharId,
                  durationMinutes: Number(muteMinutes || 0),
                  reason: muteReason
                });
                setResult('Mute', result);
              }}
            >
              Mute Player
            </button>
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID to unmute"
              value={unmuteCharId}
              onChange={(event) => setUnmuteCharId(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/unmute-player', {
                  charId: unmuteCharId
                });
                setResult('Unmute', result);
              }}
            >
              Unmute Player
            </button>
          </div>
        </AdminCard>

        <AdminCard title="EXP & Kill">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={expCharId}
              onChange={(event) => setExpCharId(event.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={expEnable}
                onChange={(event) => setExpEnable(event.target.checked)}
              />
              EXP enabled
            </label>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/toggle-exp', {
                  charId: expCharId,
                  enable: expEnable
                });
                setResult('Toggle EXP', result);
              }}
            >
              Apply EXP Toggle
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID to reset EXP"
              value={resetExpCharId}
              onChange={(event) => setResetExpCharId(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/reset-exp', {
                  charId: resetExpCharId
                });
                setResult('Reset EXP', result);
              }}
            >
              Reset EXP
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID to kill"
              value={killCharId}
              onChange={(event) => setKillCharId(event.target.value)}
            />
            <button
              className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
              onClick={async () => {
                const result = await postAdmin('/admin/kill-player', {
                  charId: killCharId
                });
                setResult('Kill', result);
              }}
            >
              Kill Player
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Learn Skill">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={learnSkillCharId}
              onChange={(event) => setLearnSkillCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Skill Tblidx"
              value={learnSkillTblidx}
              onChange={(event) => setLearnSkillTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/learn-skill', {
                  charId: learnSkillCharId,
                  skillTblidx: Number(learnSkillTblidx || 0)
                });
                setResult('Learn Skill', result);
              }}
            >
              Learn Skill
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Titles">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={addTitleCharId}
              onChange={(event) => setAddTitleCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Title Tblidx"
              value={addTitleTblidx}
              onChange={(event) => setAddTitleTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/add-title', {
                  charId: addTitleCharId,
                  titleTblidx: Number(addTitleTblidx || 0)
                });
                setResult('Add Title', result);
              }}
            >
              Add Title
            </button>

            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID (remove)"
              value={removeTitleCharId}
              onChange={(event) => setRemoveTitleCharId(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Title Tblidx (remove)"
              value={removeTitleTblidx}
              onChange={(event) => setRemoveTitleTblidx(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/remove-title', {
                  charId: removeTitleCharId,
                  titleTblidx: Number(removeTitleTblidx || 0)
                });
                setResult('Remove Title', result);
              }}
            >
              Remove Title
            </button>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Skill Cooldowns">
          <div className="flex flex-col gap-3">
            <input
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              placeholder="Char ID"
              value={resetSkillCooldownCharId}
              onChange={(event) => setResetSkillCooldownCharId(event.target.value)}
            />
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/reset-skill-cooldown', {
                  charId: resetSkillCooldownCharId
                });
                setResult('Reset Skill Cooldown', result);
              }}
            >
              Reset Skill Cooldown (Single)
            </button>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              onClick={async () => {
                const result = await postAdmin('/admin/reset-skill-cooldown-all', {});
                setResult('Reset Skill Cooldown (All)', result);
              }}
            >
              Reset Skill Cooldown (All)
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
