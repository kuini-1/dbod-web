import { NextRequest, NextResponse } from 'next/server';
import { dbod_acc } from '@/lib/database/connection';
import { getUserFromRequest } from '@/lib/auth/utils';
import { characters } from '@/lib/models/characters';
import {
    event_levelup_events,
    event_levelup_rewards,
    event_levelup_claims,
} from '@/lib/models/event_levelup';
import { addItemsToCashshop } from '@/lib/utils/cashshop';
import { getDailyLoginCalendarTimeZone } from '@/lib/utils/daily-login-calendar';
import { getEventWindowAndDayIndex, parseDateOnlyKey } from '@/lib/utils/event-daily-login';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const requiredLevel = Number(body?.requiredLevel);
        const characterId = Number(body?.characterId);
        const eventIdBody = body?.eventId != null ? Number(body.eventId) : NaN;
        const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';

        if (!Number.isFinite(requiredLevel) || requiredLevel < 1) {
            return NextResponse.json({ success: false, message: 'requiredLevel is required' }, { status: 400 });
        }
        if (!Number.isFinite(characterId) || characterId < 1) {
            return NextResponse.json({ success: false, message: 'characterId is required' }, { status: 400 });
        }

        const hasEventId = Number.isFinite(eventIdBody) && eventIdBody >= 1;
        if (!hasEventId && !slug) {
            return NextResponse.json({ success: false, message: 'eventId or slug is required' }, { status: 400 });
        }

        const event = hasEventId
            ? await event_levelup_events.findOne({ where: { id: eventIdBody, isActive: true } })
            : await event_levelup_events.findOne({ where: { slug, isActive: true } });

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
        const { status } = getEventWindowAndDayIndex(startKey, endKey, now, tz);
        if (status !== 'active') {
            return NextResponse.json(
                { success: false, message: status === 'upcoming' ? 'Event has not started' : 'Event has ended' },
                { status: 400 }
            );
        }

        const selectedCharacter = await characters.findOne({
            where: {
                CharID: characterId,
                AccountID: userId,
            },
            attributes: ['CharID', 'CharName', 'Level'],
        });
        if (!selectedCharacter) {
            return NextResponse.json({ success: false, message: 'Selected character not found' }, { status: 404 });
        }

        const characterLevel = Number(selectedCharacter.Level ?? 1);
        if (characterLevel < requiredLevel) {
            return NextResponse.json({ success: false, message: 'Character level is too low for this reward' }, { status: 400 });
        }

        const rewardRow = await event_levelup_rewards.findOne({
            where: { eventId: event.id, requiredLevel },
        });
        if (!rewardRow) {
            return NextResponse.json({ success: false, message: 'Reward configuration not found' }, { status: 404 });
        }
        if (Number(rewardRow.itemId) <= 0) {
            return NextResponse.json({ success: false, message: 'Reward item is not configured yet' }, { status: 400 });
        }

        const existingClaim = await event_levelup_claims.findOne({
            where: {
                eventId: event.id,
                AccountID: userId,
                characterId,
                requiredLevel,
            },
        });
        if (existingClaim) {
            return NextResponse.json({ success: false, message: 'Reward already claimed' }, { status: 400 });
        }

        const finalAmount = Math.max(1, Number(rewardRow.amount));

        await dbod_acc.transaction(async (transaction) => {
            await event_levelup_claims.create(
                {
                    eventId: event.id,
                    AccountID: userId,
                    characterId,
                    rewardId: rewardRow.id,
                    requiredLevel,
                    claimedAt: now,
                } as any,
                { transaction }
            );

            await addItemsToCashshop(
                userId,
                [{ tblidx: Number(rewardRow.itemId), amount: finalAmount }],
                {
                    senderName: 'Level-Up Event Reward',
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
                characterId,
                requiredLevel,
                amount: finalAmount,
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('Error claiming level-up event reward:', e);
        return NextResponse.json({ success: false, message: 'Failed to claim reward' }, { status: 500 });
    }
}
