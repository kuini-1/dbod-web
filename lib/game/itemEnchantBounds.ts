import type { ItemWorthConfig } from './dboItemWorth';
import {
    dboGetItemWorth,
    ITEM_RANK_EXCELLENT,
    ITEM_RANK_LEGENDARY,
    ITEM_RANK_RARE,
    ITEM_RANK_SUPERIOR,
} from './dboItemWorth';
import type { EquipmentCategoryId } from './dboItemCategory';
import { getItemCategoryFlagForEquipmentCategory } from './dboItemCategory';
import type { ItemEnchantRow } from './itemEnchantCsv';
import { formatSystemEffectLabel } from './statDisplay';

/**
 * Equipment upgrade milestones: every 3 levels (+3 … +15) the game runs a random-option gen/upgrade step.
 * These are **not** character Item Worth percentages — use {@link worthBudgetForCraftedPreview} with the
 * character’s actual Item_Worth (0–65535, unsigned SMALLINT) for the worth pool.
 */
export const EQUIPMENT_UPGRADE_MILESTONES = [3, 6, 9, 12, 15] as const;

/** Matches `NTL_MAX_SYSTEM_EFFECT_COUNT` in `NtlItem.h` — used in the upgrade `optionIndex` rule in `item.cpp`. */
const NTL_MAX_SYSTEM_EFFECT_COUNT = 4;

/** @deprecated Renamed {@link EQUIPMENT_UPGRADE_MILESTONES} (upgrade levels, not %). */
export const ITEM_WORTH_TIER_PERCENTS = EQUIPMENT_UPGRADE_MILESTONES;

/** @deprecated Misleading name; milestones are +3…+15 equipment upgrade, not Item Worth %. */
export const EXAMPLE_ITEM_WORTH_PERCENT = 15;

const INVALID_BYTE = 255;

/** Same bucket as `CItemEnchantTable::m_vecByRank[byItemRank]` (enchant row flags). */
export function isEnchantRowEligibleForItemRank(row: ItemEnchantRow, itemRank: number): boolean {
    switch (itemRank) {
        case ITEM_RANK_SUPERIOR:
            return row.bIsSuperior;
        case ITEM_RANK_EXCELLENT:
            return row.bIsExcellent;
        case ITEM_RANK_RARE:
            return row.bIsRare;
        case ITEM_RANK_LEGENDARY:
            return row.bIsLegendary;
        default:
            return false;
    }
}

/**
 * How many random enchant lines are generated on create (`for (i = 0; i < byRank - 1; i++)` in GameServer item.cpp).
 */
export function randomEnchantLineCountForItemRank(itemRank: number): number {
    if (itemRank < ITEM_RANK_SUPERIOR || itemRank > ITEM_RANK_LEGENDARY) {
        return 0;
    }
    return itemRank - 1;
}

/**
 * Enchant rows the server can roll for this slot, level, and rank (`m_vecByRank[byItemRank]` + equip/level checks).
 */
export function filterEnchantRowsForEquipment(
    allRows: ItemEnchantRow[],
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    itemRank: number
): ItemEnchantRow[] {
    const dwItemCategoryFlag = getItemCategoryFlagForEquipmentCategory(equipmentCategory);
    const byTblidx = new Map<number, ItemEnchantRow>();

    for (const row of allRows) {
        if (!isEnchantRowEligibleForItemRank(row, itemRank)) {
            continue;
        }
        if ((row.dwEquip & dwItemCategoryFlag) === 0) {
            continue;
        }
        if (needMinLevel < row.byMinLevel) {
            continue;
        }
        if (row.byMaxLevel !== INVALID_BYTE && needMinLevel > row.byMaxLevel) {
            continue;
        }
        if (!byTblidx.has(row.tblidx)) {
            byTblidx.set(row.tblidx, row);
        }
    }

    return [...byTblidx.values()].sort((a, b) => a.tblidx - b.tblidx);
}

/**
 * Mirrors `CItemEnchantTable::IsProperItemOption` for a new line (`optionValue == -1` → treated as 1).
 */
