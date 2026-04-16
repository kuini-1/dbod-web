'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';
import { API } from '@/lib/api/client';
import { SuccessToast, WarningToast } from '@/lib/utils/toasts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type EventLevelupRewardRow = {
    requiredLevel: number;
    itemId: number;
    amount: number;
    name: string;
    iconUrl: string | null;
    claimed: boolean;
    available: boolean;
};

export type EventLevelupCharacter = {
    charId: number;
    charName: string;
    level: number;
    class: number | null;
};

export type EventLevelupApiPayload = {
    success: boolean;
    hasActiveEvent?: boolean;
    status?: 'upcoming' | 'active' | 'ended';
    event?: { id: number; title: string | null; slug: string | null; startDate: string; endDate: string };
    selectedCharacterId?: number;
    selectedCharacter?: EventLevelupCharacter;
    characters?: EventLevelupCharacter[];
    data?: EventLevelupRewardRow[];
};

interface EventLevelupModalProps {
    isOpen: boolean;
    onClose: () => void;
    payload: EventLevelupApiPayload | null;
    loading: boolean;
    onRefresh: (characterId?: number) => Promise<void>;
}

export default function EventLevelupModal(props: EventLevelupModalProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const { isOpen, onClose, payload, loading, onRefresh } = props;
    const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
    const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const incomingId = Number(payload?.selectedCharacterId);
        if (Number.isFinite(incomingId) && incomingId > 0) {
            setSelectedCharacterId(incomingId);
        }
    }, [isOpen, payload?.selectedCharacterId]);

    const milestoneLevels = useMemo(() => {
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const levels = new Set<number>();
        for (const reward of list) {
            const lv = Number(reward.requiredLevel);
            if (Number.isFinite(lv) && lv > 0) levels.add(lv);
        }
        return [...levels].sort((a, b) => a - b);
    }, [payload?.data]);

    if (!isOpen) return null;

    const rewards = Array.isArray(payload?.data) ? payload.data : [];
    const rewardsByLevel = new Map<number, EventLevelupRewardRow>();
    for (const reward of rewards) rewardsByLevel.set(Number(reward.requiredLevel), reward);

    const characters = Array.isArray(payload?.characters) ? payload.characters : [];
    const fallbackCharacterId = characters[0]?.charId ?? null;
    const activeCharacterId = selectedCharacterId ?? fallbackCharacterId;
    const selectCharacterValue =
        activeCharacterId != null && characters.some((c) => c.charId === activeCharacterId)
            ? String(activeCharacterId)
            : fallbackCharacterId != null
              ? String(fallbackCharacterId)
              : '';
    const activeCharacter = characters.find((char) => char.charId === activeCharacterId) ?? payload?.selectedCharacter ?? null;
    const eventTitle = payload?.event?.title?.trim() || tx('Level-Up Event', '레벨업 이벤트');
    const status = payload?.status ?? 'ended';

    const handleCharacterChange = async (value: string) => {
        const nextId = Number(value);
        if (!Number.isFinite(nextId) || nextId < 1) return;
        setSelectedCharacterId(nextId);
        await onRefresh(nextId);
    };

    const handleClaim = async (requiredLevel: number) => {
        const eventId = payload?.event?.id;
        const characterId = activeCharacterId;
        if (eventId == null || !Number.isFinite(Number(eventId)) || !characterId) return;
        setClaimingLevel(requiredLevel);
        try {
            const res = await API.post('/event-levelup-rewards/claim', {
                eventId: Number(eventId),
                characterId: Number(characterId),
                requiredLevel,
            });
            if (res.status === 200 && res.data?.success) {
                SuccessToast.fire(tx('Reward claimed!', '보상을 받았습니다!'));
                await onRefresh(Number(characterId));
            } else {
                WarningToast.fire(
                    typeof res.data?.message === 'string' && res.data.message
                        ? res.data.message
                        : tx('Could not claim', '수령할 수 없습니다')
                );
            }
        } finally {
            setClaimingLevel(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[10002]">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full h-full flex items-center justify-center p-3 md:p-5" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-amber-300/25 bg-[radial-gradient(circle_at_15%_0%,rgba(251,191,36,0.2),transparent_35%),radial-gradient(circle_at_95%_10%,rgba(249,115,22,0.16),transparent_30%),linear-gradient(145deg,rgba(20,20,28,0.96),rgba(10,10,16,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.55)] flex flex-col">
                    <div className="relative shrink-0 border-b border-amber-200/20 px-5 md:px-7 py-5 bg-black/20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/75 font-semibold">
                                    {tx('Event Campaign', '이벤트 캠페인')}
                                </p>
                                <h2 className="mt-1 text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-orange-200 to-yellow-200">
                                    {eventTitle}
                                </h2>
                                {payload?.event ? (
                                    <p className="mt-2 text-xs md:text-sm text-amber-50/85">
                                        {payload.event.startDate} — {payload.event.endDate} ({tx('server calendar', '서버 달력')})
                                    </p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 w-9 rounded-full border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 hover:text-white transition cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <div className="relative p-4 md:p-6 overflow-y-auto flex-1">
                        {loading ? <p className="text-center text-amber-100/85 py-14">{tx('Loading…', '불러오는 중…')}</p> : null}

                        {!loading && !payload?.success ? (
                            <p className="text-center text-rose-200/90 py-14">
                                {tx('Could not load this event.', '이벤트를 불러올 수 없습니다.')}
                            </p>
                        ) : null}

                        {!loading && payload?.success && payload.hasActiveEvent === false ? (
                            <p className="text-center text-amber-100/90 py-14">
                                {tx('There is no active level-up event right now.', '현재 진행 중인 레벨업 이벤트가 없습니다.')}
                            </p>
                        ) : null}

                        {!loading && payload?.success && payload.hasActiveEvent !== false && payload.event ? (
                            <>
                                <div className="mb-4">
                                    <label className="text-[11px] uppercase tracking-wide text-white/60 block mb-2">
                                        {tx('Character', '캐릭터')}
                                    </label>
                                    <Select
                                        modal={false}
                                        value={selectCharacterValue}
                                        onValueChange={(value) => void handleCharacterChange(value)}
                                    >
                                        <SelectTrigger className="w-full md:w-[360px] border-amber-200/25 bg-black/40 text-amber-50 focus:ring-amber-400/40 focus:ring-offset-0 focus:ring-offset-transparent">
                                            <SelectValue placeholder={tx('Select character', '캐릭터 선택')} />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            sideOffset={6}
                                            className="z-[10060] border-amber-200/20 bg-stone-900 text-amber-50 shadow-2xl"
                                        >
                                            {characters.map((char) => (
                                                <SelectItem key={char.charId} value={String(char.charId)}>
                                                    {char.charName} ({tx('Lv.', '레벨')} {char.level})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {activeCharacter ? (
                                    <p className="mb-4 text-sm text-amber-100/90">
                                        {tx('Selected', '선택 캐릭터')}: <span className="font-bold">{activeCharacter.charName}</span>{' '}
                                        ({tx('Lv.', '레벨')} {activeCharacter.level})
                                    </p>
                                ) : null}

                                {status === 'upcoming' ? (
                                    <div className="mb-4 rounded-xl border border-amber-400/45 bg-amber-500/10 px-4 py-2.5 text-amber-100 text-sm">
                                        {tx('This event has not started yet.', '이벤트가 아직 시작되지 않았습니다.')}
                                    </div>
                                ) : null}
                                {status === 'ended' ? (
                                    <div className="mb-4 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-stone-200 text-sm">
                                        {tx('This event has ended.', '이벤트가 종료되었습니다.')}
                                    </div>
                                ) : null}

                                {!milestoneLevels.length ? (
                                    <p className="rounded-xl border border-white/15 bg-black/25 px-4 py-6 text-center text-sm text-amber-100/75">
                                        {tx('No milestone rewards are configured for this event yet.', '이 이벤트에 설정된 마일스톤 보상이 없습니다.')}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                        {milestoneLevels.map((milestone) => {
                                            const reward = rewardsByLevel.get(milestone);
                                            const isClaiming = claimingLevel === milestone;
                                            const isAvailable = !!reward?.available;
                                            const isClaimed = !!reward?.claimed;
                                            const isLocked = !reward || (!isAvailable && !isClaimed);
                                            const cardClass = isClaimed
                                                ? 'border border-emerald-500/60 bg-emerald-900/25'
                                                : isAvailable
                                                  ? 'border-2 border-amber-300/90 bg-gradient-to-b from-amber-950/55 to-amber-900/35 shadow-[0_0_0_1px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]'
                                                  : 'border border-white/10 bg-stone-900/80';
                                            const interactiveClass =
                                                isClaimed
                                                    ? 'cursor-default opacity-95'
                                                    : isAvailable
                                                      ? isClaiming
                                                          ? 'cursor-wait opacity-95'
                                                          : 'cursor-pointer hover:-translate-y-0.5 hover:border-amber-100 hover:shadow-[0_0_32px_rgba(251,191,36,0.55),0_12px_28px_rgba(0,0,0,0.35)] hover:ring-2 hover:ring-amber-200/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200'
                                                      : 'cursor-not-allowed opacity-90';

                                            return (
                                                <button
                                                    key={milestone}
                                                    type="button"
                                                    title={
                                                        isAvailable && !isClaiming
                                                            ? tx('Click to claim this reward', '클릭하여 보상을 받으세요')
                                                            : undefined
                                                    }
                                                    onClick={() => {
                                                        if (isAvailable) void handleClaim(milestone);
                                                    }}
                                                    disabled={!isAvailable || isClaiming}
                                                    className={`group relative flex w-full min-h-[130px] flex-col overflow-hidden rounded-xl text-left transition-all duration-200 ease-out ${cardClass} ${interactiveClass} disabled:opacity-90`}
                                                >
                                                    <div className="p-2">
                                                        <div
                                                            className={`relative flex min-h-[78px] w-full items-center justify-center rounded-lg border bg-black/25 ${
                                                                isAvailable && !isClaiming
                                                                    ? 'border-amber-400/50 shadow-inner shadow-amber-500/10'
                                                                    : 'border-white/10'
                                                            }`}
                                                        >
                                                            <Image
                                                                src={reward?.iconUrl || '/event icons/i_hls_aoto_lp_s.png'}
                                                                alt={reward?.name || 'Reward'}
                                                                width={40}
                                                                height={40}
                                                            />
                                                            <span className="absolute bottom-1 right-1 flex h-[16px] min-w-[24px] items-center justify-center rounded border border-black/35 bg-black/55 px-1 text-[11px] font-bold leading-none text-white">
                                                                x{reward?.amount ?? 0}
                                                            </span>
                                                            <div className="pointer-events-none absolute -top-9 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded border border-amber-500/50 bg-black/90 px-2 py-1 text-[10px] text-amber-100 group-hover:block">
                                                                {reward?.name ?? tx('Not configured', '미설정')}
                                                            </div>
                                                            {isClaimed ? (
                                                                <div className="absolute left-1 top-1 z-20 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                    {tx('Claimed', '수령완료')}
                                                                </div>
                                                            ) : null}
                                                            {isLocked ? (
                                                                <div className="absolute left-1 top-1 z-20 rounded-full bg-stone-700 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                    {tx('Locked', '잠김')}
                                                                </div>
                                                            ) : null}
                                                            {isClaiming ? (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-white">
                                                                    …
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto border-t border-white/10 bg-black/20 py-1 text-center text-[11px] font-bold text-amber-100">
                                                        {tx('LEVEL', '레벨')} {milestone}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
