import { NextRequest, NextResponse } from 'next/server';
import { donation_tiers } from '../../../lib/models/donation_tiers';
import { donation_tier_items } from '../../../lib/models/donation_tier_items';
import { CASHSHOP_TABLE_ID, normalizeCashshopRow } from '../../../lib/cashshop/catalog';
import { querySupabaseTable } from '../../../lib/supabase/server';
import { resolveIconFilenameCase } from '../../../lib/utils/icon-resolver';

export async function GET(request: NextRequest) {
    try {
        const tiers = await donation_tiers.findAll({
            order: [['order', 'ASC'], ['amount', 'ASC']],
            raw: true // Use raw to get plain objects
        });

        const tierIds = (tiers || []).map((t: any) => t.id).filter(Boolean);
        const tierItemRows = tierIds.length ? await donation_tier_items.findAll({
            where: { tierId: tierIds },
            order: [['sortOrder', 'ASC'], ['id', 'ASC']],
            raw: true
        }) : [];

        const tblidxList = Array.from(
            new Set(
                (tierItemRows as any[])
                    .map((row) => Number(row.tblidx))
                    .filter((value) => Number.isFinite(value) && value > 0)
            )
        );

        let supabaseRows: Record<string, unknown>[] = [];
        if (tblidxList.length > 0) {
            const tblidxFilter = `in.(${tblidxList.join(',')})`;
            supabaseRows = await querySupabaseTable<Record<string, unknown>>({
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
        }

        const catalogItems = await Promise.all(
            supabaseRows.map(async (row) => {
                const normalized = normalizeCashshopRow(row);
                if (!normalized) return null;
                normalized.szIcon_Name = await resolveIconFilenameCase(normalized.szIcon_Name);
                return normalized;
            })
        );
        const itemByTblidx = new Map<number, any>();
        for (const it of catalogItems) {
            if (!it) continue;
            itemByTblidx.set(Number(it.itemId), it);
        }

        const rewardsByTierId = new Map<number, any[]>();
        for (const row of tierItemRows as any[]) {
            const tierId = Number(row.tierId);
            if (!rewardsByTierId.has(tierId)) rewardsByTierId.set(tierId, []);
            const it = itemByTblidx.get(Number(row.tblidx));
            rewardsByTierId.get(tierId)!.push({
                tblidx: Number(row.tblidx),
                amount: Number(row.amount),
                sortOrder: row.sortOrder ?? 0,
                item: it ? {
                    tblidx: Number(it.itemId),
                    name_en: it.wszName,
                    name_kr: null,
                    iconUrl: it.szIcon_Name ? `/icon/${it.szIcon_Name}${it.szIcon_Name.endsWith('.png') ? '' : '.png'}` : null
                } : {
                    tblidx: Number(row.tblidx),
                    name_en: `Item ${row.tblidx}`,
                    name_kr: null,
                    iconUrl: null
                }
            });
        }

        // Donation tiers now use items (rewardItems) only; rewards text field is deprecated.
        const formattedTiers = tiers.map((tier: any) => ({
            id: tier.id,
            amount: tier.amount,
            title: tier.title,
            rewardItems: rewardsByTierId.get(Number(tier.id)) || [],
            icon: tier.icon || 'award',
            order: tier.order || 0
        }));

        return NextResponse.json(
            { tiers: formattedTiers },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching donation tiers:', error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
