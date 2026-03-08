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

const SEED_PACKAGES = [
    { price: 5, cashPoints: 50, isForDonation: 1, sortOrder: 1, name: '$5 Package' },
    { price: 10, cashPoints: 105, isForDonation: 1, sortOrder: 2, name: '$10 Package' },
    { price: 25, cashPoints: 275, isForDonation: 1, sortOrder: 3, name: '$25 Package' },
    { price: 50, cashPoints: 575, isForDonation: 1, sortOrder: 4, name: '$50 Package' },
    { price: 80, cashPoints: 960, isForDonation: 1, sortOrder: 5, name: '$80 Package' },
    { price: 100, cashPoints: 1250, isForDonation: 1, sortOrder: 6, name: '$100 Package' },
];

(async () => {
    try {
        await packages.sync({ alter: true });
        const count = await packages.count();
        if (count === 0) {
            await packages.bulkCreate(SEED_PACKAGES as any);
            console.log('Packages table seeded with 6 donation packages');
        } else {
            console.log('Packages table already has data, skipping seed');
        }
    } catch (error) {
        console.error('Error creating/seeding packages table:', error);
    }
})();

export { packages };
