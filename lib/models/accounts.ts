import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface AccountsAttributes {
    AccountID?: number;
    Username: string;
    Password_hash: string;
    acc_status?: number;
    email: string;
    mallpoints?: number;
    reg_date?: Date;
    last_login?: Date;
    reg_ip?: string;
    admin?: number;
    isGm?: number;
    lastServerFarmId?: number;
    founder?: number;
    founder_recv?: number;
    last_ip?: string;
    del_char_pw?: string;
    PremiumSlots?: number;
    EventCoins?: number;
    WaguCoins?: number;
    web_ip?: string;
    vip?: number;
    vip_exp?: number;
    donated?: number;
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

export interface AccountsInput extends Optional<AccountsAttributes, 'AccountID'> {}
export interface EventRewardInput extends Optional<EventRewardAttributes, 'CharID' | 'CharName'> {}
export interface VipRewardInput extends VipRewardAttributes {}

class accounts extends Model<AccountsAttributes, AccountsInput> implements AccountsAttributes {
    public AccountID!: number
    public Username!: string
    public Password_hash!: string
    public acc_status!: number
    public email!: string
    public mallpoints!: number
    public reg_date!: Date
    public last_login!: Date
    public reg_ip!: string
    public admin!: number
    public isGm!: number
    public lastServerFarmId!: number
    public founder!: number
    public founder_recv!: number
    public last_ip!: string
    public del_char_pw!: string
    public PremiumSlots!: number
    public EventCoins!: number
    public WaguCoins!: number
    public web_ip!: string
    public vip!: number
    public vip_exp!: number
    public donated!: number
}

const event_reward = dbod_acc.define<Model<EventRewardAttributes>>('event_reward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rewardTblidx: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    CharID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    CharName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastRewardDay: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'event_reward'
});

class vip_reward extends Model<VipRewardAttributes, VipRewardInput> implements VipRewardAttributes {
    public AccountID!: number;
    public Vip!: number;
}

accounts.init({
    AccountID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    Password_hash: {
        type: DataTypes.STRING
    },
    acc_status: {
        type: DataTypes.TINYINT
    },
    email: {
        type: DataTypes.STRING
    },
    mallpoints: {
        type: DataTypes.INTEGER
    },
    reg_date: {
        type: DataTypes.TIME
    },
    last_login: {
        type: DataTypes.TIME
    },
    reg_ip: {
        type: DataTypes.STRING
    },
    admin: {
        type: DataTypes.TINYINT
    },
    isGm: {
        type: DataTypes.TINYINT
    },
    lastServerFarmId: {
        type: DataTypes.TINYINT
    },
    founder: {
        type: DataTypes.SMALLINT
    },
    founder_recv: {
        type: DataTypes.SMALLINT
    },
    last_ip: {
        type: DataTypes.STRING
    },
    del_char_pw: {
        type: DataTypes.STRING
    },
    PremiumSlots: {
        type: DataTypes.TINYINT
    },
    EventCoins: {
        type: DataTypes.INTEGER
    },
    WaguCoins: {
        type: DataTypes.INTEGER
    },
    web_ip: {
        type: DataTypes.STRING
    },
    vip: {
        type: DataTypes.TINYINT
    },
    vip_exp: {
        type: DataTypes.INTEGER
    },
    donated: {
        type: DataTypes.TINYINT
    }
  }, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
})

vip_reward.init({
    AccountID: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
    },
    Vip: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        primaryKey: true
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
    indexes: [
        {
            unique: true,
            fields: ['AccountID', 'Vip']
        }
    ]
});

// Create tables if they don't exist
Promise.all([
    accounts.sync({ alter: true }),
    event_reward.sync({ alter: true }),
    vip_reward.sync({ alter: true })
]).then(() => {
    console.log('All tables created or updated successfully');
}).catch((error) => {
    console.error('Error creating tables:', error);
});

export { accounts, event_reward, vip_reward }
