'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { API } from '@/lib/api/client';
import { iconPublicPathFromFilename } from '@/lib/utils/icon-public-path';

export type SlotMachineTx = (en: string, kr: string) => string;

type SlotItem = {
    id: number;
    tblidx: number;
    amount: number;
    feq: number;
    name: string;
    szIcon_Name: string;
    iconUrl: string | null;
};

type WinLine = {
    tblidx: number;
    amount: number;
    name: string;
    iconUrl: string | null;
};

function iconPathFromUrl(iconUrl: string | null, szIcon_Name: string): string {
    if (iconUrl) return iconUrl;
    return iconPublicPathFromFilename(szIcon_Name) ?? '/icon/i_empty_cs_s.png';
}

type Props = {
    tx: SlotMachineTx;
    waguCoins: number | null;
    setWaguCoins: (n: number) => void;
};

const SPIN_COUNTS = [1, 5, 10] as const;

export function CashshopSlotMachine({ tx, waguCoins, setWaguCoins }: Props) {
    const router = useRouter();
    const txRef = useRef(tx);
    txRef.current = tx;
    const [items, setItems] = useState<SlotItem[]>([]);
    const [slotLoading, setSlotLoading] = useState(true);
    const [spinning, setSpinning] = useState(false);
    const [lastWins, setLastWins] = useState<WinLine[] | null>(null);
    const [brokenIcons, setBrokenIcons] = useState<Record<number, boolean>>({});
    const [reelTick, setReelTick] = useState(0);

    const waguPerSpin = 1;

    // Do not depend on `tx` here: a new function reference each parent render would retrigger
    // useEffect and spam GET /slot-machine. Copy for toasts/errors via txRef.
    const loadSlot = useCallback(async () => {
        setSlotLoading(true);
        try {
            const response = await API.get('/slot-machine');
            if (response.status === 401) {
                router.push('/login?redirect=/cashshop');
                return;
            }
            if (response.status >= 400 || !response.data?.success) {
                const t = txRef.current;
                throw new Error(response.data?.message || t('Could not load slot machine.', '슬롯 머신을 불러오지 못했습니다.'));
            }
            setItems(response.data.items || []);
        } catch (e: unknown) {
            console.error(e);
            toast.error(txRef.current('Failed to load slot machine.', '슬롯 머신 로드에 실패했습니다.'));
            setItems([]);
        } finally {
            setSlotLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadSlot();
    }, [loadSlot]);

    const reelPreview = useMemo(() => {
        if (items.length === 0) return null;
        const idx = reelTick % items.length;
        return items[idx];
    }, [items, reelTick]);

    /** Sum of feq weights — server uses these for weighted rolls. */
    const totalFeqWeight = useMemo(
        () => items.reduce((sum, r) => sum + Math.max(0, Number(r.feq) || 0), 0),
        [items]
    );

    function chancePercentLabel(feq: number): string {
        if (totalFeqWeight <= 0) return '—';
        const pct = (Math.max(0, Number(feq) || 0) / totalFeqWeight) * 100;
        return `${pct < 10 && pct > 0 ? pct.toFixed(2) : pct.toFixed(1)}%`;
    }

    useEffect(() => {
        if (!spinning || items.length === 0) return;
        const id = window.setInterval(() => {
            setReelTick((t) => t + 1);
        }, 90);
        return () => window.clearInterval(id);
    }, [spinning, items.length]);

    async function runSpin(count: (typeof SPIN_COUNTS)[number]) {
        if (spinning) return;
        const cost = count * waguPerSpin;
        if (waguCoins !== null && waguCoins < cost) {
            toast.error(tx('Not enough Wagu coins.', '와구 코인이 부족합니다.'));
            return;
        }
        if (items.length === 0) {
            toast.error(tx('Slot machine has no rewards yet.', '슬롯 보상이 아직 설정되지 않았습니다.'));
            return;
        }

        setSpinning(true);
        setLastWins(null);
        setReelTick(0);

        try {
            const response = await API.post('/slot-machine/spin', { count });

            if (response.status === 401) {
                router.push('/login?redirect=/cashshop');
                return;
            }

            if (response.status === 402) {
                toast.error(tx('Not enough Wagu coins.', '와구 코인이 부족합니다.'));
                if (typeof response.data?.waguCoins === 'number') {
                    setWaguCoins(response.data.waguCoins);
                }
                return;
            }

            if (response.status >= 400 || !response.data?.ok) {
                throw new Error(response.data?.message || tx('Spin failed.', '스핀에 실패했습니다.'));
            }

            if (typeof response.data.waguCoins === 'number') {
                setWaguCoins(response.data.waguCoins);
            }
            setLastWins(response.data.wins || []);
            toast.success(
                tx(
                    `You won ${(response.data.wins || []).length} prize(s)! Check cashshop storage after relog.`,
                    `${(response.data.wins || []).length}개 보상을 획득했습니다! 반영을 위해 재로그인 후 캐시샵 보관함을 확인하세요.`
                )
            );
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : tx('Spin failed.', '스핀에 실패했습니다.');
            toast.error(msg);
        } finally {
            setSpinning(false);
        }
    }

    return (
        <div className="mb-8 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-stone-900/60 to-stone-900/40 p-5 md:p-6 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-300/90 mb-1">
                        {tx('Wagu Slot Machine', '와구 슬롯 머신')}
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                        {tx('Spin for item rewards', '아이템 보상 뽑기')}
                    </h2>
                    <p className="text-sm text-white/65 mt-1 max-w-xl">
                        {tx(
                            'Each spin costs 1 Wagu coin. Prizes go to your cashshop storage (relog to see them). The table shows each prize’s odds as a percent of the pool (one spin; all rows add up to 100%).',
                            '스핀당 와구 코인 1개가 소모됩니다. 당첨 아이템은 캐시샵 보관함으로 지급됩니다(재로그인 후 확인). 표의 %는 한 번 스핀 기준 풀 안에서의 비율이며, 합계는 100%입니다.'
                        )}
                    </p>
                </div>
                {waguCoins !== null ? (
                    <div className="shrink-0 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-2 text-amber-100">
                        <span className="text-xs text-amber-200/80">{tx('Your Wagu', '보유 와구')}</span>
                        <p className="text-lg font-bold tabular-nums">{waguCoins}</p>
                    </div>
                ) : null}
            </div>

            <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
                <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 py-8 px-4 min-h-[200px]">
                    {slotLoading ? (
                        <p className="text-white/55 text-sm">{tx('Loading slot...', '슬롯 불러오는 중...')}</p>
                    ) : items.length === 0 ? (
                        <p className="text-white/55 text-sm text-center">{tx('No rewards in the pool yet.', '보상 풀이 비어 있습니다.')}</p>
                    ) : (
                        <>
                            <div
                                className={`relative w-28 h-28 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-colors ${
                                    spinning
                                        ? 'border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                                        : 'border-white/15 bg-black/40'
                                }`}
                            >
                                {reelPreview ? (
                                    <Image
                                        src={
                                            brokenIcons[reelPreview.tblidx]
                                                ? '/icon/i_empty_cs_s.png'
                                                : iconPathFromUrl(reelPreview.iconUrl, reelPreview.szIcon_Name)
                                        }
                                        alt=""
                                        width={96}
                                        height={96}
                                        className="object-contain p-2"
                                        unoptimized
                                        onError={() =>
                                            setBrokenIcons((prev) => ({ ...prev, [reelPreview.tblidx]: true }))
                                        }
                                    />
                                ) : null}
                            </div>
                            <p className="mt-3 text-xs text-white/50 text-center min-h-[2.5rem] line-clamp-2 px-2">
                                {spinning && reelPreview
                                    ? reelPreview.name
                                    : lastWins === null
                                      ? tx('Choose spins below', '아래에서 스핀 횟수를 선택하세요')
                                      : null}
                            </p>
                        </>
                    )}

                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {SPIN_COUNTS.map((c) => {
                            const cost = c * waguPerSpin;
                            const disabled =
                                spinning ||
                                slotLoading ||
                                items.length === 0 ||
                                (waguCoins !== null && waguCoins < cost);
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => void runSpin(c)}
                                    className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:from-amber-500 hover:to-orange-500 disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    {spinning
                                        ? tx('Spinning...', '스핀 중...')
                                        : `${c} ${tx('spin', '스핀')} (${cost} ${tx('Wagu', '와구')})`}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {lastWins && lastWins.length > 0 ? (
                        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90 mb-2">
                                {tx('This round', '이번 결과')}
                            </p>
                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {lastWins.map((w, i) => (
                                    <li key={`${w.tblidx}-${i}`} className="flex items-center gap-2 text-sm text-white/90">
                                        <span className="w-9 h-9 shrink-0 rounded-lg border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden">
                                            <Image
                                                src={
                                                    brokenIcons[w.tblidx]
                                                        ? '/icon/i_empty_cs_s.png'
                                                        : iconPathFromUrl(w.iconUrl, '')
                                                }
                                                alt=""
                                                width={32}
                                                height={32}
                                                className="object-contain"
                                                unoptimized
                                                onError={() =>
                                                    setBrokenIcons((prev) => ({ ...prev, [w.tblidx]: true }))
                                                }
                                            />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="font-medium">{w.name}</span>
                                            <span className="text-white/55"> ×{w.amount}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                            {tx('Prize pool', '보상 풀')}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                            {tx(
                                'Percent = share of this prize in the pool. Higher % = more likely on each spin.',
                                '% = 이 보상이 풀에서 차지하는 비율입니다. %가 클수록 한 스핀당 나올 가능성이 큽니다.'
                            )}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 overflow-hidden max-h-[280px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-stone-900/95 border-b border-white/10">
                                <tr>
                                    <th className="p-2 w-12" />
                                    <th className="p-2 text-white/70">{tx('Name', '이름')}</th>
                                    <th className="p-2 text-white/70 w-14">{tx('Qty', '수량')}</th>
                                    <th className="p-2 text-white/70 w-[7.5rem]">
                                        {tx('Chance', '당첨 확률')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {slotLoading ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-white/50 text-center">
                                            …
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-white/50 text-center">
                                            {tx('No rows', '행 없음')}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row) => (
                                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                                            <td className="p-2">
                                                <div className="w-9 h-9 rounded-md border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden">
                                                    <Image
                                                        src={
                                                            brokenIcons[row.tblidx]
                                                                ? '/icon/i_empty_cs_s.png'
                                                                : iconPathFromUrl(row.iconUrl, row.szIcon_Name)
                                                        }
                                                        alt=""
                                                        width={32}
                                                        height={32}
                                                        className="object-contain"
                                                        unoptimized
                                                        onError={() =>
                                                            setBrokenIcons((prev) => ({
                                                                ...prev,
                                                                [row.tblidx]: true,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-2 text-white/90">{row.name}</td>
                                            <td className="p-2 text-amber-200/90 tabular-nums">{row.amount}</td>
                                            <td className="p-2 text-emerald-200/95 tabular-nums font-semibold">
                                                {chancePercentLabel(row.feq)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
