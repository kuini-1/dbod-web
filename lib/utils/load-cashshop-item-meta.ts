import { querySupabaseTable } from '../supabase/server';
import { CASHSHOP_TABLE_ID, normalizeCashshopRow } from '../cashshop/catalog';
import { resolveIconFilenameCase } from './icon-resolver';

export async function loadCashshopItemMetaByIds(
    itemIds: number[]
): Promise<Map<number, { name: string; iconUrl: string | null }>> {
    const map = new Map<number, { name: string; iconUrl: string | null }>();
    const uniqueItemIds = Array.from(new Set(itemIds.filter((id) => Number.isFinite(id) && id > 0)));
    if (uniqueItemIds.length === 0) return map;

    try {
        const tblidxFilter = `in.(${uniqueItemIds.join(',')})`;
        let supabaseRows = await querySupabaseTable<Record<string, unknown>>({
            table: 'table_hls_item_data',
            params: {
                tblidx: tblidxFilter,
                table_id: `eq.${CASHSHOP_TABLE_ID}`,
                limit: '5000',
            },
        });

        if (supabaseRows.length === 0) {
            supabaseRows = await querySupabaseTable<Record<string, unknown>>({
                table: 'table_hls_item_data',
                params: {
                    tblidx: tblidxFilter,
                    limit: '5000',
                },
            });
        }

        const normalizedItems = await Promise.all(
            supabaseRows.map(async (row) => {
                const normalized = normalizeCashshopRow(row);
                if (!normalized) return null;
                normalized.szIcon_Name = await resolveIconFilenameCase(normalized.szIcon_Name);
                return normalized;
            })
        );

        for (const item of normalizedItems) {
            if (!item) continue;
            const iconUrl = item.szIcon_Name
                ? `/icon/${item.szIcon_Name}${item.szIcon_Name.endsWith('.png') ? '' : '.png'}`
                : null;
            map.set(Number(item.itemId), {
                name: String(item.wszName || `Item ${item.itemId}`),
                iconUrl,
            });
        }
    } catch (e) {
        console.error('loadCashshopItemMetaByIds failed:', e);
    }

    return map;
}
