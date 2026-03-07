import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface CashshopStorageAttributes {
    ProductId: number;
    AccountID: number;
    HLSitemTblidx: number;
    StackCount: number;
    giftCharId?: number | null;
    IsRead: number;
    SenderName?: string | null;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
    isMoved: number;
    Buyer?: number | null;
    price?: number | null;
    ItemID?: number | null;
}

export type CashshopStorageCreationAttributes = Optional<CashshopStorageAttributes, 'ProductId' | 'giftCharId' | 'SenderName' | 'Buyer' | 'price' | 'ItemID'>;

class cashshop_storage extends Model<CashshopStorageAttributes, CashshopStorageCreationAttributes> implements CashshopStorageAttributes {
    public ProductId!: number;
    public AccountID!: number;
    public HLSitemTblidx!: number;
    public StackCount!: number;
    public giftCharId!: number | null;
    public IsRead!: number;
    public SenderName!: string | null;
    public year!: number;
    public month!: number;
    public day!: number;
    public hour!: number;
    public minute!: number;
    public second!: number;
    public millisecond!: number;
    public isMoved!: number;
    public Buyer!: number | null;
    public price!: number | null;
    public ItemID!: number | null;
}

cashshop_storage.init({
    ProductId: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    AccountID: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    HLSitemTblidx: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    StackCount: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    giftCharId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
    },
    IsRead: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    SenderName: {
        type: DataTypes.STRING(16),
        allowNull: true,
        defaultValue: null,
    },
    year: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    month: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    day: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    hour: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    minute: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    second: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
    },
    millisecond: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    isMoved: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    Buyer: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
    },
    price: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
    },
    ItemID: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc
});

// Create table if it doesn't exist
cashshop_storage.sync({ alter: true }).then(() => {
    console.log('Cashshop storage table created or updated successfully');
}).catch((error) => {
    console.error('Error creating cashshop storage table:', error);
});

export default cashshop_storage;
