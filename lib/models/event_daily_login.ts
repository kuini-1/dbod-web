import { Model, DataTypes, Optional } from 'sequelize';
import { dbod_acc } from '../database/connection';

export interface EventDailyLoginEventAttributes {
    id: number;
    title: string | null;
    slug: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface EventDailyLoginRewardAttributes {
    id: number;
    eventId: number;
    stepIndex: number;
    itemId: number;
    amount: number;
}

export interface EventDailyLoginClaimAttributes {
    id: number;
    eventId: number;
    AccountID: number;
    rewardId: number;
    stepIndex: number;
    claimDate: string;
    claimedAt: Date;
}

export type EventDailyLoginEventCreation = Optional<EventDailyLoginEventAttributes, 'id' | 'title' | 'slug' | 'isActive'>;
export type EventDailyLoginRewardCreation = Optional<EventDailyLoginRewardAttributes, 'id'>;
export type EventDailyLoginClaimCreation = Optional<EventDailyLoginClaimAttributes, 'id'>;

class EventDailyLoginEvent
    extends Model<EventDailyLoginEventAttributes, EventDailyLoginEventCreation>
    implements EventDailyLoginEventAttributes
{
    public id!: number;
    public title!: string | null;
    public slug!: string | null;
    public startDate!: string;
    public endDate!: string;
    public isActive!: boolean;
}

class EventDailyLoginReward
    extends Model<EventDailyLoginRewardAttributes, EventDailyLoginRewardCreation>
    implements EventDailyLoginRewardAttributes
{
    public id!: number;
    public eventId!: number;
    public stepIndex!: number;
    public itemId!: number;
    public amount!: number;
}

class EventDailyLoginClaim
    extends Model<EventDailyLoginClaimAttributes, EventDailyLoginClaimCreation>
    implements EventDailyLoginClaimAttributes
{
    public id!: number;
    public eventId!: number;
    public AccountID!: number;
    public rewardId!: number;
    public stepIndex!: number;
    public claimDate!: string;
    public claimedAt!: Date;
}

const event_daily_login_events = dbod_acc.define<EventDailyLoginEvent>('event_daily_login_events', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    slug: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    timestamps: false,
    tableName: 'event_daily_login_events',
});

const event_daily_login_rewards = dbod_acc.define<EventDailyLoginReward>('event_daily_login_rewards', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    stepIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: false,
    tableName: 'event_daily_login_rewards',
});

const event_daily_login_claims = dbod_acc.define<EventDailyLoginClaim>('event_daily_login_claims', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    stepIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    claimDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    claimedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
    tableName: 'event_daily_login_claims',
});

export { event_daily_login_events, event_daily_login_rewards, event_daily_login_claims };
