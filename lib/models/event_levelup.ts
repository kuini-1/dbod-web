import { Model, DataTypes, Optional } from 'sequelize';
import { dbod_acc } from '../database/connection';

export interface EventLevelupEventAttributes {
    id: number;
    title: string | null;
    slug: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface EventLevelupRewardAttributes {
    id: number;
    eventId: number;
    requiredLevel: number;
    itemId: number;
    amount: number;
}

export interface EventLevelupClaimAttributes {
    id: number;
    eventId: number;
    AccountID: number;
    characterId: number;
    rewardId: number;
    requiredLevel: number;
    claimedAt: Date;
}

export type EventLevelupEventCreation = Optional<EventLevelupEventAttributes, 'id' | 'title' | 'slug' | 'isActive'>;
export type EventLevelupRewardCreation = Optional<EventLevelupRewardAttributes, 'id'>;
export type EventLevelupClaimCreation = Optional<EventLevelupClaimAttributes, 'id'>;

class EventLevelupEvent
    extends Model<EventLevelupEventAttributes, EventLevelupEventCreation>
    implements EventLevelupEventAttributes
{
    public id!: number;
    public title!: string | null;
    public slug!: string | null;
    public startDate!: string;
    public endDate!: string;
    public isActive!: boolean;
}

class EventLevelupReward
    extends Model<EventLevelupRewardAttributes, EventLevelupRewardCreation>
    implements EventLevelupRewardAttributes
{
    public id!: number;
    public eventId!: number;
    public requiredLevel!: number;
    public itemId!: number;
    public amount!: number;
}

class EventLevelupClaim
    extends Model<EventLevelupClaimAttributes, EventLevelupClaimCreation>
    implements EventLevelupClaimAttributes
{
    public id!: number;
    public eventId!: number;
    public AccountID!: number;
    public characterId!: number;
    public rewardId!: number;
    public requiredLevel!: number;
    public claimedAt!: Date;
}

const event_levelup_events = dbod_acc.define<EventLevelupEvent>('event_levelup_events', {
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
    tableName: 'event_levelup_events',
});

const event_levelup_rewards = dbod_acc.define<EventLevelupReward>('event_levelup_rewards', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    requiredLevel: {
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
    tableName: 'event_levelup_rewards',
});

const event_levelup_claims = dbod_acc.define<EventLevelupClaim>('event_levelup_claims', {
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
    characterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    requiredLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    claimedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
    tableName: 'event_levelup_claims',
});

export { event_levelup_events, event_levelup_rewards, event_levelup_claims };
