import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface DonationTierItemAttributes {
    id: number;
    tierId: number;
    tblidx: number;
    amount: number;
    sortOrder?: number | null;
}

export type DonationTierItemCreationAttributes = Optional<DonationTierItemAttributes, 'id' | 'sortOrder'>;

class donation_tier_items extends Model<DonationTierItemAttributes, DonationTierItemCreationAttributes> implements DonationTierItemAttributes {
    public id!: number;
    public tierId!: number;
    public tblidx!: number;
    public amount!: number;
    public sortOrder!: number | null;
}

donation_tier_items.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tblidx: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
    tableName: 'donation_tier_items',
});

export { donation_tier_items };

