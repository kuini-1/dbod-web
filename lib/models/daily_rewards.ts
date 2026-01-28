import { Model, DataTypes, Optional } from 'sequelize';
import { dbod_acc } from '../database/connection';

export interface DailyRewardAttributes {
    id: number;
    date: number;
    itemId: number;
    amount: number;
}

export interface DailyRewardClaimAttributes {
    id: number;
    AccountID: number;
    rewardId: number;
    claimedAt: Date;
}

export type DailyRewardCreationAttributes = Optional<DailyRewardAttributes, 'id'>;
export type DailyRewardClaimCreationAttributes = Optional<DailyRewardClaimAttributes, 'id'>;

class DailyReward extends Model<DailyRewardAttributes, DailyRewardCreationAttributes> implements DailyRewardAttributes {
    public id!: number;
    public date!: number;
    public itemId!: number;
    public amount!: number;
}

class DailyRewardClaim extends Model<DailyRewardClaimAttributes, DailyRewardClaimCreationAttributes> implements DailyRewardClaimAttributes {
    public id!: number;
    public AccountID!: number;
    public rewardId!: number;
    public claimedAt!: Date;
}

const daily_rewards = dbod_acc.define<DailyReward>('daily_rewards', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'daily_rewards'
});

const daily_reward_claims = dbod_acc.define<DailyRewardClaim>('daily_reward_claims', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    claimedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'daily_reward_claims'
});

// Create tables if they don't exist
daily_rewards.sync({ alter: true }).then(() => {
    console.log('Daily rewards table created or updated successfully');
}).catch((error) => {
    console.error('Error creating daily rewards table:', error);
});

daily_reward_claims.sync({ alter: true }).then(() => {
    console.log('Daily reward claims table created or updated successfully');
}).catch((error) => {
    console.error('Error creating daily reward claims table:', error);
});

export { daily_rewards, daily_reward_claims };
