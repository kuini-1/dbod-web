import { CASHSHOP_TABLE_ID, normalizeCashshopRow } from "@/lib/cashshop/catalog";
import { querySupabaseTable } from "@/lib/supabase/server";
import { iconPublicPathFromFilename } from "@/lib/utils/icon-public-path";
import { resolveIconFilenameCase } from "@/lib/utils/icon-resolver";

export type SlotRowInput = { id: number; tblidx: number; amount: number; feq: number };

export type SlotRowEnriched = SlotRowInput & {
    name: string;
    szIcon_Name: string;
    iconUrl: string | null;
};

export async function enrichSlotRowsWithSupabase(rows: SlotRowInput[]): Promise<SlotRowEnriched[]> {
    const tblidxList = Array.from(
        new Set(rows.map((r) => Number(r.tblidx)).filter((v) => Number.isFinite(v) && v > 0))
    );

    let supabaseRows: Record<string, unknown>[] = [];
    if (tblidxList.length > 0) {
        const tblidxFilter = `in.(${tblidxList.join(",")})`;
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
    }

    const catalogItems = await Promise.all(
        supabaseRows.map(async (row) => {
            const normalized = normalizeCashshopRow(row);
            if (!normalized) return null;
            normalized.szIcon_Name = await resolveIconFilenameCase(normalized.szIcon_Name);
            return normalized;
        })
    );

    const itemByTblidx = new Map<number, { wszName: string; szIcon_Name: string }>();
    for (const it of catalogItems) {
        if (!it) continue;
        itemByTblidx.set(Number(it.itemId), {
            wszName: it.wszName,
            szIcon_Name: it.szIcon_Name,
        });
    }

    return rows.map((row) => {
        const meta = itemByTblidx.get(Number(row.tblidx));
        const name = meta?.wszName?.trim() || `Item ${row.tblidx}`;
        const szIcon_Name = (meta?.szIcon_Name || "").trim();
        return {
            ...row,
            name,
            szIcon_Name,
            iconUrl: iconPublicPathFromFilename(szIcon_Name),
        };
    });
}
