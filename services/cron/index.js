// Separate cron service for raffle and server status updates
// This should run as a separate Node.js process

require('dotenv').config();
const cron = require('node-cron');
const { Sequelize, DataTypes } = require('sequelize');

// Database connection
const dbod_acc = new Sequelize(
    process.env.DB_ACC_NAME || 'dbo_acc',
    process.env.DB_ACC_USER || 'root',
    process.env.DB_ACC_PASSWORD || '123456',
    {
        host: process.env.DB_ACC_HOST || 'localhost',
        logging: false,
        dialect: 'mysql'
    }
);

// Raffle models (simplified - should match main app models)
const Raffle = dbod_acc.define('raffle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    currentPot: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    timeLeft: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, {
    tableName: 'raffles',
    timestamps: true,
    freezeTableName: true
});

// Helper function to calculate time until next 21:40
const getTimeUntilNextRaffle = () => {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(21, 40, 0, 0);
    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    return Math.floor((targetTime.getTime() - now.getTime()) / 1000);
};

// Raffle timer - runs every minute
cron.schedule('* * * * *', async () => {
    try {
        const activeRaffle = await Raffle.findOne({
            where: { isActive: true }
        });

        if (!activeRaffle) {
            const timeLeft = getTimeUntilNextRaffle();
            await Raffle.create({
                currentPot: 100,
                isActive: true,
                timeLeft
            });
        } else {
            const timeLeft = getTimeUntilNextRaffle();
            await activeRaffle.update({ timeLeft });
        }
    } catch (error) {
        console.error('Error updating raffle timer:', error);
    }
});

// Daily raffle creation at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        await Raffle.update(
            { isActive: false },
            { where: { isActive: true } }
        );

        const timeLeft = getTimeUntilNextRaffle();
        await Raffle.create({
            currentPot: 100,
            isActive: true,
            timeLeft
        });

        console.log('Created new daily raffle');
    } catch (error) {
        console.error('Error creating new raffle:', error);
    }
});

console.log('Cron service started');
