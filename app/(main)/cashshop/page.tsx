'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { API } from '@/lib/api/client';
import { useLocale } from '@/components/LocaleProvider';
import { CashshopSlotMachine } from '@/components/CashshopSlotMachine';

type CashshopItem = {
    itemId: number;
    wszName: string;
    szIcon_Name: string;
    byStackCount: number;
    wDisplayBitFlag: number;
    dwCash: number;
    byDiscount: number;
    finalCash: number;
};

type GiftTarget = {
    CharID: number;
    CharName: string;
    AccountID: number;
};

type PendingPurchase = {
    item: CashshopItem;
    options?: { isGift?: boolean; giftCharacterName?: string };
    fromGiftModal?: boolean;
};

function iconPath(name: string): string {
    const trimmed = (name || '').trim();
    if (!trimmed) return '/icon/i_empty_cs_s.png';
    return trimmed.endsWith('.png') ? `/icon/${trimmed}` : `/icon/${trimmed}.png`;
}

function getDisplayBadge(flag: number): string | null {
    if (flag === 1) return 'NEW';
    if (flag === 2) return 'HOT';
    if (flag === 3) return 'LIMITED';
    return null;
}

function getDisplayBadgeClass(flag: number): string {
    if (flag === 1) {
        return 'border-emerald-300/80 bg-gradient-to-r from-emerald-300 to-emerald-500 text-black shadow-[0_0_14px_rgba(16,185,129,0.45)]';
    }
    if (flag === 2) {
        return 'border-orange-300/80 bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 text-black shadow-[0_0_14px_rgba(249,115,22,0.45)]';
    }
    if (flag === 3) {
        return 'border-fuchsia-300/80 bg-gradient-to-r from-fuchsia-300 via-violet-400 to-indigo-500 text-black shadow-[0_0_14px_rgba(192,132,252,0.45)]';
    }
    return '';
}

