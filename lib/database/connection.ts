import { Sequelize } from "sequelize";

const accDbName = process.env.DB_ACC_NAME || 'dbo_acc';
const accDbUser = process.env.DB_ACC_USER || 'root';
const accDbPassword = process.env.DB_ACC_PASSWORD || '123456';
const accDbHost = process.env.DB_ACC_HOST || 'localhost';

const charDbName = process.env.DB_CHAR_NAME || 'dbo_char';
const charDbUser = process.env.DB_CHAR_USER || 'root';
const charDbPassword = process.env.DB_CHAR_PASSWORD || '123456';
const charDbHost = process.env.DB_CHAR_HOST || 'localhost';

export const dbod_acc = new Sequelize(
    accDbName,
    accDbUser,
    accDbPassword,
    {
        host: accDbHost,
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
    charDbName,
    charDbUser,
    charDbPassword,
    {
        host: charDbHost,
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
