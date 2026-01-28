import { Model, DataTypes } from 'sequelize';
import sequelize from '../database/config';

export interface RaffleEntryAttributes {
    id: number;
    AccountID: number;
    characterName: string;
    CharID: number;
    createdAt: Date;
}

export const raffle_entries = sequelize.define<Model<RaffleEntryAttributes>>('raffle_entries', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    characterName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CharID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'raffle_entries'
});