export default function CashshopPage() {
    const { locale } = useLocale();
    const tx = useCallback((en: string, kr: string) => (locale === 'kr' ? kr : en), [locale]);
    const router = useRouter();
    const [items, setItems] = useState<CashshopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingItemId, setBuyingItemId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [brokenIcons, setBrokenIcons] = useState<Record<number, boolean>>({});
    const [cashPoints, setCashPoints] = useState<number | null>(null);
    const [waguCoins, setWaguCoins] = useState<number | null>(null);
    const [giftItem, setGiftItem] = useState<CashshopItem | null>(null);
    const [giftCharacterName, setGiftCharacterName] = useState('');
    const [giftTarget, setGiftTarget] = useState<GiftTarget | null>(null);
    const [isCheckingGiftTarget, setIsCheckingGiftTarget] = useState(false);
    const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await API.get('/cashshop/items');
                if (response.status >= 400 || !response.data?.success) {
                    throw new Error(response.data?.message || tx('Could not load cashshop.', '캐시샵을 불러오지 못했습니다.'));
                }
                setItems(response.data.items || []);

                const privateRes = await API.get('/private');
                if (privateRes.status === 200 || privateRes.status === 201) {
                    if (typeof privateRes.data?.mallpoints === 'number') {
                        setCashPoints(privateRes.data.mallpoints);
                    }
                    if (typeof privateRes.data?.waguCoins === 'number') {
                        setWaguCoins(privateRes.data.waguCoins);
                    }
                }
            } catch (error: any) {
                console.error(error);
                toast.error(tx('Failed to load cashshop items.', '캐시샵 아이템을 불러오지 못했습니다.'));
            } finally {
                setLoading(false);
            }
        })();
    }, [locale, tx]);

    const filteredItems = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => item.wszName.toLowerCase().includes(term));
    }, [items, search]);

    async function handleBuy(
        item: CashshopItem,
        options?: { isGift?: boolean; giftCharacterName?: string }
    ): Promise<boolean> {
        if (buyingItemId) return false;

        setBuyingItemId(item.itemId);
        try {
            const isGift = Boolean(options?.isGift);
            const giftName = (options?.giftCharacterName || '').trim();

            const response = await API.post('/cashshop/purchase', {
                itemId: item.itemId,
                quantity: 1,
                isGift,
                giftCharacterName: giftName || undefined,
            });

            if (response.status === 401) {
                router.push('/login?redirect=/cashshop');
                return false;
            }

            if (response.status === 402 && response.data?.redirectTo) {
                toast.error(tx('Not enough mallpoints. Redirecting to donation page...', '캐시 포인트가 부족합니다. 후원 페이지로 이동합니다...'));
                router.push(response.data.redirectTo);
                return false;
            }

            if (response.status >= 400 || !response.data?.ok) {
                throw new Error(response.data?.message || tx('Purchase failed.', '구매에 실패했습니다.'));
            }

            if (typeof response.data?.mallpoints === 'number') {
                setCashPoints(response.data.mallpoints);
            }

            if (isGift && response.data?.purchased?.gift?.CharName) {
                toast.success(tx(`Gift sent to ${response.data.purchased.gift.CharName}.`, `${response.data.purchased.gift.CharName} 캐릭터에게 선물을 보냈습니다.`));
            } else {
                toast.success(tx(`${item.wszName} purchased successfully.`, `${item.wszName} 구매가 완료되었습니다.`));
            }
            return true;
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || tx('Purchase failed.', '구매에 실패했습니다.'));
            return false;
        } finally {
            setBuyingItemId(null);
        }
    }

    function requestPurchase(
        item: CashshopItem,
        options?: { isGift?: boolean; giftCharacterName?: string },
        fromGiftModal?: boolean
    ) {
        setPendingPurchase({ item, options, fromGiftModal: Boolean(fromGiftModal) });
    }

    async function confirmPendingPurchase() {
        if (!pendingPurchase) return;
        const success = await handleBuy(pendingPurchase.item, pendingPurchase.options);
        if (success && pendingPurchase.fromGiftModal) {
            setGiftItem(null);
            setGiftCharacterName('');
            setGiftTarget(null);
        }
        if (success) {
            setPendingPurchase(null);
        }
    }

    async function handleCheckGiftTarget() {
        const trimmed = giftCharacterName.trim();
        if (!trimmed) {
            toast.error(tx('Please enter a character name.', '캐릭터 이름을 입력해주세요.'));
            return;
        }

        setIsCheckingGiftTarget(true);
        setGiftTarget(null);
        try {
            const response = await API.post('/cashshop/check-character', {
                characterName: trimmed,
            });

            if (response.status === 401) {
                router.push('/login?redirect=/cashshop');
                return;
            }

            if (response.status >= 400 || !response.data?.success || !response.data?.character) {
                throw new Error(response.data?.message || tx('Character not found.', '캐릭터를 찾을 수 없습니다.'));
            }

            setGiftTarget(response.data.character);
            toast.success(tx(`Character found: ${response.data.character.CharName}`, `캐릭터 확인: ${response.data.character.CharName}`));
        } catch (error: any) {
            toast.error(error?.message || tx('Could not verify character.', '캐릭터 확인에 실패했습니다.'));
        } finally {
            setIsCheckingGiftTarget(false);
        }
    }

    function openGiftModal(item: CashshopItem) {
        setGiftItem(item);
        setGiftCharacterName('');
        setGiftTarget(null);
    }

    function handleGiftPurchase() {
        if (!giftItem || !giftTarget || buyingItemId) return;
        requestPurchase(
            giftItem,
            {
                isGift: true,
                giftCharacterName: giftTarget.CharName,
            },
            true
        );
    }

    return (
        <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen duration-500 px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-8 md:mb-10">
                    <p className="text-xs uppercase tracking-[0.24em] text-red-300/90 mb-3">{tx('DBOD Premium Store', 'DBOD 프리미엄 스토어')}</p>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-white to-stone-300 bg-clip-text text-transparent">
                                {tx('Cashshop', '캐시샵')}
                            </h1>
                            <p className="text-white/70 mt-2 max-w-2xl">
                                {tx('Fast delivery to cashshop storage. After purchase, you must logout then login again to see the item in cashshop storage.', '캐시샵 보관함으로 빠르게 지급됩니다. 구매 후 보관함 반영을 위해 로그아웃 후 다시 로그인하세요.')}
                            </p>
                            {cashPoints !== null ? (
                                <p className="text-sm mt-3 inline-flex items-center rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-red-200">
                                    {tx('Your Cash Points', '내 캐시 포인트')}: <span className="ml-1 font-semibold">{cashPoints} CP</span>
                                </p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/donate?from=cashshop&insufficient=1')}
                            className="inline-flex items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25 transition cursor-pointer"
                        >
                            {tx('Need points? Top up now', '포인트가 부족한가요? 충전하기')}
                        </button>
                    </div>
                </div>

                <CashshopSlotMachine
                    tx={tx}
                    waguCoins={waguCoins}
                    setWaguCoins={setWaguCoins}
                    cashPoints={cashPoints}
                    setCashPoints={setCashPoints}
                />

                <div className="mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={tx('Search items...', '아이템 검색...')}
                        className="w-full md:w-[420px] rounded-xl border border-white/15 bg-stone-900/70 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 py-24 text-center text-white/75">
                        {tx('Loading cashshop items...', '캐시샵 아이템 불러오는 중...')}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 py-24 text-center text-white/75">
                        {search.trim() ? tx('No items matched your search.', '검색 결과가 없습니다.') : tx('No cashshop items available right now.', '현재 판매 중인 캐시샵 아이템이 없습니다.')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5">
                        {filteredItems.map((item) => {
                            const savings = Math.max(0, item.dwCash - item.finalCash);
                            const resolvedIcon = brokenIcons[item.itemId] ? '/icon/i_empty_cs_s.png' : iconPath(item.szIcon_Name);
                            const displayBadge = getDisplayBadge(item.wDisplayBitFlag);

                            return (
                                <div
                                    key={item.itemId}
                                    className="group rounded-2xl border border-white/10 backdrop-blur-sm px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl bg-stone-900/55 hover:border-white/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 rounded-lg border border-white/10 bg-black/35 flex items-center justify-center">
                                                <Image
                                                    src={resolvedIcon}
                                                    alt={item.wszName}
                                                    className="object-contain rounded"
                                                    width={44}
                                                    height={44}
                                                    unoptimized
                                                    onError={() =>
                                                        setBrokenIcons((prev) => ({
                                                            ...prev,
                                                            [item.itemId]: true,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            {item.byDiscount > 0 && (
                                                <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-md bg-red-600 font-bold shadow-lg">
                                                    -{item.byDiscount}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-sm md:text-base font-semibold text-white/95 leading-snug line-clamp-2">
                                                    {item.wszName}
                                                </h3>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {displayBadge ? (
                                                        <span
                                                            className={`text-[10px] px-2.5 py-1 rounded-md border font-black tracking-wide uppercase ${getDisplayBadgeClass(
                                                                item.wDisplayBitFlag
                                                            )}`}
                                                        >
                                                            {displayBadge}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <p className="text-xs text-white/55 mt-1">{tx('Stack', '수량')} x{item.byStackCount}</p>

                                            <div className="mt-2 flex items-end justify-between gap-3">
                                                <div>
                                                    {item.byDiscount > 0 ? (
                                                        <p className="text-xs text-white/40 line-through">{item.dwCash} CP</p>
                                                    ) : null}
                                                    <p className="text-lg font-bold text-red-300 leading-tight">{item.finalCash} CP</p>
                                                    {savings > 0 ? (
                                                        <p className="text-[11px] text-emerald-300/90">{tx('Save', '절약')} {savings} CP</p>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => requestPurchase(item)}
                                                        disabled={buyingItemId === item.itemId}
                                                        className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                                                    >
                                                        {buyingItemId === item.itemId ? tx('Purchasing...', '구매 중...') : tx('Buy', '구매')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGiftModal(item)}
                                                        className="shrink-0 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 transition cursor-pointer"
                                                    >
                                                        {tx('Gift', '선물')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {giftItem ? (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-stone-900/95 p-5 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-white">{tx('Gift Item', '아이템 선물')}</h2>
                            <button
                                type="button"
                                onClick={() => setGiftItem(null)}
                                className="text-white/60 hover:text-white transition cursor-pointer"
                            >
                                X
                            </button>
                        </div>
                        <p className="text-sm text-white/70 mt-2">
                            {tx('Send', '보내기')} <span className="font-semibold text-white">{giftItem.wszName}</span> {tx('for', '가격')}{' '}
                            <span className="font-semibold text-red-300">{giftItem.finalCash} CP</span>.
                        </p>

                        <div className="mt-4 space-y-3">
                            <label className="block text-xs text-white/60 uppercase tracking-wide">{tx('Character name', '캐릭터 이름')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={giftCharacterName}
                                    onChange={(e) => {
                                        setGiftCharacterName(e.target.value);
                                        setGiftTarget(null);
                                    }}
                                    placeholder={tx('Type target character name', '대상 캐릭터 이름 입력')}
                                    className="flex-1 rounded-lg border border-white/15 bg-stone-950/70 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                                />
                                <button
                                    type="button"
                                    onClick={handleCheckGiftTarget}
                                    disabled={isCheckingGiftTarget}
                                    className="rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60 transition cursor-pointer"
                                >
                                    {isCheckingGiftTarget ? tx('Checking...', '확인 중...') : tx('Check', '확인')}
                                </button>
                            </div>

                            {!giftTarget ? (
                                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/55">
                                    {tx('Check character first. Gift purchase is enabled only after valid verification.', '먼저 캐릭터를 확인하세요. 검증 완료 후 선물 구매가 가능합니다.')}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setGiftItem(null)}
                                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer"
                            >
                                {tx('Cancel', '취소')}
                            </button>
                            <button
                                type="button"
                                onClick={handleGiftPurchase}
                                disabled={!giftTarget || Boolean(buyingItemId)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                            >
                                {tx('Purchase Gift', '선물 구매')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {pendingPurchase ? (
                <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-stone-900/95 p-5 shadow-2xl">
                        <h2 className="text-lg font-bold text-white">{tx('Confirm Purchase', '구매 확인')}</h2>
                        <p className="text-sm text-white/75 mt-3">
                            {pendingPurchase.options?.isGift
                                ? <>Gift <span className="font-semibold text-white">{pendingPurchase.item.wszName}</span> to <span className="font-semibold text-white">{pendingPurchase.options.giftCharacterName}</span> for <span className="font-semibold text-red-300">{pendingPurchase.item.finalCash} CP</span>?</>
                                : <>Buy <span className="font-semibold text-white">{pendingPurchase.item.wszName}</span> for <span className="font-semibold text-red-300">{pendingPurchase.item.finalCash} CP</span>?</>}
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPendingPurchase(null)}
                                disabled={Boolean(buyingItemId)}
                                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10 disabled:opacity-60 transition cursor-pointer"
                            >
                                {tx('Cancel', '취소')}
                            </button>
                            <button
                                type="button"
                                onClick={confirmPendingPurchase}
                                disabled={Boolean(buyingItemId)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                            >
                                {buyingItemId ? tx('Purchasing...', '구매 중...') : tx('Confirm', '확인')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
