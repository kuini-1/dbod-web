import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export type AccountStatus = "pending" | "block" | "active";

interface AccountsAttributes {
    AccountID: number;
    Username: string;
    Password_hash: string;
    acc_status: AccountStatus;
    email: string;
    mallpoints: number;
    reg_date: Date;
    ban: number | null;
    last_login: Date | null;
    reg_ip: string | null;
    admin: number;
    isGm: number;
    lastServerFarmId: number;
    founder: number;
    founder_recv: number;
    last_ip: string;
    del_char_pw: string;
    PremiumSlots: number;
    EventCoins: number | null;
    WaguCoins: number | null;
    web_ip: string | null;
    vip: number | null;
    vip_exp: number | null;
    donated: number | null;
}

export interface EventRewardAttributes {
    id: number;
    AccountID: number;
    rewardTblidx: number;
    CharID: number;
    CharName: string;
    lastRewardDay: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface VipRewardAttributes {
    AccountID: number;
    Vip: number;
}

export interface AccountsInput extends Optional<AccountsAttributes, "AccountID"> {}
export interface EventRewardInput extends Optional<EventRewardAttributes, "CharID" | "CharName"> {}
export interface VipRewardInput extends VipRewardAttributes {}

class accounts extends Model<AccountsAttributes, AccountsInput> implements AccountsAttributes {
    public AccountID!: number;
    public Username!: string;
    public Password_hash!: string;
    public acc_status!: AccountStatus;
    public email!: string;
    public mallpoints!: number;
    public reg_date!: Date;
    public ban!: number | null;
    public last_login!: Date | null;
    public reg_ip!: string | null;
    public admin!: number;
    public isGm!: number;
    public lastServerFarmId!: number;
    public founder!: number;
    public founder_recv!: number;
    public last_ip!: string;
    public del_char_pw!: string;
    public PremiumSlots!: number;
    public EventCoins!: number | null;
    public WaguCoins!: number | null;
    public web_ip!: string | null;
    public vip!: number | null;
    public vip_exp!: number | null;
    public donated!: number | null;
}

const event_reward = dbod_acc.define<Model<EventRewardAttributes>>("event_reward", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    rewardTblidx: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    CharID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    CharName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastRewardDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
    tableName: "event_reward",
});

class vip_reward extends Model<VipRewardAttributes, VipRewardInput> implements VipRewardAttributes {
    public AccountID!: number;
    public Vip!: number;
}

/** Matches `CREATE TABLE accounts` in dbod_acc.sql */
accounts.init(
    {
        AccountID: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        Username: {
            type: DataTypes.STRING(16),
            primaryKey: true,
            allowNull: false,
        },
        Password_hash: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        acc_status: {
            type: DataTypes.ENUM("pending", "block", "active"),
            allowNull: false,
            defaultValue: "active",
        },
        email: {
            type: DataTypes.STRING(80),
            allowNull: false,
            defaultValue: "test@mail.com",
        },
        mallpoints: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        reg_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        ban: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 0,
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        reg_ip: {
            type: DataTypes.STRING(15),
            allowNull: true,
            defaultValue: null,
        },
        admin: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        isGm: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0,
        },
        lastServerFarmId: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        founder: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        founder_recv: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            defaultValue: 0,
        },
        last_ip: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: "0.0.0.0",
        },
        del_char_pw: {
            type: DataTypes.STRING(32),
            allowNull: false,
            defaultValue: "25f9e794323b453885f5181f1b624d0b",
        },
        PremiumSlots: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: 4,
        },
        EventCoins: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
        },
        WaguCoins: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            defaultValue: 0,
        },
        web_ip: {
            type: DataTypes.STRING(15),
            allowNull: true,
            defaultValue: null,
        },
        vip: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 0,
        },
        vip_exp: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        donated: {
            type: DataTypes.TINYINT,
            allowNull: true,
            defaultValue: 0,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
    }
);

vip_reward.init(
    {
        AccountID: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
        Vip: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
        indexes: [
            {
                unique: true,
                fields: ["AccountID", "Vip"],
            },
        ],
    }
);

export { accounts, event_reward, vip_reward };
