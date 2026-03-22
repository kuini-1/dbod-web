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

const SEED_PACKAGES = [
    { price: 5, cashPoints: 50, isForDonation: 1, sortOrder: 1, name: '$5 Package' },
    { price: 10, cashPoints: 105, isForDonation: 1, sortOrder: 2, name: '$10 Package' },
    { price: 25, cashPoints: 275, isForDonation: 1, sortOrder: 3, name: '$25 Package' },
    { price: 50, cashPoints: 575, isForDonation: 1, sortOrder: 4, name: '$50 Package' },
    { price: 80, cashPoints: 960, isForDonation: 1, sortOrder: 5, name: '$80 Package' },
    { price: 100, cashPoints: 1250, isForDonation: 1, sortOrder: 6, name: '$100 Package' },
];

async function tryRemoveColumn(table: string, column: string, label: string) {
    const qi = dbod_acc.getQueryInterface();
    try {
        await qi.removeColumn(table, column);
        console.log(`Dropped deprecated ${label}`);
    } catch {
        // Column may not exist
    }
}

/**
 * Runs migrations and sequelize.sync({ alter: true }) for all web DB models once at server startup.
 */
export async function syncAll() {
    await tryRemoveColumn('donation_tiers', 'rewards', 'donation_tiers.rewards column');
    await donation_tiers.sync({ alter: true });
    console.log('Donation tiers table synced successfully');

    await Promise.all([
        donation_tier_items.sync({ alter: true }),
        donation_tier_claims.sync({ alter: true }),
    ]);
    console.log('Donation tier items and claims tables synced');

    for (const col of ['content_en', 'content_kr', 'imageUrl']) {
        await tryRemoveColumn('popup_banners', col, `popup_banners.${col} column`);
    }
    await popup_banners.sync({ alter: true });
    console.log('Popup banners table created or updated successfully');

    await popup_banner_items.sync({ alter: true });
    console.log('Popup banner items table created or updated successfully');

    await packages.sync({ alter: true });
    const packageCount = await packages.count();
    if (packageCount === 0) {
        await packages.bulkCreate(SEED_PACKAGES as any);
        console.log('Packages table seeded with 6 donation packages');
    } else {
        console.log('Packages table already has data, skipping seed');
    }

    await Promise.all([
        accounts.sync({ alter: true }),
        event_reward.sync({ alter: true }),
        vip_reward.sync({ alter: true }),
    ]);
    console.log('Account-related tables created or updated successfully');

    await Promise.all([
        items.sync({ alter: true }),
        donations.sync({ alter: true }),
        daily_rewards.sync({ alter: true }),
        daily_reward_claims.sync({ alter: true }),
        daily_logins.sync({ alter: true }),
        cashshop_storage.sync({ alter: true }),
        server_status.sync({ alter: true }),
    ]);
    console.log('Items, donations, daily rewards, daily logins, cashshop storage, server status synced');

    await Raffle.sync({ alter: true });
    await RaffleEntry.sync({ alter: true });
    await RaffleWinner.sync({ alter: true });
    console.log('Raffle tables synced');

    await characters.sync({ alter: true });
    console.log('Characters table (dbo_char) synced');
}
