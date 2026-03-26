'use client';

import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus, faRotate, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { local, formatString } from '@/lib/utils/localize';
import { API } from '@/lib/api/client';
import { SuccessToast, DangerToast } from '@/lib/utils/toasts';
import type { ItemEnchantRow } from '@/lib/game/itemEnchantCsv';
import { fetchItemEnchantCsv } from '@/lib/game/itemEnchantCsv';
import { buildPreviewState, getEnchantDisplayName } from '@/lib/game/itemEnchantBounds';
import { fetchSystemEffectNameMap } from '@/lib/game/systemEffectCsv';
import type { EquipmentCategoryId } from '@/lib/game/dboItemCategory';
import { EQUIPMENT_CATEGORY_LABELS } from '@/lib/game/dboItemCategory';
import {
    ITEM_RANK_EXCELLENT,
    ITEM_RANK_LEGENDARY,
    ITEM_RANK_RARE,
    ITEM_RANK_SUPERIOR,
} from '@/lib/game/dboItemWorth';
import EquipmentStatDetailModal from '@/components/EquipmentStatDetailModal';
import { useLocale } from '@/components/LocaleProvider';

interface CharacterForModal {
    CharID?: number;
    CharName?: string;
    CCBD_Token?: number;
    CCBD_Limit?: number;
    CCBD_Entry?: number;
    Item_Worth?: number;
}

interface UpgradeEquipmentModalProps {
    char: CharacterForModal | null;
    accountVip?: number;
    mallpoints?: number;
    isOpen: boolean;
    onClose: () => void;
    onRefillSuccess?: (newCCBDEntry: number) => void;
    onUpgradeSuccess?: (payload: { Item_Worth: number; CCBD_Token: number }) => void;
}

const RANK_OPTIONS: { value: number; label: string }[] = [
    { value: ITEM_RANK_SUPERIOR, label: 'Superior' },
    { value: ITEM_RANK_EXCELLENT, label: 'Excellent' },
    { value: ITEM_RANK_RARE, label: 'Rare' },
    { value: ITEM_RANK_LEGENDARY, label: 'Legendary' },
];

const EQUIPMENT_CATEGORY_ORDER: EquipmentCategoryId[] = [
    'main_weapon',
    'sub_weapon',
    'jacket',
    'pants',
    'boots',
    'necklace',
    'earring',
    'ring',
];

const EQUIPMENT_OPTIONS: { id: EquipmentCategoryId; label: string }[] = EQUIPMENT_CATEGORY_ORDER.map((id) => ({
    id,
    label: EQUIPMENT_CATEGORY_LABELS[id],
}));

/** Matches unsigned SMALLINT `Item_Worth` column (was tinyint 0–255). */
const ITEM_WORTH_MAX = 65535;

