'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';
import { API } from '@/lib/api/client';
import { SuccessToast, WarningToast } from '@/lib/utils/toasts';

export type EventDailyRewardRow = {
    stepIndex: number;
    itemId: number;
    amount: number;
    name: string;
    iconUrl: string | null;
    claimed: boolean;
    available: boolean;
};

export type EventDailyApiPayload = {
    success: boolean;
    hasActiveEvent?: boolean;
    status?: 'upcoming' | 'active' | 'ended';
    eventDayIndex?: number | null;
    event?: { id: number; title: string | null; slug: string | null; startDate: string; endDate: string };
    data?: EventDailyRewardRow[];
};

interface EventDailyLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    payload: EventDailyApiPayload | null;
    loading: boolean;
    onRefresh: () => Promise<void>;
}

export default function EventDailyLoginModal(props: EventDailyLoginModalProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const { isOpen, onClose, payload, loading, onRefresh } = props;
    const [claimingStep, setClaimingStep] = useState<number | null>(null);

    if (!isOpen) return null;

    const rewards = Array.isArray(payload?.data) ? payload.data : [];
    const eventTitle = payload?.event?.title?.trim() || tx('Event Login', '이벤트 출석');
    const status = payload?.status ?? 'ended';
    const claimedCount = rewards.filter((r) => r.claimed).length;
    const daysRemaining = Math.max(0, rewards.length - claimedCount);
    const renderRewardCard = (reward: EventDailyRewardRow, index: number) => {
        const isLast = index === rewards.length - 1;
        const isClaiming = claimingStep === reward.stepIndex;
        const baseBorder = isLast
            ? 'border-purple-400/95 bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-stone-900/95 ring-2 ring-purple-300/55 shadow-[0_0_26px_rgba(168,85,247,0.38)]'
            : reward.claimed
              ? 'border-yellow-500/70 bg-yellow-900/25'
              : reward.available
                ? 'border-red-500/60 bg-red-900/20 cursor-pointer hover:border-red-400'
                : 'border-white/10 bg-gradient-to-br from-stone-800 to-stone-900';

        return (
            <button
                key={reward.stepIndex}
                type="button"
                disabled={!reward.available || isClaiming}
                onClick={() => {
                    if (reward.available) void handleClaim(reward.stepIndex);
                }}
                className={`group relative w-full rounded-xl border min-h-[118px] overflow-hidden flex flex-col text-left transition-all duration-200 hover:-translate-y-[1px] ${isLast ? 'hover:-translate-y-[2px]' : ''} ${baseBorder} disabled:opacity-90`}
            >
                <div className="p-2">
                    <div className={`relative flex justify-center items-center w-full min-h-[74px] rounded-lg border ${isLast ? 'border-purple-300/45 bg-gradient-to-b from-purple-500/18 to-black/30' : 'border-white/10 bg-black/20'}`}>
                        {isLast ? (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-purple-200/60 bg-gradient-to-r from-purple-500 to-fuchsia-500 px-2 py-[2px] text-[9px] font-black uppercase tracking-wider text-white shadow-[0_0_14px_rgba(192,132,252,0.6)]">
                                {tx('Final', '마지막')}
                            </div>
                        ) : null}
                        <Image
                            src={reward.iconUrl || '/event icons/i_hls_aoto_lp_s.png'}
                            alt={reward.name || 'Reward'}
                            width={isLast ? 44 : 38}
                            height={isLast ? 44 : 38}
                        />
                        <span className="absolute bottom-1 right-1 rounded border border-black/35 bg-black/55 min-w-[24px] h-[16px] px-1 text-[11px] font-bold text-white flex items-center justify-center leading-none">
                            x{reward.amount}
                        </span>
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 border border-red-500/50 px-2 py-1 text-[10px] text-red-100 z-20">
                            {reward.name}
                        </div>
                        {reward.claimed ? (
                            <div className="absolute top-0 left-0 z-20 -rotate-12 bg-gradient-to-r from-red-500 to-red-600 text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-red-300/60 pointer-events-none">
                                {tx('Clear!', '완료!')}
                            </div>
                        ) : null}
                        {isClaiming ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-white">
                                …
                            </div>
                        ) : null}
                    </div>
                </div>
                <div
                    className={`mt-auto border-t text-center text-[10px] font-bold py-1 tracking-wide ${
                        isLast
                            ? 'border-purple-300/50 bg-gradient-to-r from-purple-500/25 via-fuchsia-500/20 to-purple-500/25 text-purple-100'
                            : 'border-white/10 bg-black/25 text-white/70'
                    }`}
                >
                    {tx('DAY', 'DAY')} {reward.stepIndex}
                </div>
            </button>
        );
    };

    const handleClaim = async (stepIndex: number) => {
        const eventId = payload?.event?.id;
        if (eventId == null || !Number.isFinite(Number(eventId))) return;
        setClaimingStep(stepIndex);
        try {
            const res = await API.post('/event-daily-rewards/claim', {
                eventId: Number(eventId),
                stepIndex,
            });
            if (res.status === 200 && res.data?.success) {
                SuccessToast.fire(tx('Reward claimed!', '보상을 받았습니다!'));
                await onRefresh();
            } else {
                WarningToast.fire(
                    typeof res.data?.message === 'string' && res.data.message
                        ? res.data.message
                        : tx('Could not claim', '수령할 수 없습니다')
                );
            }
        } finally {
            setClaimingStep(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[10001]">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full h-full flex items-center justify-center p-3 md:p-5" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-violet-300/25 bg-[radial-gradient(circle_at_15%_0%,rgba(167,139,250,0.22),transparent_35%),radial-gradient(circle_at_95%_10%,rgba(251,113,133,0.16),transparent_30%),linear-gradient(145deg,rgba(20,20,28,0.96),rgba(10,10,16,0.96))] shadow-[0_20px_80px_rgba(0,0,0,0.55)] flex flex-col">
                    <div className="absolute inset-0 pointer-events-none bg-[url('/illust/daily-login-bg.svg')] bg-cover bg-center opacity-[0.08]" />
                    <div className="relative shrink-0 border-b border-violet-200/15 px-5 md:px-7 py-5 bg-black/20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.22em] text-violet-200/75 font-semibold">
                                    {tx('Event Campaign', '이벤트 캠페인')}
                                </p>
                                <h2 className="mt-1 text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-rose-200">
                                    {eventTitle}
                                </h2>
                                {payload?.event ? (
                                    <p className="mt-2 text-xs md:text-sm text-violet-100/80">
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
                        {loading ? (
                            <p className="text-center text-violet-100/85 py-14">{tx('Loading…', '불러오는 중…')}</p>
                        ) : null}

                        {!loading && !payload?.success ? (
                            <p className="text-center text-rose-200/90 py-14">
                                {tx('Could not load this event.', '이벤트를 불러올 수 없습니다.')}
                            </p>
                        ) : null}

                        {!loading && payload?.success && payload.hasActiveEvent === false ? (
                            <p className="text-center text-violet-100/90 py-14">
                                {tx(
                                    'There is no event daily login for the current dates.',
                                    '현재 진행 중인 이벤트 출석이 없습니다.'
                                )}
                            </p>
                        ) : null}

                        {!loading && payload?.success && payload.hasActiveEvent !== false && payload.event ? (
                            <>
                                <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-wide text-white/55">{tx('Progress', '진행도')}</p>
                                        <p className="mt-1 text-lg font-bold text-violet-100">
                                            {claimedCount} / {rewards.length}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-wide text-white/55">{tx('Days Remaining', '남은 일수')}</p>
                                        <p className="mt-1 text-lg font-bold text-violet-100">
                                            {daysRemaining}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-wide text-white/55">{tx('Status', '상태')}</p>
                                        <p className="mt-1 text-lg font-bold text-violet-100">
                                            {status === 'active'
                                                ? tx('Active', '진행 중')
                                                : status === 'upcoming'
                                                  ? tx('Upcoming', '예정')
                                                  : tx('Ended', '종료')}
                                        </p>
                                    </div>
                                </div>

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
                                {status === 'active' && payload.eventDayIndex != null ? (
                                    <p className="mb-4 text-sm text-violet-100/85">
                                        {tx('Event day', '이벤트 일차')}:{' '}
                                        <span className="font-bold text-fuchsia-200">
                                            {payload.eventDayIndex}
                                        </span>
                                    </p>
                                ) : null}

                                <div className="grid grid-cols-7 gap-2">
                                    {rewards.map((reward, index) => (
                                        <div key={reward.stepIndex} className="min-w-0">
                                            {renderRewardCard(reward, index)}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
