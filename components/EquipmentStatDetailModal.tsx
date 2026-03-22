'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRotate } from '@fortawesome/free-solid-svg-icons';
import { local, formatString } from '@/lib/utils/localize';
import type { ItemEnchantRow } from '@/lib/game/itemEnchantCsv';
import type { EquipmentCategoryId } from '@/lib/game/dboItemCategory';
import {
    buildStatDetailSimulation,
    getEnchantDisplayName,
    isEnchantRowEligibleForItemRank,
    optionValueMaxForRow,
    randomEnchantLineCountForItemRank,
    simulateEnchantGenOnCreate,
    worthBudgetForCraftedPreview,
} from '@/lib/game/itemEnchantBounds';

type EquipmentStatDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    row: ItemEnchantRow | null;
    itemRank: number;
    itemRankLabel: string;
    needMinLevel: number;
    equipmentCategory: EquipmentCategoryId;
    applicable: ItemEnchantRow[];
    effectNameBySeTblidx: Map<number, string>;
    itemWorthPercent?: number;
    charId?: number;
};

export default function EquipmentStatDetailModal({
    isOpen,
    onClose,
    row,
    itemRank,
    itemRankLabel,
    needMinLevel,
    equipmentCategory,
    applicable,
    effectNameBySeTblidx,
    itemWorthPercent = 0,
    charId = 0,
}: EquipmentStatDetailModalProps) {
    const [rerollNonce, setRerollNonce] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setRerollNonce(0);
        }
    }, [isOpen, row?.tblidx]);

    if (!isOpen || !row) {
        return null;
    }

    const label = getEnchantDisplayName(row, effectNameBySeTblidx);
    const baseSeed = ((charId >>> 0) * 1597334677 + row.tblidx * 3812015801) >>> 0;
    const runSeed = (baseSeed ^ (rerollNonce * 0x9e3779b1)) >>> 0;

    const lineCount = randomEnchantLineCountForItemRank(itemRank);
    const worthPool = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthPercent);
    const eligibleForRank = isEnchantRowEligibleForItemRank(row, itemRank);
    const canRollThis = eligibleForRank && optionValueMaxForRow(worthPool, row) >= 1;

    const genSeed = (runSeed ^ 0xe2b7a315) >>> 0;
    const fullGen =
        lineCount > 0 && applicable.length > 0
            ? simulateEnchantGenOnCreate(applicable, equipmentCategory, needMinLevel, worthPool, itemRank, genSeed)
            : { lines: [] as { slotIndex: number; row: ItemEnchantRow; value: number; maxForLine: number; isLastLine: boolean }[], incomplete: false };

    const detail = buildStatDetailSimulation(
        row,
        fullGen,
        applicable,
        equipmentCategory,
        needMinLevel,
        worthPool,
        itemRank,
        runSeed,
        rerollNonce
    );

    return (
        <div
            className="absolute inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-red-500/20 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-stone-800/80 text-stone-300 transition hover:bg-red-500/20 hover:scale-110"
                    aria-label="Close"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>

                <div className="border-b border-red-500/20 p-6 pr-14">
                    <h2 className="text-xl font-bold text-white">{label}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setRerollNonce((n) => n + 1)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-stone-800/70 px-3 py-2 text-xs font-medium text-stone-200 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-white"
                            aria-label={local.statModalRerollAria}
                        >
                            <FontAwesomeIcon icon={faRotate} className="text-red-400/90" />
                            {local.statModalReroll}
                        </button>
                        <span className="text-[11px] text-stone-600">{local.statModalRerollHint}</span>
                    </div>
                    {!eligibleForRank && (
                        <p className="mt-3 text-sm leading-relaxed text-amber-400/90">
                            {formatString(local.statModalNotOnRank, itemRankLabel)}
                        </p>
                    )}
                </div>

                <div className="space-y-6 p-6">
                    {lineCount > 0 && (
                        <section>
                            <h3 className="text-sm font-semibold text-stone-200">{local.statModalSampleItemTitle}</h3>
                            <p className="mt-1 text-xs text-stone-500">{formatString(local.statModalSampleItemCaption, lineCount, itemRankLabel)}</p>
                            {detail.creationLines.length > 0 ? (
                                <ul className="mt-3 space-y-2">
                                    {detail.creationLines.map((cl) => {
                                        const name = getEnchantDisplayName(cl.row, effectNameBySeTblidx);
                                        return (
                                            <li
                                                key={`${rerollNonce}-${cl.lineNumber}-${cl.row.tblidx}`}
                                                className={`rounded-lg border px-3 py-2.5 text-sm ${
                                                    cl.isSelectedStat
                                                        ? 'border-red-500/40 bg-red-500/10 text-stone-100'
                                                        : 'border-red-500/10 bg-stone-900/50 text-stone-300'
                                                }`}
                                            >
                                                {formatString(local.statModalLineGenRange, cl.lineNumber, name, cl.minRoll, cl.maxRoll)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : applicable.length === 0 ? (
                                <p className="mt-3 text-sm text-amber-400/90">{local.enchantNoRowsForEquipment}</p>
                            ) : (
                                <p className="mt-3 text-sm text-amber-400/90">{local.statModalIncompleteGen}</p>
                            )}
                            {fullGen.incomplete && detail.creationLines.length > 0 && (
                                <p className="mt-2 text-xs text-amber-400/90">{local.statModalIncompleteGen}</p>
                            )}
                        </section>
                    )}

                    {(detail.upgradeSteps.length > 0 || detail.afterUpgradeLines.length > 0) && (
                        <section className="rounded-xl border border-red-500/15 bg-stone-900/40 p-4">
                            {detail.upgradeSteps.length > 0 ? (
                                <>
                                    <h3 className="text-sm font-semibold text-stone-200">{local.statModalUpgradeGearTitle}</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-stone-400">{local.statModalUpgradeGearIntro}</p>
                                    {local.statModalUpgradeGearIntro2 ? (
                                        <p className="mt-2 text-xs leading-relaxed text-stone-400">{local.statModalUpgradeGearIntro2}</p>
                                    ) : null}
                                    <ul className="mt-4 space-y-4">
                                        {detail.upgradeSteps.map((step) => {
                                            const statName = getEnchantDisplayName(step.targetRow, effectNameBySeTblidx);
                                            return (
                                                <li key={`${rerollNonce}-${step.equipmentUpgradeLevel}`} className="rounded-lg border border-red-500/10 bg-stone-800/40 px-3 py-2.5">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="text-xs font-medium text-red-400/90">
                                                            {formatString(local.statModalGearUpgradeLevel, step.equipmentUpgradeLevel)}
                                                        </span>
                                                        {step.kind === 'new_stat' ? (
                                                            <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300/90">
                                                                {local.statModalUpgradeNewStatInline}
                                                            </span>
                                                        ) : null}
                                                        {step.maxForStep >= 1 ? (
                                                            <span className="text-[11px] text-stone-500">
                                                                {formatString(local.statModalUpgradeRollRange, step.maxForStep)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                                                        <span className="text-sm font-medium text-stone-200">{statName}</span>
                                                        <span className="text-lg font-semibold tabular-nums text-red-400">+{step.bump}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            ) : null}
                            {detail.afterUpgradeLines.length > 0 ? (
                                <div className={detail.upgradeSteps.length > 0 ? 'mt-6 border-t border-red-500/10 pt-4' : ''}>
                                    <h3
                                        className={
                                            detail.upgradeSteps.length > 0
                                                ? 'text-xs font-semibold uppercase tracking-wide text-stone-400'
                                                : 'text-sm font-semibold text-stone-200'
                                        }
                                    >
                                        {local.statModalAfterUpgradeTitle}
                                    </h3>
                                    <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{local.statModalAfterUpgradeCaption}</p>
                                    <ul className="mt-3 space-y-2">
                                        {detail.afterUpgradeLines.map((line) => {
                                            const isSel = line.row.tblidx === row.tblidx;
                                            const name = getEnchantDisplayName(line.row, effectNameBySeTblidx);
                                            return (
                                                <li
                                                    key={`${rerollNonce}-after-${line.lineNumber}-${line.row.tblidx}`}
                                                    className={`rounded-lg border px-3 py-2.5 text-sm ${
                                                        isSel
                                                            ? 'border-red-500/40 bg-red-500/10 text-stone-100'
                                                            : 'border-red-500/10 bg-stone-800/40 text-stone-200'
                                                    }`}
                                                >
                                                    <span className="font-medium text-stone-300">
                                                        {formatString(local.statModalLineN, line.lineNumber)}
                                                    </span>{' '}
                                                    <span className="text-stone-200">{name}</span>
                                                    <span className="ml-2 font-semibold tabular-nums text-red-400">+{line.value}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : null}
                            {detail.upgradeSteps.length > 0 ? (
                                <p className="mt-3 text-[11px] leading-relaxed text-stone-600">{local.statModalUpgradeFooter}</p>
                            ) : null}
                        </section>
                    )}

                    {eligibleForRank && !canRollThis && (
                        <p className="text-sm text-stone-400">{local.statModalCannotRoll}</p>
                    )}

                    <details className="rounded-lg border border-red-500/10 bg-stone-900/30 px-3 py-2">
                        <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-400">{local.statModalTechnicalDetails}</summary>
                        <dl className="mt-3 space-y-1.5 border-t border-red-500/10 pt-3 text-xs text-stone-500">
                            <div className="flex justify-between gap-4">
                                <dt>{local.statModalDetailLevel}</dt>
                                <dd className="text-stone-300 tabular-nums">{needMinLevel}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>{local.statModalDetailItemWorth}</dt>
                                <dd className="text-stone-300 tabular-nums">{itemWorthPercent}%</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>{local.statModalDetailWorthPool}</dt>
                                <dd className="text-stone-300 tabular-nums">{worthPool.toFixed(1)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt>{local.statModalDetailCost}</dt>
                                <dd className="text-stone-300 tabular-nums">{row.wEnchant_Value}</dd>
                            </div>
                        </dl>
                    </details>
                </div>
            </div>
        </div>
    );
}