export function isProperEnchantOptionForGen(
    row: ItemEnchantRow,
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    fRemainingWorth: number,
    usedExclIndices: ReadonlySet<number>
): boolean {
    const dwItemCategoryFlag = getItemCategoryFlagForEquipmentCategory(equipmentCategory);
    if ((row.dwEquip & dwItemCategoryFlag) === 0) {
        return false;
    }
    if (needMinLevel < row.byMinLevel) {
        return false;
    }
    if (row.byMaxLevel !== INVALID_BYTE && needMinLevel > row.byMaxLevel) {
        return false;
    }
    const optionValue = 1;
    if (Math.floor(fRemainingWorth) < optionValue * row.wEnchant_Value) {
        return false;
    }
    if (usedExclIndices.has(row.byExclIdx)) {
        return false;
    }
    return optionValue <= row.tblidx;
}

/**
 * Player-facing stat label: always from `table_system_effect` (`seTblidx` → wszName), formatted.
 * Does not use the enchant CSV `name` column (often placeholders). If `seTblidx` is missing in data, shows a generic id.
 */
export function getEnchantDisplayName(row: ItemEnchantRow, effectNameBySeTblidx: Map<number, string>): string {
    if (row.seTblidx > 0) {
        const raw = effectNameBySeTblidx.get(row.seTblidx);
        if (raw) {
            return formatSystemEffectLabel(raw);
        }
        return `Effect #${row.seTblidx}`;
    }
    return `Enchant #${row.tblidx}`;
}

export function worthBudgetForCraftedPreview(
    itemRank: number,
    needMinLevel: number,
    itemWorthPercent: number,
    config?: ItemWorthConfig
): number {
    const apply = itemWorthPercent > 0;
    return dboGetItemWorth(itemRank, needMinLevel, itemWorthPercent, apply, config);
}

/** Match `(int)fRemainingWorth` / `(int)wEnchant_Value` from ProcessRandomOption (positive worth). */
function truncWorthLikeServer(f: number): number {
    return Math.trunc(f);
}

/**
 * Max option roll for one line: `int(remaining) / wEnchant_Value`, then cap with `wMaxValue` when &gt; 0
 * (table field exists on `sITEM_ENCHANT_TBLDAT`).
 */
export function optionValueMaxForRow(fRemainingWorth: number, row: ItemEnchantRow): number {
    const wi = truncWorthLikeServer(fRemainingWorth);
    if (row.wEnchant_Value <= 0) {
        return 0;
    }
    let m = Math.trunc(wi / row.wEnchant_Value);
    if (row.wMaxValue > 0) {
        m = Math.min(m, row.wMaxValue);
    }
    return m;
}

export type OptionBounds = { min: number; max: number };

export function boundsForWorth(fRemainingWorth: number, row: ItemEnchantRow): OptionBounds {
    const max = optionValueMaxForRow(fRemainingWorth, row);
    if (max < 1) {
        return { min: 0, max: 0 };
    }
    return { min: 1, max };
}

export function buildPreviewState(
    rows: ItemEnchantRow[],
    itemRank: number,
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    itemWorthBefore: number,
    itemWorthAfter: number,
    config?: ItemWorthConfig
): {
    applicable: ItemEnchantRow[];
    worthBefore: number;
    worthAfter: number;
    boundsBefore: Map<number, OptionBounds>;
    boundsAfter: Map<number, OptionBounds>;
} {
    const wBefore = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthBefore, config);
    const wAfter = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthAfter, config);

    const applicable = filterEnchantRowsForEquipment(rows, equipmentCategory, needMinLevel, itemRank);

    const boundsBefore = new Map<number, OptionBounds>();
    const boundsAfter = new Map<number, OptionBounds>();

    for (const row of applicable) {
        boundsBefore.set(row.tblidx, boundsForWorth(wBefore, row));
        boundsAfter.set(row.tblidx, boundsForWorth(wAfter, row));
    }

    return {
        applicable,
        worthBefore: wBefore,
        worthAfter: wAfter,
        boundsBefore,
        boundsAfter,
    };
}

export type TierColumnBounds = {
    /** Equipment upgrade level milestone (+3 … +15), not Item Worth %. */
    upgradeMilestone: number;
    worth: number;
    boundsByTblidx: Map<number, OptionBounds>;
};

