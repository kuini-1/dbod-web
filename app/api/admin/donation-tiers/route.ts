import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { donation_tiers } from "@/lib/models/donation_tiers";
import { donation_tier_items } from "@/lib/models/donation_tier_items";
import { querySupabaseTable } from "@/lib/supabase/server";
import { resolveIconFilenameCase } from "@/lib/utils/icon-resolver";

type CashshopAdminRow = {
    id?: string;
    tblidx?: number;
    wszName?: string;
    szIcon_Name?: string;
    dwPriority?: number;
    dwCash?: number;
    byStackCount?: number;
    byDiscount?: number;
    table_id?: string;
};

function toInt(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
}

async function requireAdmin(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user || Number(user.isGm) !== 10) return null;
    return user;
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireAdmin(request);
        if (!user) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const tiers = await donation_tiers.findAll({
            order: [["order", "ASC"], ["amount", "ASC"]],
            raw: true,
        });

        const tierIds = (tiers as any[]).map((tier) => Number(tier.id)).filter((id) => Number.isFinite(id));
        const tierItemRows = tierIds.length
            ? await donation_tier_items.findAll({
                where: { tierId: tierIds },
                order: [["tierId", "ASC"], ["sortOrder", "ASC"], ["id", "ASC"]],
                raw: true,
            })
            : [];

        const rewardItemsByTierId = new Map<number, any[]>();
        for (const row of tierItemRows as any[]) {
            const tierId = Number(row.tierId);
            if (!rewardItemsByTierId.has(tierId)) rewardItemsByTierId.set(tierId, []);
            rewardItemsByTierId.get(tierId)!.push({
                id: Number(row.id),
                tierId,
                tblidx: Number(row.tblidx),
                amount: Number(row.amount),
                sortOrder: Number(row.sortOrder ?? 0),
            });
        }

        const cashshopRows = await querySupabaseTable<CashshopAdminRow>({
            table: "table_hls_item_data",
            params: {
                select: "id,tblidx,wszName,szIcon_Name,dwPriority,dwCash,byStackCount,byDiscount,table_id",
                order: "dwPriority.desc,tblidx.asc",
                limit: "5000",
            },
        });

        const cashshopItems = await Promise.all(
            cashshopRows.map(async (row) => {
                const iconName = await resolveIconFilenameCase(String(row.szIcon_Name ?? "").trim());
                return {
                    id: String(row.id ?? "").trim(),
                    tblidx: toInt(row.tblidx, 0),
                    wszName: String(row.wszName ?? "").trim(),
                    szIcon_Name: iconName,
                    dwPriority: toInt(row.dwPriority, 0),
                    dwCash: toInt(row.dwCash, 0),
                    byStackCount: Math.max(1, toInt(row.byStackCount, 1)),
                    byDiscount: toInt(row.byDiscount, 0),
                    table_id: String(row.table_id ?? "").trim(),
                    active: toInt(row.dwPriority, 0) === 555,
                };
            })
        );

        const itemsByTblidx = new Map<number, (typeof cashshopItems)[number]>();
        for (const item of cashshopItems) {
            if (item.tblidx > 0 && !itemsByTblidx.has(item.tblidx)) {
                itemsByTblidx.set(item.tblidx, item);
            }
        }

        const formattedTiers = (tiers as any[]).map((tier) => {
            const tierId = Number(tier.id);
            const rewardItems = (rewardItemsByTierId.get(tierId) || []).map((rewardItem) => ({
                ...rewardItem,
                item: itemsByTblidx.get(Number(rewardItem.tblidx)) || null,
            }));
            return {
                id: tierId,
                amount: Number(tier.amount ?? 0),
                title: String(tier.title ?? "").trim(),
                icon: String(tier.icon ?? "award").trim() || "award",
                order: Number(tier.order ?? 0),
                rewardItems,
            };
        });

        return NextResponse.json(
            { success: true, tiers: formattedTiers, cashshopItems },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin donation tiers list error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch donation tiers." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAdmin(request);
        if (!user) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const title = String(body?.title ?? "").trim();
        const amount = Math.max(0, toInt(body?.amount, 0));
        const icon = String(body?.icon ?? "award").trim() || "award";
        const order = Math.max(0, toInt(body?.order, 0));

        if (!title) {
            return NextResponse.json(
                { success: false, message: "title is required." },
                { status: 400 }
            );
        }

        const created = await donation_tiers.create({
            title,
            amount,
            icon,
            order,
        } as any);

        return NextResponse.json(
            {
                success: true,
                tier: {
                    id: Number((created as any).id),
                    title,
                    amount,
                    icon,
                    order,
                    rewardItems: [],
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin donation tier create error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create donation tier." },
            { status: 500 }
        );
    }
}
