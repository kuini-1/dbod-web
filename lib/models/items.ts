import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface ItemAttributes {
    tblidx: number; // Game item ID
    name_en: string;
    name_kr?: string | null;
    iconFile?: string | null; // filename in /public/event icons/
}

export type ItemCreationAttributes = Optional<ItemAttributes, 'name_kr' | 'iconFile'>;

class items extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
    public tblidx!: number;
    public name_en!: string;
    public name_kr!: string | null;
    public iconFile!: string | null;
}

items.init({
    tblidx: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    name_en: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name_kr: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    iconFile: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
}, {
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
});

// Create table if it doesn't exist
items.sync({ alter: true }).then(() => {
    console.log('Items table created or updated successfully');
}).catch((error) => {
    console.error('Error creating items table:', error);
});

export default items;

