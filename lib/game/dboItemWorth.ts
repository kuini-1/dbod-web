/** Mirrors `eITEM_RANK` / `ITEM_RANK_*` in NtlItem.h */
export const ITEM_RANK_NOTHING = 0;
export const ITEM_RANK_NORMAL = 1;
export const ITEM_RANK_SUPERIOR = 2;
export const ITEM_RANK_EXCELLENT = 3;
export const ITEM_RANK_RARE = 4;
export const ITEM_RANK_LEGENDARY = 5;
export const ITEM_RANK_COUNT = 6;

/** Default matches static `g_sItemWorthConfig` in NtlItem.cpp before GameServer overrides. */
export type ItemWorthConfig = {
    fBaseMultiplier: number;
    /** Index = item rank (NOTHING … LEGENDARY). NOTHING should be 0. */
    afRankMultiplier: readonly number[];
};

export const DEFAULT_ITEM_WORTH_CONFIG: ItemWorthConfig = {
    fBaseMultiplier: 1,
    afRankMultiplier: [0, 1, 1, 1, 1, 1],
};

/**
 * `Dbo_GetItemWorth` from NtlItem.cpp — same formula as the game server.
 */
export function dboGetItemWorth(
    byItemRank: number,
    byItemLevel: number,
    byItemWorthPercent = 0,
    bApplyCraftedBonus = false,
    config: ItemWorthConfig = DEFAULT_ITEM_WORTH_CONFIG
): number {
    const fItemWorthLevel = byItemLevel + 100;

    if (byItemRank === ITEM_RANK_NOTHING) {
        return 0;
    }

    if (
        byItemRank !== ITEM_RANK_NORMAL &&
        byItemRank !== ITEM_RANK_SUPERIOR &&
        byItemRank !== ITEM_RANK_EXCELLENT &&
        byItemRank !== ITEM_RANK_RARE &&
        byItemRank !== ITEM_RANK_LEGENDARY
    ) {
        return 0;
    }

    const fBaseWorth = Math.pow(Math.pow(fItemWorthLevel * 100, 1.4), 2 / 3);

    let fRankMultiplier = 1;
    if (byItemRank >= 0 && byItemRank < config.afRankMultiplier.length) {
        fRankMultiplier = config.afRankMultiplier[byItemRank] ?? 1;
    }

    let fResult = fBaseWorth * config.fBaseMultiplier * fRankMultiplier;

    if (bApplyCraftedBonus && byItemWorthPercent > 0) {
        fResult *= 1 + byItemWorthPercent / 100;
    }

    return fResult;
}
