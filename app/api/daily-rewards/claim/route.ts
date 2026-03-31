import { NextRequest, NextResponse } from 'next/server';
import { daily_rewards, daily_reward_claims, daily_checkin_passes } from '../../../../lib/models/daily_rewards';
import { Op } from 'sequelize';
import { getUserFromRequest } from '../../../../lib/auth/utils';
import { addItemsToCashshop } from '../../../../lib/utils/cashshop';
import { dbod_acc } from '../../../../lib/database/connection';
import {
    daysInZonedMonth,
    getDailyLoginCalendarTimeZone,
    getZonedCalendarParts,
    getZonedDateOnlyString,
    getZonedMonthUtcRange,
    hasClaimOnCurrentCalendarDay,
} from '../../../../lib/utils/daily-login-calendar';

function isSchemaError(error: unknown): boolean {
    const message = String((error as any)?.message || '').toLowerCase();
    return message.includes('unknown column') || message.includes('doesn\'t exist') || message.includes('unknown table');
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: 'User not authenticated'
            }, { status: 401 });
        }

        const tz = getDailyLoginCalendarTimeZone();
        const now = new Date();
        const { year: currentYear, month: calMonth, day: currentDayOfMonth } = getZonedCalendarParts(now, tz);
        const { start: monthStart, end: monthEnd } = getZonedMonthUtcRange(currentYear, calMonth, tz);
        const claimDateOnly = getZonedDateOnlyString(now, tz);

        const { date } = await request.json();
        
        // Validate required fields
        if (!date) {
            return NextResponse.json({
                success: false,
                message: 'Date is required'
            }, { status: 400 });
        }

        const dayToClaim = Number(date);
        const monthDays = daysInZonedMonth(currentYear, calMonth);
        if (!Number.isFinite(dayToClaim) || dayToClaim < 1 || dayToClaim > monthDays) {
            return NextResponse.json({
                success: false,
                message: 'Invalid reward day'
            }, { status: 400 });
        }

        // Get all rewards (days 1..24 + repeat day 25 marker)
        let rewardRows: any[] = [];
        try {
            rewardRows = await daily_rewards.findAll({
                where: {
                    dayNumber: { [Op.between]: [1, 25] }
                },
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
        const reward = dayToClaim <= 24 ? rewardByDay.get(dayToClaim) : repeatReward;

        if (!reward) {
            return NextResponse.json({
                success: false,
                message: 'Reward configuration not found'
            }, { status: 404 });
        }

        let monthClaims: any[] = [];
        try {
            monthClaims = await daily_reward_claims.findAll({
                where: {
                    AccountID: userId,
                    [Op.or]: [
                        { claimYear: currentYear, claimMonth: calMonth },
                        {
                            claimedAt: {
                                [Op.gte]: monthStart,
                                [Op.lt]: monthEnd
                            }
                        }
                    ]
                }
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            monthClaims = await daily_reward_claims.findAll({
                attributes: ['id', 'AccountID', 'rewardId', 'claimedAt'],
                where: {
                    AccountID: userId,
                    claimedAt: {
                        [Op.gte]: monthStart,
                        [Op.lt]: monthEnd
                    }
                }
            });
        }

        if (hasClaimOnCurrentCalendarDay(monthClaims, now, tz)) {
            return NextResponse.json({
                success: false,
                message: 'You can only claim one reward per day'
            }, { status: 400 });
        }

        // Build set of month claim days (new + backward compatible rows)
        const claimDaySet = new Set<number>();
        for (const claim of monthClaims) {
            const explicitDay = Number(claim.claimDayNumber ?? 0);
            if (explicitDay > 0) {
                claimDaySet.add(explicitDay);
                continue;
            }
            const matchedReward = normalizedRewards.find((row) => row.id === Number(claim.rewardId));
            if (matchedReward?.dayNumber) {
                claimDaySet.add(matchedReward.dayNumber);
            }
        }

        // Check if reward/day was already claimed this month
        let existingClaim: any = null;
        try {
            existingClaim = await daily_reward_claims.findOne({
                where: {
                    AccountID: userId,
                    [Op.or]: [
                        { claimYear: currentYear, claimMonth: calMonth, claimDayNumber: dayToClaim },
                        {
                            rewardId: reward.id,
                            claimedAt: {
                                [Op.gte]: monthStart
                            }
                        }
                    ]
                }
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            existingClaim = await daily_reward_claims.findOne({
                where: {
                    AccountID: userId,
                    rewardId: reward.id,
                    claimedAt: {
                        [Op.gte]: monthStart
                    }
                }
            });
        }

        if (existingClaim) {
            return NextResponse.json({
                success: false,
                message: 'Reward already claimed'
            }, { status: 400 });
        }

        // Validate sequence and repeat-day behavior
        let maxSequentialBaseDay = 0;
        while (maxSequentialBaseDay < 24 && claimDaySet.has(maxSequentialBaseDay + 1)) {
            maxSequentialBaseDay += 1;
        }
        if (dayToClaim <= 24 && dayToClaim !== maxSequentialBaseDay + 1) {
            return NextResponse.json({
                success: false,
                message: 'You must claim all previous rewards first'
            }, { status: 400 });
        }
        if (dayToClaim > currentDayOfMonth) {
            return NextResponse.json({
                success: false,
                message: 'This reward day is not available yet'
            }, { status: 400 });
        }
        if (dayToClaim >= 25) {
            if (maxSequentialBaseDay < 24) {
                return NextResponse.json({
                    success: false,
                    message: 'Complete days 1 to 24 first'
                }, { status: 400 });
            }
            const claimedRepeatDays = Array.from(claimDaySet.values()).filter((day) => day >= 25).sort((a, b) => a - b);
            const nextRepeatClaimDay = claimedRepeatDays.length > 0 ? claimedRepeatDays[claimedRepeatDays.length - 1] + 1 : 25;
            if (dayToClaim !== nextRepeatClaimDay) {
                return NextResponse.json({
                    success: false,
                    message: 'Repeat rewards must be claimed in order'
                }, { status: 400 });
            }
        }

        // Check-in pass doubles the claim amount.
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
            passRecord = null;
        }
        const isPassActive = !!passRecord && new Date(passRecord.activeUntil).getTime() >= now.getTime();
        const finalAmount = Math.max(1, Number(reward.amount)) * (isPassActive ? 2 : 1);

        await dbod_acc.transaction(async (transaction) => {
            try {
                await daily_reward_claims.create({
                    AccountID: userId,
                    rewardId: reward.id,
                    claimDayNumber: dayToClaim,
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

            // Deliver directly to cashshop storage.
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
            message: 'Reward claimed successfully',
            amount: finalAmount,
            passApplied: isPassActive
        }, { status: 200 });
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to claim reward'
        }, { status: 500 });
    }
}

