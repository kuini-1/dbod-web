import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface PopupBannerAttributes {
    id: number;
    title_en: string;
    title_kr: string;
    active: boolean;
    price?: number; // Price in USD
    packageId?: number; // Optional package ID for backward compatibility
    cashPoints?: number; // Cash points included in this banner
}

export interface PopupBannerInput extends Optional<PopupBannerAttributes, 'id'> {}
export interface PopupBannerOutput extends Required<PopupBannerAttributes> {}

class popup_banners extends Model<PopupBannerAttributes, PopupBannerInput> implements PopupBannerAttributes {
    public id!: number;
    public title_en!: string;
    public title_kr!: string;
    public active!: boolean;
    public price?: number;
    public packageId?: number;
    public cashPoints?: number;
}

popup_banners.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title_en: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title_kr: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    packageId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cashPoints: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'popup_banners',
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
});

export default popup_banners;
