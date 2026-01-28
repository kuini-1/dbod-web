import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface DonationsAttributes {
    ID: number,
    Username?: string;
    OrderID?: string;
    email?: string;
    Value?: string;
    mallpoints?: string;
}
export interface DonationsInput extends Optional<DonationsAttributes, 'ID'> {}
export interface DonationsOuput extends Required<DonationsAttributes> {}

class donations extends Model<DonationsAttributes, DonationsInput> implements DonationsAttributes {
    public ID!: number
    public Username!: string
    public OrderID!: string
    public email!: string
    public Value!: string
    public mallpoints!: string
}
  
donations.init({
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING,
    },
    OrderID: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING
    },
    Value: {
        type: DataTypes.STRING
    },
    mallpoints: {
        type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
})

// Create table if it doesn't exist
donations.sync({ alter: true }).then(() => {
    console.log('Donations table created or updated successfully');
}).catch((error) => {
    console.error('Error creating donations table:', error);
});

export { donations }
