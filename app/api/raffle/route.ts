import { NextRequest, NextResponse } from 'next/server';
import { dbod_acc } from '../../../lib/database/connection';
import { Model, DataTypes } from 'sequelize';

interface RaffleEntry {
    accountId: number;
    timestamp: string;
}

interface RaffleWinner {
    accountId: number;
    amount: number;
    timestamp: string;
}

interface RaffleState {
    currentPot: number;
    entries: RaffleEntry[];
    timeLeft: number;
    winners: RaffleWinner[];
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

interface RaffleEntryAttributes {
    id: number;
    raffleId: number;
    account_id: number;
    createdAt: Date;
    updatedAt: Date;
}

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

const RaffleWinner = dbod_acc.models.raffle_winner || dbod_acc.define('raffle_winner', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'account_id'
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'raffle_winners',
    timestamps: true,
    freezeTableName: true
});

// Set up associations
Raffle.hasMany(RaffleEntry, { foreignKey: 'raffleId' });
RaffleEntry.belongsTo(Raffle, { foreignKey: 'raffleId' });

// Initialize models
dbod_acc.models.raffle = Raffle;
dbod_acc.models.raffle_entry = RaffleEntry;
dbod_acc.models.raffle_winner = RaffleWinner;

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

export async function GET(request: NextRequest) {
    try {
        // Get current raffle
        let currentRaffle = await Raffle.findOne({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        }) as Model<RaffleAttributes>;

        if (!currentRaffle) {
            // If no active raffle exists, create one
            const timeLeft = getTimeUntilNextRaffle();
            currentRaffle = await Raffle.create({
                currentPot: INITIAL_POT,
                isActive: true,
                timeLeft
            }) as Model<RaffleAttributes>;
        }

        // Get all entries for current raffle
        const entries = await RaffleEntry.findAll({
            where: { raffleId: currentRaffle.get('id') },
            order: [['createdAt', 'ASC']]
        });

        // Get all winners
        const winners = await RaffleWinner.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        // Get last winner
        const lastWinner = winners.length > 0 ? {
            accountId: winners[0].get('account_id') as number,
            amount: winners[0].get('amount') as number,
            timestamp: (winners[0].get('createdAt') as Date).toISOString()
        } : undefined;

        // Calculate time left
        const timeLeft = getTimeUntilNextRaffle();

        // Prepare response
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
