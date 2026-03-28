import { NextRequest, NextResponse } from 'next/server';
import { daily_rewards, daily_reward_claims, daily_checkin_passes } from '../../../lib/models/daily_rewards';
import { Op } from 'sequelize';
import { getUserFromRequest } from '../../../lib/auth/utils';
import { querySupabaseTable } from '../../../lib/supabase/server';
import { CASHSHOP_TABLE_ID, normalizeCashshopRow } from '../../../lib/cashshop/catalog';
import { resolveIconFilenameCase } from '../../../lib/utils/icon-resolver';
import {
    daysInZonedMonth,
    getCalendarDayKey,
    getDailyLoginCalendarTimeZone,
    getZonedCalendarParts,
    getZonedMonthUtcRange,
    hasClaimOnCurrentCalendarDay,
} from '../../../lib/utils/daily-login-calendar';

type DailyRewardRow = {
    id: number;
    date?: number;
    dayNumber?: number;
    itemId: number;
    amount: number; 
};

const CHECKIN_PASS_PRICE = Number(process.env.DAILY_CHECKIN_PASS_PRICE ?? 150);

function isSchemaError(error: unknown): boolean {
    const message = String((error as any)?.message || '').toLowerCase();
    return message.includes('unknown column') || message.includes('doesn\'t exist') || message.includes('unknown table');
}

