import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import { daily_rewards, daily_reward_claims, daily_checkin_passes } from '@/lib/models/daily_rewards';
import { addItemsToCashshop } from '@/lib/utils/cashshop';
import { dbod_acc } from '@/lib/database/connection';
import {
    getDailyLoginCalendarTimeZone,
    getZonedCalendarParts,
    getZonedDateOnlyString,
    getZonedMonthUtcRange,
    hasClaimOnCurrentCalendarDay,
} from '@/lib/utils/daily-login-calendar';

function isSchemaError(error: unknown): boolean {
    const message = String((error as any)?.message || '').toLowerCase();
    return message.includes('unknown column') || message.includes('doesn\'t exist') || message.includes('unknown table');
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const tz = getDailyLoginCalendarTimeZone();
        const now = new Date();
        const { year: currentYear, month: calMonth, day: currentDayOfMonth } = getZonedCalendarParts(now, tz);
        const { start: monthStart, end: monthEnd } = getZonedMonthUtcRange(currentYear, calMonth, tz);
        const claimDateOnly = getZonedDateOnlyString(now, tz);

        let rewardRows: any[] = [];
        try {
            rewardRows = await daily_rewards.findAll({
                where: { dayNumber: { [Op.between]: [1, 25] } },
                order: [['dayNumber', 'ASC']]
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            rewardRows = await daily_rewards.findAll({
                attributes: ['id', 'date', 'itemId', 'amount'],
                where: { date: { [Op.between]: [1, 25] } },
                order: [['date', 'ASC']]
            });
        }

        const normalizedRewards = rewardRows.map((row) => ({
            id: Number(row.id),
            dayNumber: Number(row.dayNumber ?? 0) > 0 ? Number(row.dayNumber) : Number(row.date ?? 0),
            itemId: Number(row.itemId),
            amount: Number(row.amount),
        })).filter((row) => Number.isFinite(row.dayNumber) && row.dayNumber >= 1 && row.dayNumber <= 25);

        const rewardByDay = new Map<number, { id: number; dayNumber: number; itemId: number; amount: number }>();
        for (const reward of normalizedRewards) {
            if (!rewardByDay.has(reward.dayNumber)) rewardByDay.set(reward.dayNumber, reward);
        }
        const repeatReward = rewardByDay.get(25) || rewardByDay.get(24) || normalizedRewards[normalizedRewards.length - 1] || null;

        let monthClaims: any[] = [];
        try {
            monthClaims = await daily_reward_claims.findAll({
                where: {
                    AccountID: userId,
                    [Op.or]: [
                        { claimYear: currentYear, claimMonth: calMonth },
                        { claimedAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd } }
                    ]
                }
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            monthClaims = await daily_reward_claims.findAll({
                attributes: ['id', 'AccountID', 'rewardId', 'claimedAt'],
                where: {
                    AccountID: userId,
                    claimedAt: { [Op.gte]: monthStart, [Op.lt]: monthEnd }
                }
            });
        }

        const claimDaySet = new Set<number>();
        for (const claim of monthClaims) {
            const explicitDay = Number(claim.claimDayNumber ?? 0);
            if (explicitDay > 0) {
                claimDaySet.add(explicitDay);
                continue;
            }
            const matchedReward = normalizedRewards.find((row) => row.id === Number(claim.rewardId));
            if (matchedReward?.dayNumber) claimDaySet.add(matchedReward.dayNumber);
        }

        const hasClaimedToday = hasClaimOnCurrentCalendarDay(monthClaims, now, tz);
        if (hasClaimedToday) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'already_claimed_today' }, { status: 200 });
        }

        let maxSequentialBaseDay = 0;
        while (maxSequentialBaseDay < 24 && claimDaySet.has(maxSequentialBaseDay + 1)) {
            maxSequentialBaseDay += 1;
        }

        let targetDay = 0;
        if (maxSequentialBaseDay < 24) {
            const nextBaseDay = maxSequentialBaseDay + 1;
            if (nextBaseDay <= currentDayOfMonth) targetDay = nextBaseDay;
        } else {
            const claimedRepeatDays = Array.from(claimDaySet.values()).filter((day) => day >= 25).sort((a, b) => a - b);
            const nextRepeatDay = claimedRepeatDays.length > 0 ? claimedRepeatDays[claimedRepeatDays.length - 1] + 1 : 25;
            if (nextRepeatDay <= currentDayOfMonth) targetDay = nextRepeatDay;
        }

        if (!targetDay) {
            return NextResponse.json({ success: true, autoClaimed: false, reason: 'not_available_yet' }, { status: 200 });
        }

        const reward = targetDay <= 24 ? rewardByDay.get(targetDay) : repeatReward;
        if (!reward) {
            return NextResponse.json({ success: false, message: 'Reward configuration not found' }, { status: 404 });
        }

        let passRecord: any = null;
        try {
            passRecord = await daily_checkin_passes.findOne({
                where: {
                    AccountID: userId,
                    activeUntil: { [Op.gte]: now }
                },
                order: [['id', 'DESC']]
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
        }
        const isPassActive = !!passRecord && new Date(passRecord.activeUntil).getTime() >= now.getTime();
        const finalAmount = Math.max(1, Number(reward.amount)) * (isPassActive ? 2 : 1);

        await dbod_acc.transaction(async (transaction) => {
            try {
                await daily_reward_claims.create({
                    AccountID: userId,
                    rewardId: reward.id,
                    claimDayNumber: targetDay,
                    claimYear: currentYear,
                    claimMonth: calMonth,
                    claimDate: claimDateOnly as unknown as Date,
                    claimedAt: now
                }, { transaction });
            } catch (error) {
                if (!isSchemaError(error)) throw error;
                await daily_reward_claims.create({
                    AccountID: userId,
                    rewardId: reward.id,
                    claimedAt: now
                } as any, { transaction });
            }

            await addItemsToCashshop(userId, [{
                tblidx: Number(reward.itemId),
                amount: finalAmount
            }], {
                senderName: 'Daily Login Reward',
                price: 0,
                buyerAccountId: userId,
                transaction
            });
        });

        return NextResponse.json({
            success: true,
            autoClaimed: true,
            claim: {
                day: targetDay,
                itemId: Number(reward.itemId),
                amount: finalAmount,
                passApplied: isPassActive
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error auto-claiming daily reward:', error);
        return NextResponse.json({ success: false, message: 'Failed to auto check-in reward' }, { status: 500 });
    }
}

