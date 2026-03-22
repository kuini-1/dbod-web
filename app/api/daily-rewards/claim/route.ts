import { NextRequest, NextResponse } from 'next/server';
import { daily_rewards, daily_reward_claims } from '../../../../lib/models/daily_rewards';
import { daily_logins } from '../../../../lib/models/daily_logins';
import { event_reward } from '../../../../lib/models/accounts';
import { Op } from 'sequelize';
import { getUserFromRequest } from '../../../../lib/auth/utils';

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

        // Get current date
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);

        const { date, characterName, CharID } = await request.json();
        
        // Validate required fields
        if (!date || !characterName || !CharID) {
            return NextResponse.json({
                success: false,
                message: 'Date, character name, and CharID are required'
            }, { status: 400 });
        }

        // Get all rewards
        const rewards = await daily_rewards.findAll({
            where: {
                date: {
                    [Op.lte]: 29
                }
            },
            order: [['date', 'ASC']]
        });

        // Get the reward for the specified date
        const reward = rewards.find(r => r.date === date);

        if (!reward) {
            return NextResponse.json({
                success: false,
                message: 'Reward not found'
            }, { status: 404 });
        }

        // Get all login dates for this month
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

        // Check if enough time has passed since last claim (must be a different day)
        if (lastClaim) {
            const lastClaimDate = new Date(lastClaim);
            const today = new Date();
            
            // Reset time part to compare only dates
            lastClaimDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            // Check if it's the same day
            if (today.getTime() === lastClaimDate.getTime()) {
                return NextResponse.json({
                    success: false,
                    message: 'You can only claim one reward per day'
                }, { status: 400 });
            }
        }

        // Check if reward was already claimed
        const existingClaim = await daily_reward_claims.findOne({
            where: {
                AccountID: userId,
                rewardId: reward.id,
                claimedAt: {
                    [Op.gte]: monthStart
                }
            }
        });

        if (existingClaim) {
            return NextResponse.json({
                success: false,
                message: 'Reward already claimed'
            }, { status: 400 });
        }

        // For day 1, we only need to check if user has logged in at least once
        // For other days, we need to check if previous reward was claimed
        if (reward.id > 1 && lastClaimedReward !== reward.id - 1) {
            return NextResponse.json({
                success: false,
                message: 'You must claim all previous rewards first'
            }, { status: 400 });
        }

        // Create claim record
        await daily_reward_claims.create({
            AccountID: userId,
            rewardId: reward.id,
            claimedAt: now
        });

        // Create event reward record
        await event_reward.create({
            id: Date.now(), // Use timestamp as a unique ID
            AccountID: userId,
            rewardTblidx: reward.itemId,
            CharID: CharID,
            CharName: characterName,
            lastRewardDay: reward.date
        });

        return NextResponse.json({
            success: true,
            message: 'Reward claimed successfully'
        }, { status: 200 });
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to claim reward'
        }, { status: 500 });
    }
}
