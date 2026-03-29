import { querySupabaseTable } from "@/lib/supabase/server";
import { CASHSHOP_TABLE_ID, normalizeCashshopRow } from "@/lib/cashshop/catalog";
import { resolveIconFilenameCase } from "@/lib/utils/icon-resolver";

export type EnrichedCashshopItem = {
    tblidx: number;
    name_en: string;
    name_kr: null;
    iconUrl: string | null;
};

function iconUrlFromResolved(iconName: string): string | null {
    const trimmed = iconName.trim();
    if (!trimmed) return null;
    const withExt = trimmed.endsWith(".png") ? trimmed : `${trimmed}.png`;
    return `/icon/${withExt}`;
}

/**
 * Load Supabase catalog rows for the given tblidx values (same strategy as donation tiers).
 */
export async function enrichTblidxList(tblidxList: number[]): Promise<Map<number, EnrichedCashshopItem>> {
    const unique = Array.from(
        new Set(tblidxList.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0))
    );
    const map = new Map<number, EnrichedCashshopItem>();
    if (unique.length === 0) return map;

    const tblidxFilter = `in.(${unique.join(",")})`;
    let supabaseRows: Record<string, unknown>[] = [];
    supabaseRows = await querySupabaseTable<Record<string, unknown>>({
        table: "table_hls_item_data",
        params: {
            tblidx: tblidxFilter,
            table_id: `eq.${CASHSHOP_TABLE_ID}`,
            limit: "5000",
        },
    });

    if (supabaseRows.length === 0) {
        supabaseRows = await querySupabaseTable<Record<string, unknown>>({
            table: "table_hls_item_data",
            params: {
                tblidx: tblidxFilter,
                limit: "5000",
            },
        });
    }

    for (const row of supabaseRows) {
        const normalized = normalizeCashshopRow(row);
        if (!normalized) continue;
        const resolvedIcon = await resolveIconFilenameCase(normalized.szIcon_Name);
        map.set(Number(normalized.itemId), {
            tblidx: Number(normalized.itemId),
            name_en: normalized.wszName,
            name_kr: null,
            iconUrl: iconUrlFromResolved(resolvedIcon),
        });
    }

    return map;
}

export function formatRewardLine(
    row: { tblidx: number; amount: number; sortOrder?: number | null },
    itemByTblidx: Map<number, EnrichedCashshopItem>
) {
    const it = itemByTblidx.get(Number(row.tblidx));
    return {
        tblidx: Number(row.tblidx),
        amount: Number(row.amount),
        sortOrder: row.sortOrder ?? 0,
        item: it
            ? {
                  tblidx: it.tblidx,
                  name_en: it.name_en,
                  name_kr: it.name_kr,
                  iconUrl: it.iconUrl,
              }
            : {
                  tblidx: Number(row.tblidx),
                  name_en: `Item ${row.tblidx}`,
                  name_kr: null,
                  iconUrl: null,
              },
    };
}
