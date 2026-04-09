import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface ItemEnchantTranslationAttributes {
    id: number;
    tblidx: number;
    wszName_en: string;
    wszName_kr?: string | null;
}

export type ItemEnchantTranslationCreationAttributes = Optional<
    ItemEnchantTranslationAttributes,
    "id" | "wszName_kr"
>;

class item_enchant_translations
    extends Model<ItemEnchantTranslationAttributes, ItemEnchantTranslationCreationAttributes>
    implements ItemEnchantTranslationAttributes
{
    public id!: number;
    public tblidx!: number;
    public wszName_en!: string;
    public wszName_kr!: string | null;
}

item_enchant_translations.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        tblidx: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            unique: true,
        },
        wszName_en: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        wszName_kr: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        tableName: "item_enchant_translations",
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
        indexes: [{ unique: true, fields: ["tblidx"] }],
    }
);

export default item_enchant_translations;
