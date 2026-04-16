import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/utils';
import { event_levelup_events, event_levelup_rewards } from '@/lib/models/event_levelup';
import { querySupabaseTable } from '@/lib/supabase/server';
import { resolveIconFilenameCase } from '@/lib/utils/icon-resolver';

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
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const events = await event_levelup_events.findAll({
            order: [['id', 'DESC']],
            raw: true,
        });
        const rewards = await event_levelup_rewards.findAll({
            order: [['eventId', 'ASC'], ['requiredLevel', 'ASC']],
            raw: true,
        });

        const rewardsByEventId = new Map<number, any[]>();
        for (const row of rewards as any[]) {
            const eventId = Number(row.eventId);
            if (!rewardsByEventId.has(eventId)) rewardsByEventId.set(eventId, []);
            rewardsByEventId.get(eventId)!.push({
                id: Number(row.id),
                eventId,
                requiredLevel: Number(row.requiredLevel),
                itemId: Number(row.itemId),
                amount: Number(row.amount),
            });
        }

        const cashshopRows = await querySupabaseTable<CashshopAdminRow>({
            table: 'table_hls_item_data',
            params: {
                select: 'id,tblidx,wszName,szIcon_Name,dwPriority,dwCash,byStackCount,byDiscount,table_id',
                order: 'dwPriority.desc,tblidx.asc',
                limit: '5000',
            },
        });

        const cashshopItems = await Promise.all(
            cashshopRows.map(async (row) => {
                const iconName = await resolveIconFilenameCase(String(row.szIcon_Name ?? '').trim());
                return {
                    id: String(row.id ?? '').trim(),
                    tblidx: toInt(row.tblidx, 0),
                    wszName: String(row.wszName ?? '').trim(),
                    szIcon_Name: iconName,
                    dwPriority: toInt(row.dwPriority, 0),
                    dwCash: toInt(row.dwCash, 0),
                    byStackCount: Math.max(1, toInt(row.byStackCount, 1)),
                    byDiscount: toInt(row.byDiscount, 0),
                    table_id: String(row.table_id ?? '').trim(),
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

        const formattedEvents = (events as any[]).map((event) => {
            const eventId = Number(event.id);
            const rewardRows = (rewardsByEventId.get(eventId) || []).map((reward) => ({
                ...reward,
                item: itemsByTblidx.get(Number(reward.itemId)) || null,
            }));
            return {
                id: eventId,
                title: String(event.title ?? '').trim(),
                slug: String(event.slug ?? '').trim(),
                startDate: String(event.startDate ?? '').trim(),
                endDate: String(event.endDate ?? '').trim(),
                isActive: Boolean(event.isActive),
                rewards: rewardRows,
            };
        });

        return NextResponse.json({ success: true, events: formattedEvents, cashshopItems }, { status: 200 });
    } catch (error) {
        console.error('Admin level-up events list error:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch level-up events.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAdmin(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const title = String(body?.title ?? '').trim();
        const slug = String(body?.slug ?? '').trim() || null;
        const startDate = String(body?.startDate ?? '').trim();
        const endDate = String(body?.endDate ?? '').trim();
        const isActive = body?.isActive == null ? true : Boolean(body.isActive);

        if (!title || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: 'title, startDate and endDate are required.' },
                { status: 400 }
            );
        }

        const created = await event_levelup_events.create({
            title,
            slug,
            startDate,
            endDate,
            isActive,
        } as any);

        return NextResponse.json(
            {
                success: true,
                event: {
                    id: Number((created as any).id),
                    title,
                    slug,
                    startDate,
                    endDate,
                    isActive,
                    rewards: [],
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Admin level-up event create error:', error);
        return NextResponse.json({ success: false, message: 'Failed to create level-up event.' }, { status: 500 });
    }
}
