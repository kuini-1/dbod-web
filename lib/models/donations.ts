import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface DonationsAttributes {
    id: number;
    Username?: string;
    OrderID?: string;
    Email?: string;
    Currency?: string;
    Value?: number;
    mallpoints?: number;
    packageId?: number | null;
}
export interface DonationsInput extends Optional<DonationsAttributes, 'id'> {}
export interface DonationsOuput extends Required<DonationsAttributes> {}

class donations extends Model<DonationsAttributes, DonationsInput> implements DonationsAttributes {
    public id!: number;
    public Username!: string;
    public OrderID!: string;
    public Email!: string;
    public Currency!: string;
    public Value!: number;
    public mallpoints!: number;
    public packageId!: number | null;
}

donations.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Username: {
        type: DataTypes.STRING,
    },
    OrderID: {
        type: DataTypes.STRING,
    },
    Email: {
        type: DataTypes.STRING,
    },
    Currency: {
        type: DataTypes.STRING
    },
    Value: {
        type: DataTypes.DECIMAL(10, 2)
    },
    mallpoints: {
        type: DataTypes.INTEGER
    },
    packageId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
    indexes: [
        { fields: ['Username'] },
        { fields: ['packageId'] }
    ]
});

// Create table if it doesn't exist
donations.sync({ alter: true }).then(() => {
    console.log('Donations table created or updated successfully');
}).catch((error) => {
    console.error('Error creating donations table:', error);
});

export { donations }
