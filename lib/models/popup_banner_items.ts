import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface PopupBannerItemAttributes {
    id: number;
    bannerId: number;
    tblidx: number;
    amount: number;
    sortOrder?: number | null;
}

export interface PopupBannerItemInput extends Optional<PopupBannerItemAttributes, 'id' | 'sortOrder'> {}
export interface PopupBannerItemOutput extends Required<PopupBannerItemAttributes> {}

class popup_banner_items extends Model<PopupBannerItemAttributes, PopupBannerItemInput> implements PopupBannerItemAttributes {
    public id!: number;
    public bannerId!: number;
    public tblidx!: number;
    public amount!: number;
    public sortOrder!: number | null;
}

popup_banner_items.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    bannerId: {
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
});

// Create table if it doesn't exist
popup_banner_items.sync({ alter: true }).then(() => {
    console.log('Popup banner items table created or updated successfully');
}).catch((error) => {
    console.error('Error creating popup banner items table:', error);
});

export default popup_banner_items;

