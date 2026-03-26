import { dbod_acc } from './connection';
import { accounts, event_reward, vip_reward } from '../models/accounts';
import { donation_tiers } from '../models/donation_tiers';
import { donation_tier_items } from '../models/donation_tier_items';
import { donation_tier_claims } from '../models/donation_tier_claims';
import popup_banners from '../models/popup_banners';
import popup_banner_items from '../models/popup_banner_items';
import { packages } from '../models/packages';
import items from '../models/items';
import { donations } from '../models/donations';
import { daily_rewards, daily_reward_claims } from '../models/daily_rewards';
import { daily_logins } from '../models/daily_logins';
import cashshop_storage from '../models/cashshop_storage';
import { server_status } from '../models/server_status';
import { characters } from '../models/characters';
import { Raffle, RaffleEntry, RaffleWinner } from '../models/raffle';
import type { ModelStatic, Model } from 'sequelize';

const SEED_PACKAGES = [
    { price: 5, cashPoints: 50, isForDonation: 1, sortOrder: 1, name: '$5 Package' },
    { price: 10, cashPoints: 105, isForDonation: 1, sortOrder: 2, name: '$10 Package' },
    { price: 25, cashPoints: 275, isForDonation: 1, sortOrder: 3, name: '$25 Package' },
    { price: 50, cashPoints: 575, isForDonation: 1, sortOrder: 4, name: '$50 Package' },
    { price: 80, cashPoints: 960, isForDonation: 1, sortOrder: 5, name: '$80 Package' },
    { price: 100, cashPoints: 1250, isForDonation: 1, sortOrder: 6, name: '$100 Package' },
];

async function syncModelAdditiveOnly(model: ModelStatic<Model<any, any>>) {
    const sequelize = model.sequelize ?? dbod_acc;
    const qi = sequelize.getQueryInterface();
    const tableName = model.getTableName() as string;

    let existingColumns: Record<string, unknown> | null = null;
    try {
        existingColumns = await qi.describeTable(tableName);
    } catch {
        existingColumns = null;
    }

    if (!existingColumns) {
        await model.sync();
        console.log(`${tableName} table created`);
        return;
    }

    const rawAttributes = model.getAttributes();
    for (const [columnName, attribute] of Object.entries(rawAttributes)) {
        if (Object.prototype.hasOwnProperty.call(existingColumns, columnName)) {
            continue;
        }

        // Additive-only sync: never mutate existing columns, keys, or constraints.
        // For new columns, avoid forcing PK/auto-increment/index creation during runtime.
        const safeAttribute: Record<string, unknown> = {
            ...(attribute as unknown as Record<string, unknown>),
            primaryKey: false,
            unique: false,
            autoIncrement: false,
        };

        await qi.addColumn(tableName, columnName, safeAttribute as any);
        console.log(`Added missing column ${tableName}.${columnName}`);
    }
}

/**
 * Additive-only sync for app tables:
 * - creates missing tables
 * - adds missing columns
 * - never removes or alters existing columns/data
 */
export async function syncAll() {
    await syncModelAdditiveOnly(donation_tiers);
    console.log('Donation tiers table synced successfully');

    await Promise.all([
        syncModelAdditiveOnly(donation_tier_items),
        syncModelAdditiveOnly(donation_tier_claims),
    ]);
    console.log('Donation tier items and claims tables synced');

    await syncModelAdditiveOnly(popup_banners);
    console.log('Popup banners table created or updated successfully');

    await syncModelAdditiveOnly(popup_banner_items);
    console.log('Popup banner items table created or updated successfully');

    await syncModelAdditiveOnly(packages);
    const packageCount = await packages.count();
    if (packageCount === 0) {
        await packages.bulkCreate(SEED_PACKAGES as any);
        console.log('Packages table seeded with 6 donation packages');
    } else {
        console.log('Packages table already has data, skipping seed');
    }

    await Promise.all([
        syncModelAdditiveOnly(accounts),
        syncModelAdditiveOnly(event_reward),
        syncModelAdditiveOnly(vip_reward),
    ]);
    console.log('Account-related tables created or updated successfully');

    await Promise.all([
        syncModelAdditiveOnly(items),
        syncModelAdditiveOnly(donations),
        syncModelAdditiveOnly(daily_rewards),
        syncModelAdditiveOnly(daily_reward_claims),
        syncModelAdditiveOnly(daily_logins),
        syncModelAdditiveOnly(cashshop_storage),
        syncModelAdditiveOnly(server_status),
    ]);
    console.log('Items, donations, daily rewards, daily logins, cashshop storage, server status synced');

    await syncModelAdditiveOnly(Raffle);
    await syncModelAdditiveOnly(RaffleEntry);
    await syncModelAdditiveOnly(RaffleWinner);
    console.log('Raffle tables synced');

    await syncModelAdditiveOnly(characters);
    console.log('Characters table (dbo_char) synced');
}
