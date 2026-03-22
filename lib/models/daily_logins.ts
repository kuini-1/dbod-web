import { DataTypes, Model } from 'sequelize';
import { dbod_acc } from '../database/connection';

export interface DailyLoginAttributes {
    id?: number;
    AccountID: number;
    loginDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DailyLoginInstance extends Model<DailyLoginAttributes>, DailyLoginAttributes {}

export const daily_logins = dbod_acc.define<DailyLoginInstance>('daily_logins', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    loginDate: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'daily_logins',
    timestamps: true,
    freezeTableName: true
});
