import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface SlotMachineItemAttributes {
    id: number;
    tblidx: number;
    amount: number;
    feq: number;
}

export type SlotMachineItemCreationAttributes = Optional<SlotMachineItemAttributes, "id">;

class slot_machine_items extends Model<SlotMachineItemAttributes, SlotMachineItemCreationAttributes>
    implements SlotMachineItemAttributes
{
    public id!: number;
    public tblidx!: number;
    public amount!: number;
    public feq!: number;
}

slot_machine_items.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        tblidx: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        feq: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
        tableName: "slot_machine_items",
    }
);

export { slot_machine_items };