/**
 * One column per equipment upgrade milestone. Worth pool is the same for each (character Item_Worth
 * drives `Dbo_GetItemWorth` — not the milestone numbers).
 */
export function buildItemWorthTierColumns(
    rows: ItemEnchantRow[],
    itemRank: number,
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    itemWorthPercent: number,
    config?: ItemWorthConfig,
    milestones: readonly number[] = EQUIPMENT_UPGRADE_MILESTONES
): { applicable: ItemEnchantRow[]; columns: TierColumnBounds[] } {
    const w = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthPercent, config);
    const applicable = filterEnchantRowsForEquipment(rows, equipmentCategory, needMinLevel, itemRank);
    const columns: TierColumnBounds[] = milestones.map((milestone) => {
        const boundsByTblidx = new Map<number, OptionBounds>();
        for (const row of applicable) {
            boundsByTblidx.set(row.tblidx, boundsForWorth(w, row));
        }
        return { upgradeMilestone: milestone, worth: w, boundsByTblidx };
    });
    return { applicable, columns };
}

/** mulberry32 PRNG — stable sample paths from a seed. */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a += 0x6d2b79f5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randomRangeInclusive(rng: () => number, min: number, max: number): number {
    if (max <= min) {
        return min;
    }
    return min + Math.floor(rng() * (max - min + 1));
}

function rebuildEnchantExclFromSlots(slots: readonly ({ row: ItemEnchantRow } | null)[]): Set<number> {
    const out = new Set<number>();
    for (const s of slots) {
        if (s) {
            out.add(s.row.byExclIdx);
        }
    }
    return out;
}

function tblidxSetFromSlots(slots: readonly ({ row: ItemEnchantRow } | null)[]): Set<number> {
    const out = new Set<number>();
    for (const s of slots) {
        if (s) {
            out.add(s.row.tblidx);
        }
    }
    return out;
}

export type SimulatedEnchantGenLine = {
    slotIndex: number;
    row: ItemEnchantRow;
    value: number;
    maxForLine: number;
    isLastLine: boolean;
};

/**
 * Simulates `GenRandomOption` for `byRank - 1` passes: frequency-weighted pick, `byExclIdx` exclusion,
 * last line uses max roll (`bLast`), others `RandomRange(1, max)` — matches GameServer `item.cpp` + `ItemEnchantTable.cpp`
 * (worth pool is not reduced between lines in this server build).
 */
export function simulateEnchantGenOnCreate(
    applicable: ItemEnchantRow[],
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    worthPool: number,
    itemRank: number,
    seed: number
): { lines: SimulatedEnchantGenLine[]; incomplete: boolean } {
    const lineCount = randomEnchantLineCountForItemRank(itemRank);
    const lines: SimulatedEnchantGenLine[] = [];
    if (lineCount === 0 || applicable.length === 0) {
        return { lines, incomplete: lineCount > 0 && applicable.length === 0 };
    }

    const rng = mulberry32(seed >>> 0);
    const usedExcl = new Set<number>();
    let incomplete = false;

    for (let slotIdx = 0; slotIdx < lineCount; slotIdx++) {
        const isLastLine = slotIdx === lineCount - 1;
        const candidates = applicable.filter((r) =>
            isProperEnchantOptionForGen(r, equipmentCategory, needMinLevel, worthPool, usedExcl)
        );
        if (candidates.length === 0) {
            incomplete = true;
            break;
        }

        let totalFreq = 0;
        for (const r of candidates) {
            totalFreq += r.byFrequency;
        }
        if (totalFreq <= 0) {
            incomplete = true;
            break;
        }

        let pick = 1 + Math.floor(rng() * totalFreq);
        let chosen: ItemEnchantRow | null = null;
        for (const r of candidates) {
            const f = r.byFrequency;
            if (f <= 0) {
                continue;
            }
            if (pick <= f) {
                chosen = r;
                break;
            }
            pick -= f;
        }
        if (!chosen) {
            chosen = candidates.filter((r) => r.byFrequency > 0).pop() ?? null;
        }
        if (!chosen) {
            incomplete = true;
            break;
        }

        const maxForLine = optionValueMaxForRow(worthPool, chosen);
        if (maxForLine < 1) {
            incomplete = true;
            break;
        }

        const value = isLastLine ? maxForLine : randomRangeInclusive(rng, 1, maxForLine);
        usedExcl.add(chosen.byExclIdx);
        lines.push({
            slotIndex: slotIdx + 1,
            row: chosen,
            value,
            maxForLine,
            isLastLine,
        });
    }

    return { lines, incomplete };
}

