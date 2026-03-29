import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export interface NewsPostItemAttributes {
    id: number;
    newsPostId: number;
    tblidx: number;
    amount: number;
    sortOrder: number | null;
}

export type NewsPostItemCreationAttributes = Optional<NewsPostItemAttributes, "id" | "sortOrder">;

class news_post_items extends Model<NewsPostItemAttributes, NewsPostItemCreationAttributes>
    implements NewsPostItemAttributes
{
    public id!: number;
    public newsPostId!: number;
    public tblidx!: number;
    public amount!: number;
    public sortOrder!: number | null;
}

news_post_items.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        newsPostId: {
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
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
        tableName: "news_post_items",
        indexes: [{ fields: ["newsPostId"] }],
    }
);

export { news_post_items };
