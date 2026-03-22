import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface DonationTierClaimAttributes {
    id: number;
    AccountID: number;
    tierId: number;
    claimedAt: Date;
}

export type DonationTierClaimCreationAttributes = Optional<DonationTierClaimAttributes, 'id'>;

class donation_tier_claims extends Model<DonationTierClaimAttributes, DonationTierClaimCreationAttributes> implements DonationTierClaimAttributes {
    public id!: number;
    public AccountID!: number;
    public tierId!: number;
    public claimedAt!: Date;
}

donation_tier_claims.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    AccountID: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    claimedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
    tableName: 'donation_tier_claims',
    indexes: [
        { unique: true, fields: ['AccountID', 'tierId'] },
        { fields: ['AccountID'] },
    ],
});

export { donation_tier_claims };
