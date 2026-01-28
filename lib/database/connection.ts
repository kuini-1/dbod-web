import { Sequelize } from "sequelize";

export const dbod_acc = new Sequelize(
    process.env.DB_ACC_NAME || 'dbo_acc',
    process.env.DB_ACC_USER || 'root',
    process.env.DB_ACC_PASSWORD || '123456',
    {
        host: process.env.DB_ACC_HOST || 'localhost',
        logging: false,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export const dbod_char = new Sequelize(
    process.env.DB_CHAR_NAME || 'dbo_char',
    process.env.DB_CHAR_USER || 'root',
    process.env.DB_CHAR_PASSWORD || '123456',
    {
        host: process.env.DB_CHAR_HOST || 'localhost',
        logging: false,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);
