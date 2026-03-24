import { querySupabaseTable } from "@/lib/supabase/server";
import { resolveIconFilenameCase } from "@/lib/utils/icon-resolver";

const DEFAULT_CASHSHOP_TABLE_ID = "eadabc3e-ee6b-4dd2-97db-96fef80f96a3";
export const CASHSHOP_TABLE_ID =
    (process.env.CASHSHOP_TABLE_ID || DEFAULT_CASHSHOP_TABLE_ID).trim();
const CASHSHOP_TABLE_NAME = "table_hls_item_data";

type SupabaseCashshopRow = Record<string, unknown>;

export interface CashshopCatalogItem {
    itemId: number;
    wszName: string;
    szIcon_Name: string;
    byStackCount: number;
    wDisplayBitFlag: number;
    dwCash: number;
    byDiscount: number;
    finalCash: number;
}

function toInt(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.trunc(parsed));
}

function resolveItemId(row: SupabaseCashshopRow): number {
    const candidate = row.tblidx ?? row.HLSitemTblidx ?? row.itemTblidx ?? row.id;
    return toInt(candidate, 0);
}

export function normalizeCashshopRow(row: SupabaseCashshopRow): CashshopCatalogItem | null {
    const itemId = resolveItemId(row);
    const wszName = String(row.wszName ?? "").trim();
    const szIcon_Name = String(row.szIcon_Name ?? "").trim();

    if (!itemId || !wszName) return null;

    const byStackCount = Math.max(1, toInt(row.byStackCount, 1));
    const wDisplayBitFlag = toInt(row.wDisplayBitFlag, 0);
    const dwCash = toInt(row.dwCash, 0);
    const byDiscount = Math.min(100, toInt(row.byDiscount, 0));
    const finalCash = Math.max(0, Math.round(dwCash * (1 - (byDiscount / 100))));

    return {
        itemId,
        wszName,
        szIcon_Name,
        byStackCount,
        wDisplayBitFlag,
        dwCash,
        byDiscount,
        finalCash,
    };
}

export async function fetchCashshopCatalog(): Promise<CashshopCatalogItem[]> {
    let rows = await querySupabaseTable<SupabaseCashshopRow>({
        table: CASHSHOP_TABLE_NAME,
        params: {
            table_id: `eq.${CASHSHOP_TABLE_ID}`,
            dwPriority: "eq.555",
        },
    });

    // If configured table_id has no rows, fallback to all rows so shop can still load.
    // Set CASHSHOP_ALLOW_TABLE_ID_FALLBACK=false to disable this behavior.
    if (rows.length === 0 && process.env.CASHSHOP_ALLOW_TABLE_ID_FALLBACK !== "false") {
        const fallbackRows = await querySupabaseTable<SupabaseCashshopRow>({
            table: CASHSHOP_TABLE_NAME,
            params: {
                dwPriority: "eq.555",
                limit: "5000",
            },
        });

        if (fallbackRows.length > 0) {
            const tableIds = Array.from(
                new Set(
                    fallbackRows
                        .map((row) => String(row.table_id ?? "").trim())
                        .filter(Boolean)
                )
            ).slice(0, 10);

            console.warn(
                `[cashshop] No rows matched table_id=${CASHSHOP_TABLE_ID}. ` +
                `Using fallback rows (${fallbackRows.length}). Sample table_id values: ${tableIds.join(", ")}`
            );
            rows = fallbackRows;
        }
    }

    const normalized: CashshopCatalogItem[] = [];
    for (const row of rows) {
        const item = normalizeCashshopRow(row);
        if (!item) continue;
        item.szIcon_Name = await resolveIconFilenameCase(item.szIcon_Name);
        normalized.push(item);
    }

    return normalized.sort((a, b) => a.finalCash - b.finalCash);
}
