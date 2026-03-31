import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/utils';
import { dbod_acc } from '@/lib/database/connection';
import {
    event_daily_login_events,
    event_daily_login_rewards,
    event_daily_login_claims,
} from '@/lib/models/event_daily_login';
import { addItemsToCashshop } from '@/lib/utils/cashshop';
import {
    getDailyLoginCalendarTimeZone,
    getZonedDateOnlyString,
    hasClaimOnCurrentCalendarDay,
} from '@/lib/utils/daily-login-calendar';
import { getEventWindowAndDayIndex, parseDateOnlyKey } from '@/lib/utils/event-daily-login';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const stepToClaim = Number(body?.stepIndex);
        const eventIdBody = body?.eventId != null ? Number(body.eventId) : NaN;
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';

        if (!Number.isFinite(stepToClaim) || stepToClaim < 1) {
            return NextResponse.json({ success: false, message: 'stepIndex is required' }, { status: 400 });
        }

        const hasEventId = Number.isFinite(eventIdBody) && eventIdBody >= 1;
        if (!hasEventId && !slug) {
            return NextResponse.json(
                { success: false, message: 'eventId or slug is required' },
                { status: 400 }
            );
        }

        const event = hasEventId
            ? await event_daily_login_events.findOne({ where: { id: eventIdBody, isActive: true } })
            : await event_daily_login_events.findOne({ where: { slug, isActive: true } });

        if (!event) {
            return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
        }

        const tz = getDailyLoginCalendarTimeZone();
        const now = new Date();
        const startKey = parseDateOnlyKey(event.startDate);
        const endKey = parseDateOnlyKey(event.endDate);
        if (!startKey || !endKey) {
            return NextResponse.json({ success: false, message: 'Invalid event dates' }, { status: 500 });
        }

        const { status, eventDayIndex } = getEventWindowAndDayIndex(startKey, endKey, now, tz);
        if (status !== 'active') {
            return NextResponse.json(
                { success: false, message: status === 'upcoming' ? 'Event has not started' : 'Event has ended' },
                { status: 400 }
            );
        }

        if (eventDayIndex === null || eventDayIndex < stepToClaim) {
            return NextResponse.json(
                { success: false, message: 'This reward step is not available yet' },
                { status: 400 }
            );
        }

        const rewardRow = await event_daily_login_rewards.findOne({
            where: { eventId: event.id, stepIndex: stepToClaim },
        });
        if (!rewardRow) {
            return NextResponse.json({ success: false, message: 'Reward configuration not found' }, { status: 404 });
        }

        const claims = await event_daily_login_claims.findAll({
            where: { eventId: event.id, AccountID: userId },
        });

        if (hasClaimOnCurrentCalendarDay(claims, now, tz)) {
            return NextResponse.json(
                { success: false, message: 'You can only claim one event reward per day' },
                { status: 400 }
            );
        }

        const claimedSteps = new Set<number>();
        let maxClaimed = 0;
        for (const c of claims) {
            const s = Number(c.stepIndex);
            if (Number.isFinite(s) && s > 0) {
                claimedSteps.add(s);
                maxClaimed = Math.max(maxClaimed, s);
            }
        }

        if (claimedSteps.has(stepToClaim)) {
            return NextResponse.json({ success: false, message: 'Reward already claimed' }, { status: 400 });
        }

        if (stepToClaim !== maxClaimed + 1) {
            return NextResponse.json(
                { success: false, message: 'You must claim all previous rewards first' },
                { status: 400 }
            );
        }

        const existingStep = await event_daily_login_claims.findOne({
            where: {
                eventId: event.id,
                AccountID: userId,
                stepIndex: stepToClaim,
            },
        });
        if (existingStep) {
            return NextResponse.json({ success: false, message: 'Reward already claimed' }, { status: 400 });
        }

        const claimDateOnly = getZonedDateOnlyString(now, tz);
        const finalAmount = Math.max(1, Number(rewardRow.amount));

        await dbod_acc.transaction(async (transaction) => {
            await event_daily_login_claims.create(
                {
                    eventId: event.id,
                    AccountID: userId,
                    rewardId: rewardRow.id,
                    stepIndex: stepToClaim,
                    claimDate: claimDateOnly,
                    claimedAt: now,
                } as any,
                { transaction }
            );

            await addItemsToCashshop(
                userId,
                [{ tblidx: Number(rewardRow.itemId), amount: finalAmount }],
                {
                    senderName: 'Event Login Reward',
                    price: 0,
                    buyerAccountId: userId,
                    transaction,
                }
            );
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Reward claimed successfully',
                stepIndex: stepToClaim,
                amount: finalAmount,
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('Error claiming event daily reward:', e);
        return NextResponse.json({ success: false, message: 'Failed to claim reward' }, { status: 500 });
    }
}
