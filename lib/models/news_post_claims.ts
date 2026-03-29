import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

interface NewsPostClaimAttributes {
    id: number;
    AccountID: number;
    newsPostId: number;
    claimedAt: Date;
}

export type NewsPostClaimCreationAttributes = Optional<NewsPostClaimAttributes, "id">;

class news_post_claims extends Model<NewsPostClaimAttributes, NewsPostClaimCreationAttributes>
    implements NewsPostClaimAttributes
{
    public id!: number;
    public AccountID!: number;
    public newsPostId!: number;
    public claimedAt!: Date;
}

news_post_claims.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        AccountID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        newsPostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        claimedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        timestamps: false,
        sequelize: dbod_acc,
        tableName: "news_post_claims",
        indexes: [
            { unique: true, fields: ["AccountID", "newsPostId"] },
            { fields: ["AccountID"] },
            { fields: ["newsPostId"] },
        ],
    }
);

export { news_post_claims };
