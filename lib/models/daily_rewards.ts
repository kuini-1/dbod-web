import { Model, DataTypes, Optional } from 'sequelize';
import { dbod_acc } from '../database/connection';

export interface DailyRewardAttributes {
    id: number;
    date?: number;
    dayNumber: number;
    itemId: number;
    amount: number;
}

export interface DailyRewardClaimAttributes {
    id: number;
    AccountID: number;
    rewardId: number;
    claimDayNumber: number;
    claimYear: number;
    claimMonth: number;
    claimDate: Date;
    claimedAt: Date;
}

export interface DailyCheckinPassAttributes {
    id: number;
    AccountID: number;
    purchaseYear: number;
    purchaseMonth: number;
    activeFrom: Date;
    activeUntil: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type DailyRewardCreationAttributes = Optional<DailyRewardAttributes, 'id'>;
export type DailyRewardClaimCreationAttributes = Optional<DailyRewardClaimAttributes, 'id'>;
export type DailyCheckinPassCreationAttributes = Optional<DailyCheckinPassAttributes, 'id'>;

class DailyReward extends Model<DailyRewardAttributes, DailyRewardCreationAttributes> implements DailyRewardAttributes {
    public id!: number;
    public date?: number;
    public dayNumber!: number;
    public itemId!: number;
    public amount!: number;
}

class DailyRewardClaim extends Model<DailyRewardClaimAttributes, DailyRewardClaimCreationAttributes> implements DailyRewardClaimAttributes {
    public id!: number;
    public AccountID!: number;
    public rewardId!: number;
    public claimDayNumber!: number;
    public claimYear!: number;
    public claimMonth!: number;
    public claimDate!: Date;
    public claimedAt!: Date;
}

class DailyCheckinPass extends Model<DailyCheckinPassAttributes, DailyCheckinPassCreationAttributes> implements DailyCheckinPassAttributes {
    public id!: number;
    public AccountID!: number;
    public purchaseYear!: number;
    public purchaseMonth!: number;
    public activeFrom!: Date;
    public activeUntil!: Date;
    public createdAt?: Date;
    public updatedAt?: Date;
}

const daily_rewards = dbod_acc.define<DailyReward>('daily_rewards', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dayNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    claimDayNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    claimYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    claimMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    claimDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
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

const daily_checkin_passes = dbod_acc.define<DailyCheckinPass>('daily_checkin_passes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    purchaseYear: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    purchaseMonth: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    activeFrom: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    activeUntil: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'daily_checkin_passes'
});

export { daily_rewards, daily_reward_claims, daily_checkin_passes };
