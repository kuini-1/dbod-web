import { NextRequest, NextResponse } from 'next/server';
import { dbod_acc } from '../../../../lib/database/connection';
import { Raffle, RaffleEntry } from '../../../../lib/models/raffle';
import { getUserFromRequest } from '../../../../lib/auth/utils';

const RAFFLE_ENTRY_COST = 5;

const getTimeUntilNextRaffle = () => {
    const now = new Date();
    const targetTime = new Date();

    targetTime.setHours(21, 40, 0, 0);

    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    return Math.floor((targetTime.getTime() - now.getTime()) / 1000);
};

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

        const { characterName, CharID } = await request.json();
        if (!characterName || !CharID) {
            return NextResponse.json({
                success: false,
                message: 'Character name and ID are required'
            }, { status: 400 });
        }

        const currentRaffle = await Raffle.findOne({
            where: { isActive: true }
        });

        if (!currentRaffle) {
            return NextResponse.json({
                success: false,
                message: 'No active raffle found'
            }, { status: 400 });
        }

        const timeLeft = getTimeUntilNextRaffle();
        if (timeLeft <= 0) {
            return NextResponse.json({
                success: false,
                message: 'Raffle is currently closed'
            }, { status: 400 });
        }

        const existingEntry = await RaffleEntry.findOne({
            where: {
                raffleId: currentRaffle.get('id'),
                account_id: userId
            }
        });

        if (existingEntry) {
            return NextResponse.json({
                success: false,
                message: 'You have already entered the raffle with this character'
            }, { status: 400 });
        }

        const transaction = await dbod_acc.transaction();

        try {
            await RaffleEntry.create({
                raffleId: currentRaffle.get('id'),
                account_id: userId
            }, { transaction });

            await currentRaffle.update({
                currentPot: (currentRaffle.get('currentPot') as number) + RAFFLE_ENTRY_COST
            }, { transaction });

            await transaction.commit();

            return NextResponse.json({
                success: true,
                message: 'Successfully entered the raffle'
            }, { status: 200 });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error in enterRaffle:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal server error'
        }, { status: 500 });
    }
}