function dedupeEnchantRowsByTblidx(rows: ItemEnchantRow[]): ItemEnchantRow[] {
    const m = new Map<number, ItemEnchantRow>();
    for (const r of rows) {
        m.set(r.tblidx, r);
    }
    return [...m.values()];
}

function pickWeightedEnchantRow(candidates: ItemEnchantRow[], rng: () => number): ItemEnchantRow | null {
    let totalFreq = 0;
    for (const r of candidates) {
        totalFreq += r.byFrequency;
    }
    if (totalFreq <= 0 || candidates.length === 0) {
        return null;
    }
    let pick = 1 + Math.floor(rng() * totalFreq);
    for (const r of candidates) {
        const f = r.byFrequency;
        if (f <= 0) {
            continue;
        }
        if (pick <= f) {
            return r;
        }
        pick -= f;
    }
    return candidates.filter((r) => r.byFrequency > 0).pop() ?? null;
}

/** Pick a row for a “new line” at +12: not already on the item, still passes `IsProper` with current exclusivity. */
function pickNewEnchantRowForSlot(
    applicable: ItemEnchantRow[],
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    worthPool: number,
    tblidxOnItem: Set<number>,
    usedExclFromItem: Set<number>,
    rng: () => number
): ItemEnchantRow | null {
    const candidates = applicable.filter(
        (r) =>
            !tblidxOnItem.has(r.tblidx) && isProperEnchantOptionForGen(r, equipmentCategory, needMinLevel, worthPool, usedExclFromItem)
    );
    let picked = pickWeightedEnchantRow(candidates, rng);
    if (picked) {
        return picked;
    }
    // Never fall back to rows that fail IsProper (would duplicate exclusivity or break worth).
    return candidates.length > 0 ? candidates[Math.floor(rng() * candidates.length)]! : null;
}

/** Treat the opened stat as already “on” the item for new-line rolls (matches UI when line 1 is synthetic). */
function mergeSelectedStatIntoNewLineConstraints(
    tblidxOnItem: Set<number>,
    usedExclFromItem: Set<number>,
    selectedRow: ItemEnchantRow
): { tblidxOnItem: Set<number>; usedExclFromItem: Set<number> } {
    const tbl = new Set(tblidxOnItem);
    const excl = new Set(usedExclFromItem);
    tbl.add(selectedRow.tblidx);
    if (selectedRow.byExclIdx !== INVALID_BYTE) {
        excl.add(selectedRow.byExclIdx);
    }
    return { tblidxOnItem: tbl, usedExclFromItem: excl };
}

export type CreationLineDisplay = {
    lineNumber: number;
    row: ItemEnchantRow;
    minRoll: number;
    maxRoll: number;
    isSelectedStat: boolean;
};

export type UpgradeStepDisplay = {
    equipmentUpgradeLevel: number;
    kind: 'bump_existing' | 'new_stat';
    targetRow: ItemEnchantRow;
    bump: number;
    maxForStep: number;
};

/** One filled random-option slot after +3…+15 (`lineNumber` = 1-based server slot index). */
export type AfterUpgradeLineDisplay = {
    lineNumber: number;
    row: ItemEnchantRow;
    value: number;
};

/**
 * Legacy rank-based “new stat at +6/+9/+12” hint. The stat modal instead follows `item.cpp` / `UpgradeRandomOption`:
 * a new line appears when the milestone targets an **empty** random-option slot (see {@link buildStatDetailSimulation}).
 */
