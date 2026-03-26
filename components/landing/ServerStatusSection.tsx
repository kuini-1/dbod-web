'use client';

import { local } from '@/lib/utils/localize';
import { useLocale } from '@/components/LocaleProvider';

interface ServerStatusSectionProps {
    status: {
        player_count: number;
        auth: number;
        channels: Record<string, number>;
        bonuses: {
            soloExpBonus?: number;
            partyExpBonus?: number;
            questExpBonus?: number;
            craftExpBonus?: number;
            zeniDropBonus?: number;
            questMoneyBonus?: number;
            upgradeRateBonus?: number;
        } | null;
        channelBonuses: Array<{
            channelId: number;
            maxLpPercent?: number;
            maxEpPercent?: number;
            physicalOffencePercent?: number;
            energyOffencePercent?: number;
            physicalDefencePercent?: number;
            energyDefencePercent?: number;
            attackRatePercent?: number;
            dodgeRatePercent?: number;
        }>;
    };
}

export function ServerStatusSection({ status }: ServerStatusSectionProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    return (
        <section className="w-full px-4 py-16 flex flex-col items-center space-y-8">
            <div className='flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-5'>
                <h1 className='text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-400'>
                    {local.serverStatus}
                </h1>
            </div>
            <div className="w-full max-w-4xl">
                {/* Player Count and Server Status - MMORPG UI style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-stone-900/80 rounded-lg p-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-red-100/90">{local.playerCount}</span>
                            <span className={`text-xl font-bold ${status.player_count === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {status.player_count || 0}
                            </span>
                        </div>
                    </div>
                    <div className="bg-stone-900/80 rounded-lg p-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-red-100/90">{local.auth}</span>
                            <span className={`text-xl font-bold ${Number(status.auth) === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {Number(status.auth) === 0 ? local.online : local.offline}
                            </span>
                        </div>
                    </div>
                </div>

                {/* All Channels */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-red-100/90 mb-4">{tx('Channels', '채널')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((chNum) => {
                            const chKey = `ch${chNum}` as keyof typeof status.channels;
                            const chStatus = status.channels?.[chKey];
                            const isOnline = Number(chStatus) === 0;
                            return (
                                <div key={chNum} className="bg-stone-900/80 rounded-lg p-4 border border-red-500/20">
                                    <div className="flex flex-col items-center space-y-2">
                                        <span className="text-sm font-semibold text-red-100/70">{tx('Channel', '채널')} {chNum}</span>
                                        <span className={`text-lg font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isOnline ? local.online : local.offline}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bonuses Section */}
                {status.bonuses && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-red-100/90 mb-4">{tx('Active Bonuses', '활성 보너스')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(status.bonuses.soloExpBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 backdrop-blur-sm border border-green-500/30">
                                    <div className="text-sm text-green-400 font-semibold mb-1">{tx('Solo EXP', '솔로 EXP')}</div>
                                    <div className="text-2xl font-bold text-green-300">+{status.bonuses.soloExpBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.partyExpBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 backdrop-blur-sm border border-blue-500/30">
                                    <div className="text-sm text-blue-400 font-semibold mb-1">{tx('Party EXP', '파티 EXP')}</div>
                                    <div className="text-2xl font-bold text-blue-300">+{status.bonuses.partyExpBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.questExpBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 backdrop-blur-sm border border-purple-500/30">
                                    <div className="text-sm text-purple-400 font-semibold mb-1">{tx('Quest EXP', '퀘스트 EXP')}</div>
                                    <div className="text-2xl font-bold text-purple-300">+{status.bonuses.questExpBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.craftExpBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 backdrop-blur-sm border border-yellow-500/30">
                                    <div className="text-sm text-yellow-400 font-semibold mb-1">{tx('Craft EXP', '제작 EXP')}</div>
                                    <div className="text-2xl font-bold text-yellow-300">+{status.bonuses.craftExpBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.zeniDropBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 backdrop-blur-sm border border-red-500/30">
                                    <div className="text-sm text-red-400 font-semibold mb-1">{tx('Zeni Drop', '제니 드랍')}</div>
                                    <div className="text-2xl font-bold text-red-300">+{status.bonuses.zeniDropBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.questMoneyBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 backdrop-blur-sm border border-emerald-500/30">
                                    <div className="text-sm text-emerald-400 font-semibold mb-1">{tx('Quest Money', '퀘스트 머니')}</div>
                                    <div className="text-2xl font-bold text-emerald-300">+{status.bonuses.questMoneyBonus}%</div>
                                </div>
                            )}
                            {(status.bonuses.upgradeRateBonus ?? 0) > 0 && (
                                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl p-4 backdrop-blur-sm border border-pink-500/30">
                                    <div className="text-sm text-pink-400 font-semibold mb-1">{tx('Upgrade Rate', '강화 확률')}</div>
                                    <div className="text-2xl font-bold text-pink-300">+{status.bonuses.upgradeRateBonus}%</div>
                                </div>
                            )}
                        </div>
                        {Object.values(status.bonuses).every((v: unknown) => !v || v === 0) && (
                            <div className="text-center text-red-100/60 mt-4">{tx('No active bonuses at this time', '현재 활성 보너스가 없습니다')}</div>
                        )}
                    </div>
                )}
                {!status.bonuses && (
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-red-100/90 mb-4">{tx('Active Bonuses', '활성 보너스')}</h2>
                        <div className="text-center text-red-100/60">{tx('Bonus information unavailable', '보너스 정보를 불러올 수 없습니다')}</div>
                    </div>
                )}

                {/* Channel Bonuses */}
                {status.channelBonuses && status.channelBonuses.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-100/90 mb-4">{tx('Channel Bonuses', '채널 보너스')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {status.channelBonuses.map((bonus) => {
                                const hasBonuses = (bonus.maxLpPercent ?? 0) > 0 || (bonus.maxEpPercent ?? 0) > 0 || 
                                                  (bonus.physicalOffencePercent ?? 0) > 0 || (bonus.energyOffencePercent ?? 0) > 0 ||
                                                  (bonus.physicalDefencePercent ?? 0) > 0 || (bonus.energyDefencePercent ?? 0) > 0 ||
                                                  (bonus.attackRatePercent ?? 0) > 0 || (bonus.dodgeRatePercent ?? 0) > 0;
                                
                                if (!hasBonuses) return null;

                                return (
                                    <div key={bonus.channelId} className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg p-4 border border-red-500/30">
                                        <div className="text-sm text-red-300 font-semibold mb-3">{tx('Channel', '채널')} {bonus.channelId}</div>
                                        <div className="space-y-2">
                                            {(bonus.maxLpPercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Max LP', '최대 LP')}</span>
                                                    <span className="text-lg font-bold text-green-300">+{bonus.maxLpPercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.maxEpPercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Max EP', '최대 EP')}</span>
                                                    <span className="text-lg font-bold text-blue-300">+{bonus.maxEpPercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.physicalOffencePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Physical Off', '물리 공격')}</span>
                                                    <span className="text-lg font-bold text-red-300">+{bonus.physicalOffencePercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.energyOffencePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Energy Off', '에너지 공격')}</span>
                                                    <span className="text-lg font-bold text-yellow-300">+{bonus.energyOffencePercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.physicalDefencePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Physical Def', '물리 방어')}</span>
                                                    <span className="text-lg font-bold text-purple-300">+{bonus.physicalDefencePercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.energyDefencePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Energy Def', '에너지 방어')}</span>
                                                    <span className="text-lg font-bold text-cyan-300">+{bonus.energyDefencePercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.attackRatePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Attack Rate', '공격률')}</span>
                                                    <span className="text-lg font-bold text-red-300">+{bonus.attackRatePercent}%</span>
                                                </div>
                                            )}
                                            {(bonus.dodgeRatePercent ?? 0) > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-400">{tx('Dodge Rate', '회피율')}</span>
                                                    <span className="text-lg font-bold text-pink-300">+{bonus.dodgeRatePercent}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
