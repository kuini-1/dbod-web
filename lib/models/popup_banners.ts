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
    freezeTableName: true,
    timestamps: false,
    sequelize: dbod_acc,
});

// Create table if it doesn't exist
// Also drop deprecated columns `content_en`, `content_kr`, `imageUrl` if they exist.
(async () => {
    try {
        const qi = dbod_acc.getQueryInterface();
        for (const col of ['content_en', 'content_kr', 'imageUrl']) {
            try {
                await qi.removeColumn('popup_banners', col);
                console.log(`Dropped deprecated popup_banners.${col} column`);
            } catch (e) {
                // Column may not exist; ignore.
            }
        }

        await popup_banners.sync({ alter: true });
        console.log('Popup banners table created or updated successfully');
    } catch (error) {
        console.error('Error creating popup banners table:', error);
    }
})();

export default popup_banners;
