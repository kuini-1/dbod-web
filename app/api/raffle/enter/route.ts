import { NextRequest, NextResponse } from 'next/server';
import { dbod_acc } from '../../../../lib/database/connection';
import { Model, DataTypes } from 'sequelize';
import { getUserFromRequest } from '../../../../lib/auth/utils';

const RAFFLE_ENTRY_COST = 5;
const INITIAL_POT = 100;

// Define Sequelize models
const Raffle = dbod_acc.models.raffle || dbod_acc.define('raffle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    currentPot: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    timeLeft: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'raffles',
    timestamps: true,
    freezeTableName: true
});

const RaffleEntry = dbod_acc.models.raffle_entry || dbod_acc.define('raffle_entry', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    raffleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'account_id'
    }
}, {
    tableName: 'raffle_entries',
    timestamps: true,
    freezeTableName: true
});

// Helper function to calculate time until next 21:40
const getTimeUntilNextRaffle = () => {
    const now = new Date();
    const targetTime = new Date();
    
    // Set target time to 21:40 in local time
    targetTime.setHours(21, 40, 0, 0);
    
    // If the target time has already passed today, set it for tomorrow
    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeLeft = Math.floor((targetTime.getTime() - now.getTime()) / 1000);
    return timeLeft;
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

        // Get current raffle
        const currentRaffle = await Raffle.findOne({
            where: { isActive: true }
        });

        if (!currentRaffle) {
            return NextResponse.json({
                success: false,
                message: 'No active raffle found'
            }, { status: 400 });
        }

        // Check if raffle is active
        const timeLeft = getTimeUntilNextRaffle();
        if (timeLeft <= 0) {
            return NextResponse.json({
                success: false,
                message: 'Raffle is currently closed'
            }, { status: 400 });
        }

        // Check if user has already entered with this character
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

        // Start transaction
        const transaction = await dbod_acc.transaction();

        try {
            // Create entry
            await RaffleEntry.create({
                raffleId: currentRaffle.get('id'),
                account_id: userId
            }, { transaction });

            // Update pot
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