export function equipmentUpgradeLevelsThatGenNewStat(itemRank: number): Set<number> {
    switch (itemRank) {
        case ITEM_RANK_SUPERIOR:
            return new Set([6, 9, 12]);
        case ITEM_RANK_EXCELLENT:
            return new Set([9, 12]);
        case ITEM_RANK_RARE:
        case ITEM_RANK_LEGENDARY:
            return new Set([12]);
        default:
            return new Set();
    }
}

/**
 * Builds the stat-detail modal view: creation lines (1~max each) with **selected stat first** when possible,
 * then upgrade steps +3…+15 matching `CItem::ChangeOption` (brown-box path) in `item.cpp`: each milestone picks
 * `optionIndex` (empty slot `i` when allowed, else `RandomRangeU(0,i)` or `RandomRangeU(0,3)`), then runs
 * `UpgradeRandomOption` on that slot — **new** line if empty, otherwise **bump** `+= RandomRange(1, max)`.
 * Upgrade slots are seeded from the same **ordered** lines as the creation UI (selected stat first when shown),
 * not raw `fullGen` order, so bumps match what the player sees on creation.
 */
export function buildStatDetailSimulation(
    selectedRow: ItemEnchantRow,
    fullGen: { lines: SimulatedEnchantGenLine[]; incomplete: boolean },
    applicable: ItemEnchantRow[],
    equipmentCategory: EquipmentCategoryId,
    needMinLevel: number,
    worthPool: number,
    itemRank: number,
    seed: number,
    /** Extra mix from UI “reroll” so upgrade bumps / new-stat picks change even when creation order looks stable. */
    rerollMix = 0
): {
    creationLines: CreationLineDisplay[];
    upgradeSteps: UpgradeStepDisplay[];
    orderedGenLines: SimulatedEnchantGenLine[];
    /** Filled random-option slots after +15, in server slot order (creation lines + any new slot filled on sub-Legendary runs). */
    afterUpgradeLines: AfterUpgradeLineDisplay[];
} {
    const lc = randomEnchantLineCountForItemRank(itemRank);
    const mix = Math.imul(rerollMix >>> 0, 0x9e3779b1) ^ (rerollMix * 0x85ebca6b);
    const rngOrder = mulberry32((seed ^ 0x01abcd ^ mix) >>> 0);

    let ordered: SimulatedEnchantGenLine[] = [...fullGen.lines];
    const selIdx = ordered.findIndex((l) => l.row.tblidx === selectedRow.tblidx);
    if (selIdx >= 0) {
        const [at] = ordered.splice(selIdx, 1);
        ordered.unshift(at);
    } else if (isEnchantRowEligibleForItemRank(selectedRow, itemRank)) {
        const maxS = optionValueMaxForRow(worthPool, selectedRow);
        if (maxS >= 1) {
            const others = fullGen.lines.filter((l) => l.row.tblidx !== selectedRow.tblidx);
            const syn: SimulatedEnchantGenLine = {
                slotIndex: 1,
                row: selectedRow,
                value: randomRangeInclusive(rngOrder, 1, maxS),
                maxForLine: maxS,
                isLastLine: false,
            };
            ordered = [syn, ...others].slice(0, lc);
        }
    }
    ordered = ordered.slice(0, lc);

    const creationLines: CreationLineDisplay[] = ordered.map((l, i) => ({
        lineNumber: i + 1,
        row: l.row,
        minRoll: 1,
        maxRoll: optionValueMaxForRow(worthPool, l.row),
        isSelectedStat: l.row.tblidx === selectedRow.tblidx,
    }));

    const upgradeSteps: UpgradeStepDisplay[] = [];
    let afterUpgradeLines: AfterUpgradeLineDisplay[] = [];

    if (lc > 0 && ordered.length > 0) {
        const upgradeRng = mulberry32((seed ^ 0x5eedb0b1 ^ (mix << 1) ^ mix ^ 0x43504944) >>> 0);
        const slots: ({ row: ItemEnchantRow; value: number } | null)[] = Array(8).fill(null);
        for (let si = 0; si < ordered.length && si < 8; si++) {
            const ln = ordered[si]!;
            slots[si] = { row: ln.row, value: ln.value };
        }
        let usedExcl = rebuildEnchantExclFromSlots(slots);

        for (let i = 0; i < EQUIPMENT_UPGRADE_MILESTONES.length; i++) {
            const level = EQUIPMENT_UPGRADE_MILESTONES[i];
            const slotIEmpty = slots[i] === null;
            let optionIndex: number;
            if (slotIEmpty && i !== NTL_MAX_SYSTEM_EFFECT_COUNT) {
                optionIndex = i;
            } else {
                optionIndex = i < 3 ? randomRangeInclusive(upgradeRng, 0, i) : randomRangeInclusive(upgradeRng, 0, 3);
                usedExcl = rebuildEnchantExclFromSlots(slots);
            }

            const at = slots[optionIndex];
            if (at === null) {
                const { tblidxOnItem, usedExclFromItem: exclForPick } = mergeSelectedStatIntoNewLineConstraints(
                    tblidxSetFromSlots(slots),
                    usedExcl,
                    selectedRow
                );
                const newRow = pickNewEnchantRowForSlot(
                    applicable,
                    equipmentCategory,
                    needMinLevel,
                    worthPool,
                    tblidxOnItem,
                    exclForPick,
                    upgradeRng
                );
                if (newRow) {
                    const maxN = optionValueMaxForRow(worthPool, newRow);
                    const bumpN = maxN >= 1 ? randomRangeInclusive(upgradeRng, 1, maxN) : 0;
                    upgradeSteps.push({
                        equipmentUpgradeLevel: level,
                        kind: 'new_stat',
                        targetRow: newRow,
                        bump: bumpN,
                        maxForStep: maxN,
                    });
                    slots[optionIndex] = { row: newRow, value: bumpN };
                    if (newRow.byExclIdx !== INVALID_BYTE) {
                        usedExcl.add(newRow.byExclIdx);
                    }
                }
            } else {
                const maxForStep = optionValueMaxForRow(worthPool, at.row);
                if (maxForStep >= 1) {
                    const bump = randomRangeInclusive(upgradeRng, 1, maxForStep);
                    upgradeSteps.push({
                        equipmentUpgradeLevel: level,
                        kind: 'bump_existing',
                        targetRow: at.row,
                        bump,
                        maxForStep,
                    });
                    at.value += bump;
                }
            }
        }

        for (let idx = 0; idx < 8; idx++) {
            const s = slots[idx];
            if (s !== null) {
                afterUpgradeLines.push({ lineNumber: idx + 1, row: s.row, value: s.value });
            }
        }
    }

    return { creationLines, upgradeSteps, orderedGenLines: ordered, afterUpgradeLines };
}

