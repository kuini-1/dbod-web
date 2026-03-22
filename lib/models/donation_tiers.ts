import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface DonationTierAttributes {
    id?: number;
    amount: number;
    title: string;
    icon?: string;
    order?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DonationTierInput extends Optional<DonationTierAttributes, 'id' | 'icon' | 'order' | 'createdAt' | 'updatedAt'> {}
export interface DonationTierOutput extends Required<DonationTierAttributes> {}

class donation_tiers extends Model<DonationTierAttributes, DonationTierInput> implements DonationTierAttributes {
    public id!: number;
    public amount!: number;
    public title!: string;
    public icon!: string;
    public order!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

donation_tiers.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING(50),
        defaultValue: 'award'
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
    tableName: 'donation_tiers'
});

export { donation_tiers };
