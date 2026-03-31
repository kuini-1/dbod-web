import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import { dbod_acc } from '@/lib/database/connection';
import {
    event_daily_login_events,
    event_daily_login_rewards,
    event_daily_login_claims,
} from '@/lib/models/event_daily_login';
import { addItemsToCashshop } from '@/lib/utils/cashshop';
import {
    getCalendarDayKey,
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

        const tz = getDailyLoginCalendarTimeZone();
        const now = new Date();
        const todayKey = getCalendarDayKey(now, tz);

        const event = await event_daily_login_events.findOne({
            where: {
                isActive: true,
                startDate: { [Op.lte]: todayKey },
                endDate: { [Op.gte]: todayKey },
            },
            order: [['id', 'DESC']],
        });

        if (!event) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'no_active_event' }, { status: 200 });
        }

        const startKey = parseDateOnlyKey(event.startDate);
        const endKey = parseDateOnlyKey(event.endDate);
        if (!startKey || !endKey) {
            return NextResponse.json({ success: false, message: 'Invalid event dates' }, { status: 500 });
        }

        const { status, eventDayIndex } = getEventWindowAndDayIndex(startKey, endKey, now, tz);
        if (status !== 'active' || eventDayIndex == null) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'event_not_active' }, { status: 200 });
        }

        const rewardRows = await event_daily_login_rewards.findAll({
            where: { eventId: event.id },
            order: [['stepIndex', 'ASC']],
        });
        if (rewardRows.length === 0) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'no_rewards_configured' }, { status: 200 });
        }

        const claims = await event_daily_login_claims.findAll({
            where: { eventId: event.id, AccountID: userId },
        });

        if (hasClaimOnCurrentCalendarDay(claims, now, tz)) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'already_claimed_today' }, { status: 200 });
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

        const nextStep = maxClaimed + 1;
        if (nextStep > rewardRows.length) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'all_steps_claimed' }, { status: 200 });
        }
        if (eventDayIndex < nextStep) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'not_available_yet' }, { status: 200 });
        }

        const rewardRow = rewardRows.find((r) => Number(r.stepIndex) === nextStep);
        if (!rewardRow) {
            return NextResponse.json({ success: false, message: 'Reward configuration not found' }, { status: 404 });
        }

        const claimDateOnly = getZonedDateOnlyString(now, tz);
        const finalAmount = Math.max(1, Number(rewardRow.amount));

        await dbod_acc.transaction(async (transaction) => {
            await event_daily_login_claims.create({
                eventId: event.id,
                AccountID: userId,
                rewardId: rewardRow.id,
                stepIndex: nextStep,
                claimDate: claimDateOnly,
                claimedAt: now,
            } as any, { transaction });

            await addItemsToCashshop(userId, [{
                tblidx: Number(rewardRow.itemId),
                amount: finalAmount,
            }], {
                senderName: 'Event Login Reward',
                price: 0,
                buyerAccountId: userId,
                transaction,
            });
        });

        return NextResponse.json({
            success: true,
            autoClaimed: true,
            claim: {
                eventId: Number(event.id),
                stepIndex: nextStep,
                itemId: Number(rewardRow.itemId),
                amount: finalAmount,
            },
        }, { status: 200 });
    } catch (error) {
        console.error('Error auto-claiming event daily reward:', error);
        return NextResponse.json({ success: false, message: 'Failed to auto check-in reward' }, { status: 500 });
    }
}

