import { DataTypes } from 'sequelize';
import { dbod_acc } from '../database/connection';

/** Active raffle period (table `raffles`). */
export const Raffle = dbod_acc.define(
    'raffle',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        currentPot: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        timeLeft: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: 'raffles',
        timestamps: true,
        freezeTableName: true,
    }
);

/** Entries for a raffle (table `raffle_entries`). */
export const RaffleEntry = dbod_acc.define(
    'raffle_entry',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        raffleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'account_id',
        },
    },
    {
        tableName: 'raffle_entries',
        timestamps: true,
        freezeTableName: true,
    }
);

/** Past winners (table `raffle_winners`). */
export const RaffleWinner = dbod_acc.define(
    'raffle_winner',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'account_id',
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: 'raffle_winners',
        timestamps: true,
        freezeTableName: true,
    }
);

Raffle.hasMany(RaffleEntry, { foreignKey: 'raffleId' });
RaffleEntry.belongsTo(Raffle, { foreignKey: 'raffleId' });

dbod_acc.models.raffle = Raffle;
dbod_acc.models.raffle_entry = RaffleEntry;
dbod_acc.models.raffle_winner = RaffleWinner;