export type GearUpgradeMilestoneSample = {
    equipmentUpgradeLevel: number;
    targetRow: ItemEnchantRow;
    bump: number;
    maxForTarget: number;
};

/** @deprecated Prefer {@link buildStatDetailSimulation} for the stat modal. */
export function simulateGearUpgradeMilestoneBumps(
    worthPool: number,
    statPool: ItemEnchantRow[],
    seed: number,
    milestones: readonly number[] = EQUIPMENT_UPGRADE_MILESTONES
): GearUpgradeMilestoneSample[] {
    const pool = dedupeEnchantRowsByTblidx(statPool);
    if (pool.length === 0) {
        return [];
    }
    const rng = mulberry32(seed >>> 0);
    return milestones.map((equipmentUpgradeLevel) => {
        const targetRow = pool[Math.floor(rng() * pool.length)]!;
        const maxForTarget = optionValueMaxForRow(worthPool, targetRow);
        const bump = maxForTarget >= 1 ? randomRangeInclusive(rng, 1, maxForTarget) : 0;
        return { equipmentUpgradeLevel, targetRow, bump, maxForTarget };
    });
}

/**
 * First-roll preview for **this** stat only (`GenRandomOption`-style `RandomRange(1, max)` when not last line).
 */
export function simulateChosenStatRollSamples(
    row: ItemEnchantRow,
    itemRank: number,
    needMinLevel: number,
    itemWorthPercent: number,
    seed: number,
    config?: ItemWorthConfig
): {
    eligibleForRank: boolean;
    firstRollBounds: OptionBounds;
    worthPool: number;
    sampleFirstRoll: number;
} {
    const eligibleForRank = isEnchantRowEligibleForItemRank(row, itemRank);
    const worthPool = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthPercent, config);
    const firstRollBounds = boundsForWorth(worthPool, row);

    const rng = mulberry32(seed >>> 0);
    let sampleFirstRoll = 0;
    if (eligibleForRank && firstRollBounds.max >= 1) {
        sampleFirstRoll = randomRangeInclusive(rng, firstRollBounds.min, firstRollBounds.max);
    }

    return {
        eligibleForRank,
        firstRollBounds,
        worthPool,
        sampleFirstRoll,
    };
}

