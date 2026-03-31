import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import {
    event_daily_login_events,
    event_daily_login_rewards,
    event_daily_login_claims,
} from '@/lib/models/event_daily_login';
import { getCalendarDayKey, getDailyLoginCalendarTimeZone, hasClaimOnCurrentCalendarDay } from '@/lib/utils/daily-login-calendar';
import { getEventWindowAndDayIndex, parseDateOnlyKey } from '@/lib/utils/event-daily-login';
import { loadCashshopItemMetaByIds } from '@/lib/utils/load-cashshop-item-meta';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const tz = getDailyLoginCalendarTimeZone();
        const searchParams = request.nextUrl.searchParams;
        const eventIdRaw = searchParams.get('eventId');
        const slug = searchParams.get('slug')?.trim();

        let event: Awaited<ReturnType<typeof event_daily_login_events.findOne>> = null;

        if (eventIdRaw) {
            const id = Number(eventIdRaw);
            if (!Number.isFinite(id) || id < 1) {
                return NextResponse.json({ success: false, message: 'Invalid eventId' }, { status: 400 });
            }
            event = await event_daily_login_events.findOne({
                where: { id, isActive: true },
            });
            if (!event) {
                return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
            }
        } else if (slug) {
            event = await event_daily_login_events.findOne({
                where: { slug, isActive: true },
            });
            if (!event) {
                return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
            }
        } else {
            const todayKey = getCalendarDayKey(new Date(), tz);
            event = await event_daily_login_events.findOne({
                where: {
                    isActive: true,
                    startDate: { [Op.lte]: todayKey },
                    endDate: { [Op.gte]: todayKey },
                },
                order: [['id', 'DESC']],
            });
            if (!event) {
                return NextResponse.json({ success: true, hasActiveEvent: false }, { status: 200 });
            }
        }

        const ev = event as unknown as {
            id: number;
            title: string | null;
            slug: string | null;
            startDate: unknown;
            endDate: unknown;
        };

        const now = new Date();
        const startKey = parseDateOnlyKey(ev.startDate);
        const endKey = parseDateOnlyKey(ev.endDate);
        if (!startKey || !endKey) {
            return NextResponse.json({ success: false, message: 'Invalid event dates' }, { status: 500 });
        }

        const { status, todayKey, eventDayIndex } = getEventWindowAndDayIndex(startKey, endKey, now, tz);

        const rewardRows = await event_daily_login_rewards.findAll({
            where: { eventId: ev.id },
            order: [['stepIndex', 'ASC']],
        });

        const claims = await event_daily_login_claims.findAll({
            where: { eventId: ev.id, AccountID: userId },
        });

        const claimedSteps = new Set<number>();
        let maxClaimed = 0;
        for (const c of claims) {
            const s = Number(c.stepIndex);
            if (Number.isFinite(s) && s > 0) {
                claimedSteps.add(s);
                maxClaimed = Math.max(maxClaimed, s);
            }
        }

        const hasClaimToday = hasClaimOnCurrentCalendarDay(claims, now, tz);
        const nextStep = maxClaimed + 1;

        const itemIds = rewardRows.map((r) => Number(r.itemId));
        const itemMetaById = await loadCashshopItemMetaByIds(itemIds);

        const data = rewardRows.map((row) => {
            const k = Number(row.stepIndex);
            const claimed = claimedSteps.has(k);
            const reward = {
                stepIndex: k,
                itemId: Number(row.itemId),
                amount: Number(row.amount),
                name: itemMetaById.get(Number(row.itemId))?.name ?? `Item ${row.itemId}`,
                iconUrl: itemMetaById.get(Number(row.itemId))?.iconUrl ?? '/event icons/i_hls_aoto_lp_s.png',
                claimed,
                available:
                    status === 'active' &&
                    !claimed &&
                    !hasClaimToday &&
                    eventDayIndex !== null &&
                    eventDayIndex >= k &&
                    k === nextStep,
            };
            return reward;
        });

        return NextResponse.json(
            {
                success: true,
                hasActiveEvent: true,
                calendarDayKey: getCalendarDayKey(now, tz),
                status,
                todayKey,
                eventDayIndex,
                event: {
                    id: ev.id,
                    title: ev.title,
                    slug: ev.slug,
                    startDate: startKey,
                    endDate: endKey,
                },
                data,
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('Error fetching event daily rewards:', e);
        return NextResponse.json({ success: false, message: 'Failed to fetch event daily rewards' }, { status: 500 });
    }
}
