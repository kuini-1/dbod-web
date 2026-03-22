import { NextRequest, NextResponse } from 'next/server';
import { Model } from 'sequelize';
import { Raffle, RaffleEntry, RaffleWinner } from '../../../lib/models/raffle';

interface RaffleEntryRow {
    accountId: number;
    timestamp: string;
}

interface RaffleWinnerRow {
    accountId: number;
    amount: number;
    timestamp: string;
}

interface RaffleState {
    currentPot: number;
    entries: RaffleEntryRow[];
    timeLeft: number;
    winners: RaffleWinnerRow[];
    isActive: boolean;
    lastWinner?: {
        accountId: number;
        amount: number;
        timestamp: string;
    };
}

interface RaffleAttributes {
    id: number;
    currentPot: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    timeLeft: number;
}

const INITIAL_POT = 100;

// Helper function to calculate time until next 21:40
const getTimeUntilNextRaffle = () => {
    const now = new Date();
    const targetTime = new Date();

    targetTime.setHours(21, 40, 0, 0);

    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const timeLeft = Math.floor((targetTime.getTime() - now.getTime()) / 1000);
    return timeLeft;
};

export async function GET(request: NextRequest) {
    try {
        let currentRaffle = await Raffle.findOne({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        }) as Model<RaffleAttributes>;

        if (!currentRaffle) {
            const timeLeft = getTimeUntilNextRaffle();
            currentRaffle = await Raffle.create({
                currentPot: INITIAL_POT,
                isActive: true,
                timeLeft
            }) as Model<RaffleAttributes>;
        }

        const entries = await RaffleEntry.findAll({
            where: { raffleId: currentRaffle.get('id') },
            order: [['createdAt', 'ASC']]
        });

        const winners = await RaffleWinner.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        const lastWinner = winners.length > 0 ? {
            accountId: winners[0].get('account_id') as number,
            amount: winners[0].get('amount') as number,
            timestamp: (winners[0].get('createdAt') as Date).toISOString()
        } : undefined;

        const timeLeft = getTimeUntilNextRaffle();

        const raffleState: RaffleState = {
            currentPot: currentRaffle.get('currentPot') as number,
            entries: entries.map(entry => ({
                accountId: entry.get('account_id') as number,
                timestamp: (entry.get('createdAt') as Date).toISOString()
            })),
            timeLeft,
            winners: winners.map(winner => ({
                accountId: winner.get('account_id') as number,
                amount: winner.get('amount') as number,
                timestamp: (winner.get('createdAt') as Date).toISOString()
            })),
            isActive: timeLeft > 0,
            lastWinner
        };

        return NextResponse.json({
            success: true,
            data: raffleState
        }, { status: 200 });
    } catch (error) {
        console.error('Error in getRaffleState:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}