export async function GET(request: NextRequest) {
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
        const monthDays = daysInZonedMonth(currentYear, calMonth);
        const { start: monthStart, end: monthEnd } = getZonedMonthUtcRange(currentYear, calMonth, tz);

        // Get all configured rewards (days 1..24 + repeat day 25 marker)
        let rewardRows: DailyRewardRow[] = [];
        try {
            rewardRows = await daily_rewards.findAll({
                where: {
                    dayNumber: { [Op.between]: [1, 25] }
                },
                order: [['dayNumber', 'ASC']]
            }) as unknown as DailyRewardRow[];
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            rewardRows = await daily_rewards.findAll({
                attributes: ['id', 'date', 'itemId', 'amount'],
                where: {
                    date: {
                        [Op.between]: [1, 25]
                    }
                },
                order: [['date', 'ASC']]
            }) as unknown as DailyRewardRow[];
        }

        const normalizedRewards = rewardRows.map((row) => ({
            ...row,
            dayNumber: Number(row.dayNumber) > 0 ? Number(row.dayNumber) : Number(row.date ?? 0),
            itemId: Number(row.itemId),
            amount: Number(row.amount),
            id: Number(row.id)
        })).filter((row) => Number.isFinite(row.dayNumber) && row.dayNumber >= 1 && row.dayNumber <= 25);

        const rewardByDay = new Map<number, DailyRewardRow>();
        for (const reward of normalizedRewards) {
            if (!rewardByDay.has(reward.dayNumber)) {
                rewardByDay.set(reward.dayNumber, reward);
            }
        }

        const repeatReward = rewardByDay.get(25) || rewardByDay.get(24) || normalizedRewards[normalizedRewards.length - 1] || null;

        // Get all claims for this month (month-keyed + backward compatible date query)
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

        const claimDaySet = new Set<number>();
        for (const claim of monthClaims) {
            const explicitDay = Number(claim.claimDayNumber ?? 0);
            if (explicitDay > 0) {
                claimDaySet.add(explicitDay);
            } else {
                const matchedReward = normalizedRewards.find((reward) => reward.id === Number(claim.rewardId));
                if (matchedReward?.dayNumber) {
                    claimDaySet.add(matchedReward.dayNumber);
                }
            }
        }

        let maxSequentialBaseDay = 0;
        while (maxSequentialBaseDay < 24 && claimDaySet.has(maxSequentialBaseDay + 1)) {
            maxSequentialBaseDay += 1;
        }

        const claimedRepeatDays = Array.from(claimDaySet.values()).filter((day) => day >= 25).sort((a, b) => a - b);
        const nextRepeatClaimDay = claimedRepeatDays.length > 0 ? claimedRepeatDays[claimedRepeatDays.length - 1] + 1 : 25;

        const hasClaimedToday = hasClaimOnCurrentCalendarDay(monthClaims, now, tz);

        const uniqueItemIds = Array.from(new Set(
            [
                ...Array.from({ length: 24 }, (_, idx) => rewardByDay.get(idx + 1)?.itemId ?? 0),
                repeatReward?.itemId ?? 0
            ].filter((value) => Number.isFinite(value) && value > 0)
        ));

        const itemMetaById = new Map<number, { name: string; iconUrl: string | null }>();
        if (uniqueItemIds.length > 0) {
            try {
                const tblidxFilter = `in.(${uniqueItemIds.join(',')})`;
                let supabaseRows = await querySupabaseTable<Record<string, unknown>>({
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

                const normalizedItems = await Promise.all(
                    supabaseRows.map(async (row) => {
                        const normalized = normalizeCashshopRow(row);
                        if (!normalized) return null;
                        normalized.szIcon_Name = await resolveIconFilenameCase(normalized.szIcon_Name);
                        return normalized;
                    })
                );

                for (const item of normalizedItems) {
                    if (!item) continue;
                    const iconUrl = item.szIcon_Name
                        ? `/icon/${item.szIcon_Name}${item.szIcon_Name.endsWith('.png') ? '' : '.png'}`
                        : null;
                    itemMetaById.set(Number(item.itemId), {
                        name: String(item.wszName || `Item ${item.itemId}`),
                        iconUrl
                    });
                }
            } catch (supabaseError) {
                console.error('Failed to load daily reward metadata from Supabase:', supabaseError);
            }
        }

        const rewardsWithStatus = Array.from({ length: monthDays }, (_, index) => {
            const day = index + 1;
            const reward = day <= 24 ? rewardByDay.get(day) : repeatReward;
            const isClaimed = claimDaySet.has(day);

            let isAvailable = false;
            if (!isClaimed && !hasClaimedToday && day <= currentDayOfMonth && reward) {
                if (day <= 24) {
                    isAvailable = day === maxSequentialBaseDay + 1;
                } else {
                    isAvailable = maxSequentialBaseDay >= 24 && day === nextRepeatClaimDay;
                }
            }

            const itemMeta = reward ? itemMetaById.get(Number(reward.itemId)) : null;

            return {
                date: day,
                itemId: reward?.itemId ?? 0,
                amount: reward?.amount ?? 0,
                claimed: isClaimed,
                available: isAvailable,
                isRepeat: day >= 25,
                name: itemMeta?.name ?? (reward ? `Item ${reward.itemId}` : 'Unconfigured reward'),
                iconUrl: itemMeta?.iconUrl ?? '/event icons/i_hls_aoto_lp_s.png'
            };
        });

        let passRecord: any = null;
        try {
            passRecord = await daily_checkin_passes.findOne({
                where: {
                    AccountID: userId,
                    purchaseYear: currentYear,
                    purchaseMonth: calMonth
                },
                order: [['id', 'DESC']]
            });
        } catch (error) {
            if (!isSchemaError(error)) throw error;
            passRecord = null;
        }
        const isPassActive = !!passRecord && new Date(passRecord.activeUntil).getTime() >= now.getTime();

        // Time until next calendar month in login TZ (first instant of next month).
        const diffMs = monthEnd.getTime() - now.getTime();
        
        // Convert to seconds and ensure it's positive
        const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

        // Calculate individual time units
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return NextResponse.json({
            success: true,
            calendarDayKey: getCalendarDayKey(now, tz),
            data: rewardsWithStatus,
            pass: {
                isActive: isPassActive,
                price: CHECKIN_PASS_PRICE,
                expiresAt: passRecord ? new Date(passRecord.activeUntil).toISOString() : null
            },
            timeUntilReset: {
                days,
                hours,
                minutes,
                seconds
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching daily rewards:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch daily rewards'
        }, { status: 500 });
    }
}
