'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { API } from '@/lib/api/client';

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
    const router = useRouter();
    const [items, setItems] = useState<CashshopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingItemId, setBuyingItemId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [brokenIcons, setBrokenIcons] = useState<Record<number, boolean>>({});
    const [cashPoints, setCashPoints] = useState<number | null>(null);
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
                    throw new Error(response.data?.message || 'Could not load cashshop.');
                }
                setItems(response.data.items || []);

                const privateRes = await API.get('/private');
                if ((privateRes.status === 200 || privateRes.status === 201) && typeof privateRes.data?.mallpoints === 'number') {
                    setCashPoints(privateRes.data.mallpoints);
                }
            } catch (error: any) {
                console.error(error);
                toast.error('Failed to load cashshop items.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
                toast.error('Not enough mallpoints. Redirecting to donation page...');
                router.push(response.data.redirectTo);
                return false;
            }

            if (response.status >= 400 || !response.data?.ok) {
                throw new Error(response.data?.message || 'Purchase failed.');
            }

            if (typeof response.data?.mallpoints === 'number') {
                setCashPoints(response.data.mallpoints);
            }

            if (isGift && response.data?.purchased?.gift?.CharName) {
                toast.success(`Gift sent to ${response.data.purchased.gift.CharName}.`);
            } else {
                toast.success(`Purchased ${item.wszName} successfully.`);
            }
            return true;
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Purchase failed.');
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
            toast.error('Please enter a character name.');
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
                throw new Error(response.data?.message || 'Character not found.');
            }

            setGiftTarget(response.data.character);
            toast.success(`Character found: ${response.data.character.CharName}`);
        } catch (error: any) {
            toast.error(error?.message || 'Could not verify character.');
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
                    <p className="text-xs uppercase tracking-[0.24em] text-red-300/90 mb-3">DBOD Premium Store</p>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-white to-stone-300 bg-clip-text text-transparent">
                                Cashshop
                            </h1>
                            <p className="text-white/70 mt-2 max-w-2xl">
                                Fast delivery to cashshop storage. After purchase, you must logout then login again to see the item in cashshop storage.
                            </p>
                            {cashPoints !== null ? (
                                <p className="text-sm mt-3 inline-flex items-center rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-red-200">
                                    Your Cash Points: <span className="ml-1 font-semibold">{cashPoints} CP</span>
                                </p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/donate?from=cashshop&insufficient=1')}
                            className="inline-flex items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25 transition cursor-pointer"
                        >
                            Need points? Top up now
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-full md:w-[420px] rounded-xl border border-white/15 bg-stone-900/70 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 py-24 text-center text-white/75">
                        Loading cashshop items...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/25 py-24 text-center text-white/75">
                        {search.trim() ? 'No items matched your search.' : 'No cashshop items available right now.'}
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
                                            <p className="text-xs text-white/55 mt-1">Stack x{item.byStackCount}</p>

                                            <div className="mt-2 flex items-end justify-between gap-3">
                                                <div>
                                                    {item.byDiscount > 0 ? (
                                                        <p className="text-xs text-white/40 line-through">{item.dwCash} CP</p>
                                                    ) : null}
                                                    <p className="text-lg font-bold text-red-300 leading-tight">{item.finalCash} CP</p>
                                                    {savings > 0 ? (
                                                        <p className="text-[11px] text-emerald-300/90">Save {savings} CP</p>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => requestPurchase(item)}
                                                        disabled={buyingItemId === item.itemId}
                                                        className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                                                    >
                                                        {buyingItemId === item.itemId ? 'Purchasing...' : 'Buy'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGiftModal(item)}
                                                        className="shrink-0 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 transition cursor-pointer"
                                                    >
                                                        Gift
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
                            <h2 className="text-lg font-bold text-white">Gift Item</h2>
                            <button
                                type="button"
                                onClick={() => setGiftItem(null)}
                                className="text-white/60 hover:text-white transition cursor-pointer"
                            >
                                X
                            </button>
                        </div>
                        <p className="text-sm text-white/70 mt-2">
                            Send <span className="font-semibold text-white">{giftItem.wszName}</span> for{' '}
                            <span className="font-semibold text-red-300">{giftItem.finalCash} CP</span>.
                        </p>

                        <div className="mt-4 space-y-3">
                            <label className="block text-xs text-white/60 uppercase tracking-wide">Character name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={giftCharacterName}
                                    onChange={(e) => {
                                        setGiftCharacterName(e.target.value);
                                        setGiftTarget(null);
                                    }}
                                    placeholder="Type target character name"
                                    className="flex-1 rounded-lg border border-white/15 bg-stone-950/70 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                                />
                                <button
                                    type="button"
                                    onClick={handleCheckGiftTarget}
                                    disabled={isCheckingGiftTarget}
                                    className="rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-60 transition cursor-pointer"
                                >
                                    {isCheckingGiftTarget ? 'Checking...' : 'Check'}
                                </button>
                            </div>

                            {!giftTarget ? (
                                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/55">
                                    Check character first. Gift purchase is enabled only after valid verification.
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setGiftItem(null)}
                                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGiftPurchase}
                                disabled={!giftTarget || Boolean(buyingItemId)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                            >
                                Purchase Gift
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {pendingPurchase ? (
                <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-stone-900/95 p-5 shadow-2xl">
                        <h2 className="text-lg font-bold text-white">Confirm Purchase</h2>
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
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmPendingPurchase}
                                disabled={Boolean(buyingItemId)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 transition cursor-pointer"
                            >
                                {buyingItemId ? 'Purchasing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
