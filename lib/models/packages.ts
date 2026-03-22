import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface PackageAttributes {
    id?: number;
    price: number;
    cashPoints: number;
    isForDonation: boolean | number;
    sortOrder?: number;
    name?: string | null;
}

export interface PackageInput extends Optional<PackageAttributes, 'id' | 'sortOrder' | 'name'> {}
export interface PackageOutput extends Required<PackageAttributes> {}

class packages extends Model<PackageAttributes, PackageInput> implements PackageAttributes {
    public id!: number;
    public price!: number;
    public cashPoints!: number;
    public isForDonation!: boolean;
    public sortOrder!: number;
    public name!: string | null | undefined;
}

packages.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    cashPoints: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isForDonation: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
});

export { packages };
