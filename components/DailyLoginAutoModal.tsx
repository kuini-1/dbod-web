'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';

interface DailyReward {
    date: number;
    itemId: number;
    amount: number;
    name: string;
    iconUrl: string | null;
    claimed: boolean;
    available: boolean;
    isRepeat?: boolean;
}

interface DailyLoginAutoModalProps {
    isOpen: boolean;
    onClose: () => void;
    rewards: DailyReward[];
    resetDays: number;
    claimedDay: number;
    claimedAmount: number;
    showPurchaseButton?: boolean;
    passIsActive?: boolean;
    passPrice?: number;
    mallpoints?: number;
    buyingPass?: boolean;
    onPurchase?: () => void;
    purchaseButtonText?: string;
    passActiveText?: string;
    purchasingText?: string;
}

export default function DailyLoginAutoModal(props: DailyLoginAutoModalProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const {
        isOpen,
        onClose,
        rewards,
        resetDays,
        claimedDay,
        claimedAmount,
        showPurchaseButton = false,
        passIsActive = false,
        passPrice = 0,
        mallpoints = 0,
        buyingPass = false,
        onPurchase,
        purchaseButtonText,
        passActiveText,
        purchasingText
    } = props;
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handlePurchaseClick = () => {
        if (!onPurchase || passIsActive || buyingPass || mallpoints < passPrice) return;
        setConfirmOpen(true);
    };

    const handleConfirmPurchase = () => {
        setConfirmOpen(false);
        onPurchase?.();
    };
    if (!isOpen) return null;
    const repeatReward = rewards.find((reward) => reward.date === 25) || rewards.find((reward) => reward.isRepeat);

    return (
        <div className="fixed inset-0 z-[10000]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                <div className="relative w-full max-w-6xl rounded-2xl border border-red-500/35 bg-stone-900/95 shadow-[0_0_32px_rgba(239,68,68,0.2)] overflow-hidden">
                    <Image
                        src="/illust/daily-login-bg.svg"
                        alt="Daily event background"
                        fill
                        className="object-cover opacity-45 pointer-events-none"
                    />
                    <div className="flex items-center justify-between px-5 py-4 border-b border-red-500/30 bg-black/30">
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-500 relative z-10">{tx('Monthly Event', '월간 이벤트')}</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-red-100/90 relative z-10">{tx('Resets in', '초기화까지')} {resetDays} {tx('days', '일')}</span>
                            <button onClick={onClose} className="text-red-200 hover:text-white text-xl leading-none cursor-pointer">x</button>
                        </div>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0">
                        <div className="lg:col-span-2 p-4">
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {rewards.slice(0, 24).map((reward) => {
                                    const isSpecialBorderDay = reward.date % 6 === 0;
                                    return (
                                    <div
                                        key={reward.date}
                                        className={`group relative rounded-lg border min-h-85px] overflow-hidden flex flex-col ${
                                            isSpecialBorderDay
                                                ? 'border-purple-500/80 bg-gradient-to-br from-purple-700/25 to-stone-900/95 ring-1 ring-purple-400/40'
                                                : reward.claimed
                                                    ? 'border-yellow-500/70 bg-yellow-900/25'
                                                    : reward.available
                                                        ? 'border-red-500/60 bg-red-900/20'
                                                        : 'border-white/10 bg-gradient-to-br from-stone-800 to-stone-900'
                                        }`}
                                    >
                                        <div className="p-1.5">
                                            <div className="relative flex justify-center">
                                                <Image
                                                    src={reward.iconUrl || '/event icons/i_hls_aoto_lp_s.png'}
                                                    alt={reward.name || 'Reward'}
                                                    width={40}
                                                    height={40}
                                                />
                                                <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 min-w-[22px] h-[16px] px-1 text-[12px] font-bold text-white flex items-center justify-center leading-none">
                                                    x{reward.amount * (passIsActive ? 2 : 1)}
                                                </span>
                                                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 border border-red-500/50 px-2 py-1 text-[10px] text-red-100 z-20">
                                                    {reward.name}
                                                </div>
                                                {reward.claimed ? (
                                                    <div className="absolute top-0 left-0 z-20 -rotate-12 bg-gradient-to-r from-red-500 to-red-600 text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-red-300/60 pointer-events-none">
                                                        {tx('Clear!', '완료!')}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className={`mt-auto border-t text-center text-[10px] font-semibold py-1 ${
                                            isSpecialBorderDay
                                                ? 'border-purple-400/40 bg-purple-500/15 text-purple-200'
                                                : 'border-white/10 bg-black/25 text-white/70'
                                        }`}>
                                            DAY {reward.date}
                                        </div>
                                    </div>
                                )})}
                            </div>

                            {claimedDay > 0 ? (
                                <div className="mt-3 rounded border border-red-500/30 bg-black/25 px-3 py-2 text-red-100">
                                    <span className="font-semibold">{tx('Auto check-in complete:', '자동 체크인 완료:')}</span> {tx('Day', 'DAY')} {claimedDay} {tx('claimed and', '수령,')} x{claimedAmount} {tx('sent to Cashshop Storage.', '캐시샵 보관함으로 전송됨.')}
                                </div>
                            ) : null}
                            {repeatReward ? (
                                <div className="mt-2 rounded-xl border-2 border-purple-500/55 bg-gradient-to-r from-purple-900/35 via-red-950/35 to-purple-900/35 px-4 py-3 text-purple-100 text-sm flex items-center gap-3 shadow-[0_0_24px_rgba(168,85,247,0.2)]">
                                    <Image
                                        src={repeatReward.iconUrl || '/event icons/i_hls_aoto_lp_s.png'}
                                        alt={repeatReward.name}
                                        width={40}
                                        height={40}
                                        className="rounded-lg bg-black/30 p-1 border border-purple-300/25"
                                    />
                                    {tx('Daily', '매일')} {repeatReward.name} x{repeatReward.amount * (passIsActive ? 2 : 1)} {tx('starting Day', '시작')} 25
                                </div>
                            ) : null}
                        </div>

                        <div className="relative border-l border-red-500/30 bg-stone-900/85 overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.14)_0%,_transparent_55%)]" />
                            <div className="relative px-5 py-4 border-b border-red-500/20">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-red-300/75 font-semibold">{tx('Premium Benefit', '프리미엄 혜택')}</p>
                                <div className="mt-1">
                                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-500 leading-none">{tx('Check-in Pass', '체크인 패스')}</h3>
                                </div>
                                <p className="mt-2 text-sm text-red-100/85">{tx('Buy once and receive x2 Daily Login rewards forever.', '한 번 구매하면 일일 로그인 보상을 영구적으로 2배 받습니다.')}</p>
                            </div>

                            <div className="relative p-5">
                                <div className="relative overflow-hidden rounded-xl border border-red-500/35 bg-gradient-to-b from-stone-800/85 to-stone-900/95 mb-3 p-4 shadow-[0_8px_18px_rgba(0,0,0,0.3)]">
                                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18)_0%,_transparent_58%)]" />
                                    <div className="relative rounded-lg border border-white/10 bg-black/30 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-white/90">{tx('Daily reward multiplier', '일일 보상 배수')}</p>
                                            <span className="inline-flex items-center rounded-md border border-red-300/45 bg-red-500/20 px-2 py-0.5 text-xs font-black tracking-wide text-red-200">
                                                2X
                                            </span>
                                        </div>
                                        <div className="my-3 h-px bg-white/10" />
                                        <p className="text-xs text-white/75">
                                            {tx('One purchase unlocks permanent bonus rewards for all daily claims.', '한 번 구매하면 모든 일일 수령에 영구 보너스가 적용됩니다.')}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                                            <span className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-white/80">{tx('Permanent', '영구')}</span>
                                            <span className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-white/80">{tx('All days', '전체 날짜')}</span>
                                            <span className="rounded-full border border-white/15 bg-black/25 px-2 py-0.5 text-red-200">2X</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wide text-white/55">{tx('Activation', '활성 방식')}</p>
                                        <p className="text-white font-semibold">{tx('One-time', '1회 구매')}</p>
                                    </div>
                                    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                                        <p className="text-[10px] uppercase tracking-wide text-white/55">{tx('Multiplier', '배수')}</p>
                                        <p className="text-red-300 font-semibold">x2 {tx('Daily', '매일')}</p>
                                    </div>
                                </div>
                                {showPurchaseButton ? (
                                    <button
                                        onClick={handlePurchaseClick}
                                        disabled={passIsActive || buyingPass || mallpoints < passPrice}
                                        className="mt-3 w-full py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed border border-red-300/45 shadow-[0_6px_14px_rgba(239,68,68,0.25)]"
                                    >
                                        {buyingPass
                                            ? (purchasingText ?? tx('Purchasing...', '구매 중...'))
                                            : passIsActive
                                            ? (passActiveText ?? tx('Pass Active', '패스 활성'))
                                            : `${purchaseButtonText ?? tx('Purchase Now', '지금 구매')} (${passPrice} CP)`}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {confirmOpen ? (
                <div className="absolute inset-0 z-[10010] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/75" onClick={() => setConfirmOpen(false)} />
                    <div className="relative w-full max-w-sm rounded-xl border border-red-500/40 bg-stone-900/95 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                        <h4 className="text-lg font-bold text-red-200">{tx('Confirm Purchase', '구매 확인')}</h4>
                        <p className="mt-2 text-sm text-white/80">
                            {tx('Purchase the Check-in Pass for', '체크인 패스를')} <span className="font-semibold text-red-300">{passPrice} CP</span>{tx('?', '에 구매하시겠습니까?')}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="py-2 rounded-lg border border-white/20 bg-black/30 text-white/90 hover:bg-black/50 transition-colors cursor-pointer"
                            >
                                {tx('Cancel', '취소')}
                            </button>
                            <button
                                onClick={handleConfirmPurchase}
                                className="py-2 rounded-lg border border-red-300/45 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-colors cursor-pointer"
                            >
                                {tx('Confirm', '확인')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