/** One random roll per equipment upgrade milestone (same worth pool each time). */
export type TierSpreadSample = {
    /** Equipment upgrade level (+3 … +15) when this sample roll fires. */
    upgradeMilestone: number;
    worthPool: number;
    pickedRow: ItemEnchantRow;
    rolled: number;
    maxForPick: number;
};

export function simulateTierSpreadSample(
    applicable: ItemEnchantRow[],
    itemRank: number,
    needMinLevel: number,
    itemWorthPercent: number,
    seed: number,
    milestones: readonly number[] = EQUIPMENT_UPGRADE_MILESTONES,
    config?: ItemWorthConfig
): TierSpreadSample[] {
    if (applicable.length === 0) {
        return [];
    }
    const W = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthPercent, config);
    const rng = mulberry32(seed >>> 0);
    const out: TierSpreadSample[] = [];
    for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i]!;
        const picked = applicable[Math.floor(rng() * applicable.length)]!;
        const maxForPick = optionValueMaxForRow(W, picked);
        if (maxForPick < 1) {
            out.push({
                upgradeMilestone: milestone,
                worthPool: W,
                pickedRow: picked,
                rolled: 0,
                maxForPick: 0,
            });
            continue;
        }
        const rolled = randomRangeInclusive(rng, 1, maxForPick);
        out.push({
            upgradeMilestone: milestone,
            worthPool: W,
            pickedRow: picked,
            rolled,
            maxForPick,
        });
    }
    return out;
}

export function simulateMaxThisStatEachTier(
    row: ItemEnchantRow,
    itemRank: number,
    needMinLevel: number,
    itemWorthPercent: number,
    milestones: readonly number[] = EQUIPMENT_UPGRADE_MILESTONES,
    config?: ItemWorthConfig
): { tiers: { upgradeMilestone: number; worthPool: number; maxRoll: number }[]; firstSlotMax: number } {
    const W = worthBudgetForCraftedPreview(itemRank, needMinLevel, itemWorthPercent, config);
    const maxRoll = optionValueMaxForRow(W, row);
    const tiers = milestones.map((milestone) => ({
        upgradeMilestone: milestone,
        worthPool: W,
        maxRoll,
    }));
    return { tiers, firstSlotMax: maxRoll };
}

/**
 * One item, one worth pool, four `ProcessRandomOption`-style rolls: distinct lines, greedy lowest cost first,
 * each value = server int division max for remaining pool.
 */
export function simulateFourSlotsOnePoolGreedy(
    applicable: ItemEnchantRow[],
    worthPool: number
): { assignments: { row: ItemEnchantRow; value: number }[]; remainingWorth: number } {
    const sorted = [...applicable].sort((a, b) => a.wEnchant_Value - b.wEnchant_Value);
    let W = truncWorthLikeServer(worthPool);
    const assignments: { row: ItemEnchantRow; value: number }[] = [];
    const seenTblidx = new Set<number>();
    for (const row of sorted) {
        if (assignments.length >= 4) {
            break;
        }
        if (row.wEnchant_Value <= 0) {
            continue;
        }
        if (seenTblidx.has(row.tblidx)) {
            continue;
        }
        const v = optionValueMaxForRow(W, row);
        if (v <= 0) {
            continue;
        }
        assignments.push({ row, value: v });
        W -= v * row.wEnchant_Value;
        seenTblidx.add(row.tblidx);
    }
    return { assignments, remainingWorth: W };
}
