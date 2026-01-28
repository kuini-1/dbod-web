import { NextRequest, NextResponse } from 'next/server';
import { donation_tiers } from '../../../lib/models/donation_tiers';
import items from '../../../lib/models/items';
import { donation_tier_items } from '../../../lib/models/donation_tier_items';

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

        const tblidxs = Array.from(new Set((tierItemRows as any[]).map(r => r.tblidx).filter((x) => x !== undefined && x !== null)));
        const itemRows = tblidxs.length ? await items.findAll({
            where: { tblidx: tblidxs },
            raw: true
        }) : [];

        const itemByTblidx = new Map<number, any>();
        for (const it of itemRows as any[]) itemByTblidx.set(Number(it.tblidx), it);

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
                    tblidx: Number(it.tblidx),
                    name_en: it.name_en,
                    name_kr: it.name_kr ?? null,
                    iconUrl: it.iconFile ? `/event icons/${it.iconFile}` : null
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
