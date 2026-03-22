import { NextRequest, NextResponse } from 'next/server';
import { daily_rewards, daily_reward_claims } from '../../../lib/models/daily_rewards';
import { daily_logins } from '../../../lib/models/daily_logins';
import { Op } from 'sequelize';
import { getUserFromRequest } from '../../../lib/auth/utils';

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

        // Get current date
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Check if we need to reset for new month
        const lastLogin = await daily_logins.findOne({
            where: {
                AccountID: userId
            },
            order: [['loginDate', 'DESC']]
        });

        if (lastLogin) {
            const lastLoginDate = new Date(lastLogin.get('loginDate') as Date);
            if (lastLoginDate.getMonth() !== currentMonth || lastLoginDate.getFullYear() !== currentYear) {
                // Reset claims for new month
                await daily_reward_claims.destroy({
                    where: {
                        AccountID: userId
                    }
                });
                await daily_logins.destroy({
                    where: {
                        AccountID: userId
                    }
                });
            }
        }

        // Record today's login if not already recorded
        const todayLogin = await daily_logins.findOne({
            where: {
                AccountID: userId,
                loginDate: {
                    [Op.gte]: today
                }
            }
        });

        if (!todayLogin) {
            await daily_logins.create({
                AccountID: userId,
                loginDate: now
            });
        }

        // Get all rewards (28 days + bonus)
        const rewards = await daily_rewards.findAll({
            where: {
                date: {
                    [Op.lte]: 29
                }
            },
            order: [['date', 'ASC']]
        });

        // Get all login dates for this month
        const monthStart = new Date(currentYear, currentMonth, 1);
        const loginDates = await daily_logins.findAll({
            where: {
                AccountID: userId,
                loginDate: {
                    [Op.gte]: monthStart
                }
            },
            order: [['loginDate', 'ASC']]
        });

        // Get all claims for this month
        const monthClaims = await daily_reward_claims.findAll({
            where: {
                AccountID: userId,
                claimedAt: {
                    [Op.gte]: monthStart
                }
            }
        });

        // Get the last claimed reward
        const lastClaimedReward = monthClaims.length > 0 
            ? Math.max(...monthClaims.map(c => c.rewardId))
            : 0;

        // Get the last claim date
        const lastClaim = monthClaims.length > 0
            ? new Date(Math.max(...monthClaims.map(c => new Date(c.claimedAt).getTime())))
            : null;

        // Transform the data to include claim status
        const rewardsWithStatus = rewards.map((reward) => {
            const claim = monthClaims.find(c => c.rewardId === reward.id);
            const isClaimed = !!claim;

            // Check if this reward can be claimed
            let isAvailable = false;
            
            if (!isClaimed) {
                if (reward.id === 1) {
                    // Day 1 is available if user has logged in
                    isAvailable = loginDates.length > 0;
                } else {
                    // Other days are available if:
                    // 1. Previous reward was claimed
                    // 2. Last claim was on a different day
                    const hasClaimedPrevious = lastClaimedReward === reward.id - 1;
                    const isDifferentDay = !lastClaim || (
                        new Date(lastClaim).setHours(0, 0, 0, 0) !== 
                        new Date().setHours(0, 0, 0, 0)
                    );
                    
                    isAvailable = hasClaimedPrevious && isDifferentDay;
                }
            }

            return {
                date: reward.date,
                itemId: reward.itemId,
                amount: reward.amount,
                claimed: isClaimed,
                available: isAvailable,
                isBonus: reward.date === 29
            };
        });

        // Calculate time until next reset (end of month)
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        lastDayOfMonth.setHours(23, 59, 59, 999);

        // Calculate the difference in milliseconds
        const diffMs = lastDayOfMonth.getTime() - now.getTime();
        
        // Convert to seconds and ensure it's positive
        const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

        // Calculate individual time units
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return NextResponse.json({
            success: true,
            data: rewardsWithStatus,
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