export default function UpgradeEquipmentModal({ char, accountVip = 0, mallpoints = 0, isOpen, onClose, onRefillSuccess, onUpgradeSuccess }: UpgradeEquipmentModalProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [isClosing, setIsClosing] = useState(false);
    const [upgradeAmount, setUpgradeAmount] = useState(0);
    const [showRefillConfirm, setShowRefillConfirm] = useState(false);
    const [isRefilling, setIsRefilling] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [ccbdEntry, setCcbEntry] = useState(char?.CCBD_Entry ?? 0);

    const [enchantRows, setEnchantRows] = useState<ItemEnchantRow[] | null>(null);
    const [enchantLoadError, setEnchantLoadError] = useState<string | null>(null);
    const [effectNameBySeTblidx, setEffectNameBySeTblidx] = useState<Map<number, string>>(() => new Map());
    const [itemRank, setItemRank] = useState(ITEM_RANK_LEGENDARY);
    const [needMinLevel, setNeedMinLevel] = useState(70);
    const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategoryId>('ring');
    const [statDetailRow, setStatDetailRow] = useState<ItemEnchantRow | null>(null);

    const itemWorth = char?.Item_Worth ?? 0;

    const ccbdTokens = char?.CCBD_Token ?? 0;
    const ccbdLimit = char?.CCBD_Limit ?? 0;
    const maxAffordableByCap = Math.max(0, ITEM_WORTH_MAX - itemWorth);
    const maxUpgrades = Math.min(Math.floor(ccbdTokens / 5), maxAffordableByCap);

    const canRefill = ccbdEntry < ccbdLimit && mallpoints >= 25;
    const refillCost = 25;

    useEffect(() => {
        if (char) {
            setCcbEntry(char.CCBD_Entry ?? 0);
        }
    }, [char]);

    useEffect(() => {
        if (isOpen && char) {
            setUpgradeAmount(0);
        }
    }, [isOpen, char]);

    useEffect(() => {
        setUpgradeAmount((prev) => Math.min(prev, maxUpgrades));
    }, [maxUpgrades]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        let cancelled = false;
        setEnchantLoadError(null);
        fetchItemEnchantCsv()
            .then((rows) => {
                if (!cancelled) {
                    setEnchantRows(rows);
                }
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setEnchantRows(null);
                    setEnchantLoadError(e instanceof Error ? e.message : local.enchantPreviewLoadError);
                }
            });

        fetchSystemEffectNameMap()
            .then((map) => {
                if (!cancelled) {
                    setEffectNameBySeTblidx(map);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setEffectNameBySeTblidx(new Map());
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const itemWorthAfterPreview =
        upgradeAmount > 0 ? Math.min(ITEM_WORTH_MAX, itemWorth + upgradeAmount) : itemWorth;

    const preview = useMemo(() => {
        if (!enchantRows?.length) {
            return null;
        }
        return buildPreviewState(
            enchantRows,
            itemRank,
            equipmentCategory,
            needMinLevel,
            itemWorth,
            itemWorthAfterPreview
        );
    }, [enchantRows, itemRank, equipmentCategory, needMinLevel, itemWorth, itemWorthAfterPreview]);

    const sortedApplicable = useMemo(() => {
        if (!preview?.applicable.length) {
            return [];
        }
        const rows = [...preview.applicable];
        rows.sort((a, b) => {
            const la = getEnchantDisplayName(a, effectNameBySeTblidx);
            const lb = getEnchantDisplayName(b, effectNameBySeTblidx);
            const cmp = la.localeCompare(lb);
            if (cmp !== 0) {
                return cmp;
            }
            return a.tblidx - b.tblidx;
        });
        return rows;
    }, [preview, effectNameBySeTblidx]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const incrementAmount = () => setUpgradeAmount((prev) => Math.min(prev + 1, maxUpgrades));
    const decrementAmount = () => setUpgradeAmount((prev) => Math.max(prev - 1, 0));
    const canIncrement = upgradeAmount < maxUpgrades;

    const handleUpgradeConfirm = async () => {
        if (!char?.CharID || upgradeAmount < 1 || isUpgrading) return;
        setIsUpgrading(true);
        try {
            const res = await API.post('/equipment-upgrade', {
                CharID: char.CharID,
                upgradeAmount
            });
            if (res.status === 200 && res.data.success) {
                const iw = res.data.Item_Worth ?? itemWorth + upgradeAmount;
                const tk = res.data.CCBD_Token ?? ccbdTokens - upgradeAmount * 5;
                SuccessToast.fire(local.upgradeEquipmentSuccess);
                onUpgradeSuccess?.({ Item_Worth: iw, CCBD_Token: tk });
                setUpgradeAmount(0);
            } else {
                DangerToast.fire(res.data.message || 'Failed to upgrade');
            }
        } catch {
            DangerToast.fire('Failed to upgrade');
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleRefillConfirm = async () => {
        if (!char?.CharID) return;
        setIsRefilling(true);
        try {
            const res = await API.post('/ccbd-refill', { CharID: char.CharID });
            if (res.status === 200 && res.data.success) {
                const newEntry = res.data.CCBD_Entry ?? ccbdLimit;
                setCcbEntry(newEntry);
                setShowRefillConfirm(false);
                SuccessToast.fire(local.refillSuccess);
                onRefillSuccess?.(newEntry);
            } else {
                DangerToast.fire(res.data.message || 'Failed to refill');
            }
        } catch {
            DangerToast.fire('Failed to refill');
        } finally {
            setIsRefilling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[9999] ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full h-full flex items-center justify-center p-4 md:p-8 ${
                    isOpen && !isClosing ? 'animate-popup-enter' : isClosing ? 'animate-popup-exit' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-red-500/20 flex flex-col">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center bg-stone-800/80 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110 border border-red-500/30 cursor-pointer"
                        aria-label={tx('Close', '닫기')}
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-stone-300 text-lg" />
                    </button>

                    {/* Header */}
                    <div className="p-6 border-b border-red-500/20">
                        <h2 className="text-2xl font-bold text-white">{local.upgradeEquipmentStats}</h2>
                        {char?.CharName && (
                            <p className="text-stone-400 text-sm mt-1">{char.CharName}</p>
                        )}
                    </div>

                    {/* Content - scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Info row: CCBD_Token, CCBD_Limit, CCBD_Entry, VIP */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdToken}</div>
                                <div className="text-red-400 font-bold text-lg">{char?.CCBD_Token ?? 0}</div>
                                <div className="text-stone-500 text-xs mt-0.5">{tx('5 per upgrade', '업그레이드당 5개')}</div>
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdLimit}</div>
                                <div className="text-red-400 font-bold text-lg">{char?.CCBD_Limit ?? 0}</div>
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{local.ccbdEntry}</div>
                                <div className="text-red-400 font-bold text-lg">{ccbdEntry}</div>
                                {canRefill && (
                                    <button
                                        onClick={() => setShowRefillConfirm(true)}
                                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-400/90 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 rounded transition-colors cursor-pointer"
                                    >
                                        <FontAwesomeIcon icon={faRotate} className="text-xs" />
                                        <span>{local.refill}</span>
                                    </button>
                                )}
                            </div>
                            <div className="p-4 bg-stone-800/50 rounded-lg border border-red-500/20">
                                <div className="text-stone-400 text-xs uppercase tracking-wide mb-1">{tx('VIP', 'VIP')}</div>
                                <div className="text-red-400 font-bold text-lg">{accountVip ?? 0}</div>
                            </div>
                        </div>

                        {/* Upgrade section */}
                        <div className="p-4 bg-stone-800/50 rounded-xl border border-red-500/20">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="text-stone-300">
                                    {local.currentUpgradedStats}: <span className="text-red-400 font-bold">{itemWorth}%</span>
                                </div>
                                {maxUpgrades === 0 && itemWorth < ITEM_WORTH_MAX && (
                                    <p className="text-amber-400/90 text-sm">{tx('Need 5 CCBD tokens per upgrade.', '업그레이드당 CCBD 토큰 5개가 필요합니다.')} {tx('You have', '보유')}: {ccbdTokens} {tx('tokens', '토큰')}</p>
                                )}
                                {itemWorth >= ITEM_WORTH_MAX && (
                                    <p className="text-amber-400/90 text-sm">
                                        {tx('Maximum upgraded equipment stats reached.', '최대 장비 업그레이드 수치에 도달했습니다.')} ({ITEM_WORTH_MAX}%)
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={decrementAmount}
                                        disabled={upgradeAmount <= 0}
                                        className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-red-500/20 rounded-lg border border-red-500/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-700"
                                    >
                                        <FontAwesomeIcon icon={faMinus} className="text-stone-300" />
                                    </button>
                                    <span className="text-white font-bold min-w-[4rem] text-center">{upgradeAmount}</span>
                                    <button
                                        onClick={incrementAmount}
                                        disabled={!canIncrement}
                                        className="w-10 h-10 flex items-center justify-center bg-stone-700 hover:bg-red-500/20 rounded-lg border border-red-500/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-700"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-stone-300" />
                                    </button>
                                </div>
                                <div className="text-stone-300">
                                    {formatString(local.increaseStatsBy, upgradeAmount, itemWorth + upgradeAmount)}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUpgradeConfirm}
                                    disabled={upgradeAmount < 1 || isUpgrading || maxUpgrades === 0}
                                    className="w-full sm:w-auto min-w-[10rem] py-2.5 px-6 rounded-lg border border-red-500/50 bg-red-500/20 text-red-400 font-semibold hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/20"
                                >
                                    {isUpgrading ? local.loading : local.applyEquipmentUpgrade}
                                </button>
                            </div>
                        </div>

                        {/* Stats preview — min/max from server worth + enchant costs */}
                        <div className="p-4 bg-stone-800/50 rounded-xl border border-red-500/20">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-white">{local.statsPreviewTitle}</h3>
                                <p className="text-stone-500 text-xs mt-1">{local.statsPreviewHint}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <label className="flex flex-col gap-1 text-xs text-stone-400">
                                    {local.enchantPreviewRank}
                                    <select
                                        value={itemRank}
                                        onChange={(e) => setItemRank(Number(e.target.value))}
                                        className="bg-stone-900 border border-red-500/20 rounded-lg px-3 py-2 text-stone-200 text-sm"
                                    >
                                        {RANK_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1 text-xs text-stone-400">
                                    {local.enchantPreviewLevel}
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={needMinLevel}
                                        onChange={(e) => setNeedMinLevel(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                                        className="bg-stone-900 border border-red-500/20 rounded-lg px-3 py-2 text-stone-200 text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-xs text-stone-400">
                                    {local.enchantPreviewCategory}
                                    <select
                                        value={equipmentCategory}
                                        onChange={(e) => setEquipmentCategory(e.target.value as EquipmentCategoryId)}
                                        className="bg-stone-900 border border-red-500/20 rounded-lg px-3 py-2 text-stone-200 text-sm"
                                    >
                                        {EQUIPMENT_OPTIONS.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {enchantLoadError && (
                                <p className="text-amber-400/90 text-sm mb-3">{enchantLoadError}</p>
                            )}

                            {!enchantRows && !enchantLoadError && (
                                <p className="text-stone-500 text-sm mb-3">{local.loading}</p>
                            )}

                            {preview && (
                                <p className="text-stone-500 text-xs mb-2">
                                    {formatString(local.enchantPreviewWorthPool, preview.worthBefore.toFixed(2))}
                                    {upgradeAmount > 0 && (
                                        <>
                                            {' '}
                                            → {preview.worthAfter.toFixed(2)}
                                        </>
                                    )}
                                </p>
                            )}

                            <div className="grid grid-cols-1 gap-2 max-h-[70vh] min-h-[12rem] overflow-y-auto">
                                {sortedApplicable.length === 0 && enchantRows && !enchantLoadError && (
                                    <p className="text-amber-400/90 text-sm">{local.enchantNoRowsForEquipment}</p>
                                )}
                                {sortedApplicable.map((row) => {
                                    const b0 = preview?.boundsBefore.get(row.tblidx);
                                    const b1 = preview?.boundsAfter.get(row.tblidx);
                                    const label = getEnchantDisplayName(row, effectNameBySeTblidx);
                                    const range0 =
                                        b0 && b0.max >= 1
                                            ? formatString(local.enchantPreviewRange, b0.min, b0.max)
                                            : '—';
                                    const range1 =
                                        b1 && b1.max >= 1
                                            ? formatString(local.enchantPreviewRange, b1.min, b1.max)
                                            : '—';
                                    return (
                                        <div
                                            key={row.tblidx}
                                            className="flex items-center gap-3 text-sm py-2.5 px-3 bg-stone-900/50 rounded border border-red-500/10"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setStatDetailRow(row)}
                                                className="shrink-0 w-9 h-9 flex items-center justify-center text-red-400/90 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg cursor-pointer transition-colors"
                                                title={local.statDetailOpenAria}
                                                aria-label={local.statDetailOpenAria}
                                            >
                                                <FontAwesomeIcon icon={faChartLine} className="text-sm" />
                                            </button>
                                            <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 items-center text-left">
                                                <div className="min-w-0 text-stone-200 font-medium leading-snug self-center">
                                                    {label}
                                                </div>
                                                <div className="min-w-0 flex flex-col gap-1.5 text-stone-400 text-xs sm:text-sm leading-relaxed">
                                                    <div>
                                                        {formatString(local.enchantPreviewBefore, itemWorth)}:{' '}
                                                        <span className="text-stone-300 tabular-nums">{range0}</span>
                                                    </div>
                                                    {upgradeAmount > 0 && b0 && b1 && (
                                                        <div>
                                                            {formatString(
                                                                local.enchantPreviewAfter,
                                                                itemWorthAfterPreview
                                                            )}
                                                            :{' '}
                                                            <span className="text-red-400/95 tabular-nums">{range1}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-stone-500 text-xs mt-3">{local.enchantPreviewFourthSlotNote}</p>
                            <p className="text-stone-500 text-xs mt-2">{local.enchantPreviewDisclaimer}</p>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-4 bg-red-950/20 rounded-xl border border-red-500/30">
                            <p className="text-red-200/90 text-sm">{local.craftedEquipmentOnly}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refill confirmation popup */}
            <EquipmentStatDetailModal
                isOpen={statDetailRow !== null}
                onClose={() => setStatDetailRow(null)}
                row={statDetailRow}
                itemRank={itemRank}
                itemRankLabel={RANK_OPTIONS.find((o) => o.value === itemRank)?.label ?? ''}
                needMinLevel={needMinLevel}
                equipmentCategory={equipmentCategory}
                applicable={preview?.applicable ?? []}
                effectNameBySeTblidx={effectNameBySeTblidx}
                itemWorthPercent={itemWorth}
                charId={char?.CharID}
            />

            {showRefillConfirm && (
                <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="mx-4 max-w-sm w-full rounded-xl border border-red-500/20 bg-stone-900 p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-2">{local.refillConfirmTitle}</h3>
                        <p className="text-stone-300 text-sm mb-4">
                            {formatString(local.refillConfirmMessage, ccbdLimit)} ({refillCost} {local.cashPoints})
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRefillConfirm(false)}
                                disabled={isRefilling}
                                className="flex-1 py-2 rounded-lg border border-white/20 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {local.cancel}
                            </button>
                            <button
                                onClick={handleRefillConfirm}
                                disabled={isRefilling}
                                className="flex-1 py-2 rounded-lg border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isRefilling ? local.loading : local.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
