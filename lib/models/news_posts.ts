import { DataTypes, Model, Optional } from "sequelize";
import { dbod_acc } from "../database/connection";

export type NewsCategory = "info" | "events";

export interface NewsPostAttributes {
    id: number;
    category: NewsCategory;
    title_en: string;
    title_kr: string;
    body_md_en: string;
    body_md_kr: string;
    image_url: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type NewsPostCreationAttributes = Optional<
    NewsPostAttributes,
    "id" | "image_url" | "active" | "createdAt" | "updatedAt"
>;

class news_posts extends Model<NewsPostAttributes, NewsPostCreationAttributes> implements NewsPostAttributes {
    public id!: number;
    public category!: NewsCategory;
    public title_en!: string;
    public title_kr!: string;
    public body_md_en!: string;
    public body_md_kr!: string;
    public image_url!: string | null;
    public active!: boolean;
    public createdAt!: Date;
    public updatedAt!: Date;
}

news_posts.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        category: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
        title_en: {
            type: DataTypes.STRING(512),
            allowNull: false,
        },
        title_kr: {
            type: DataTypes.STRING(512),
            allowNull: false,
        },
        body_md_en: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        body_md_kr: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
        },
        image_url: {
            type: DataTypes.STRING(1024),
            allowNull: true,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        sequelize: dbod_acc,
        tableName: "news_posts",
    }
);

export { news_posts };
