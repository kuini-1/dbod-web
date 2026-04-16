import { dbod_acc } from './connection';
import { accounts, event_reward, vip_reward } from '../models/accounts';
import { donation_tiers } from '../models/donation_tiers';
import { donation_tier_items } from '../models/donation_tier_items';
import { slot_machine_items } from '../models/slot_machine_items';
import { donation_tier_claims } from '../models/donation_tier_claims';
import popup_banners from '../models/popup_banners';
import popup_banner_items from '../models/popup_banner_items';
import { packages } from '../models/packages';
import items from '../models/items';
import { donations } from '../models/donations';
import { daily_rewards, daily_reward_claims, daily_checkin_passes } from '../models/daily_rewards';
import {
    event_daily_login_events,
    event_daily_login_rewards,
    event_daily_login_claims,
} from '../models/event_daily_login';
import {
    event_levelup_events,
    event_levelup_rewards,
    event_levelup_claims,
} from '../models/event_levelup';
import cashshop_storage from '../models/cashshop_storage';
import { server_status } from '../models/server_status';
import { characters } from '../models/characters';
import { Raffle, RaffleEntry, RaffleWinner } from '../models/raffle';
import { news_posts } from '../models/news_posts';
import { news_post_items } from '../models/news_post_items';
import { news_post_claims } from '../models/news_post_claims';
import item_enchant_translations from '../models/item_enchant_translations';
import type { ModelStatic, Model } from 'sequelize';

const SEED_PACKAGES = [
    { price: 5, cashPoints: 50, isForDonation: 1, sortOrder: 1, name: '$5 Package' },
    { price: 10, cashPoints: 105, isForDonation: 1, sortOrder: 2, name: '$10 Package' },
    { price: 25, cashPoints: 275, isForDonation: 1, sortOrder: 3, name: '$25 Package' },
    { price: 50, cashPoints: 575, isForDonation: 1, sortOrder: 4, name: '$50 Package' },
    { price: 80, cashPoints: 960, isForDonation: 1, sortOrder: 5, name: '$80 Package' },
    { price: 100, cashPoints: 1250, isForDonation: 1, sortOrder: 6, name: '$100 Package' },
];

function physicalColumnName(attribute: unknown, attributeKey: string): string {
    const field = (attribute as { field?: string })?.field;
    return field && String(field).trim() ? String(field) : attributeKey;
}

function tableHasColumnInsensitive(
    existingColumns: Record<string, unknown>,
    dbColumnName: string
): boolean {
    const target = dbColumnName.toLowerCase();
    return Object.keys(existingColumns).some((k) => k.toLowerCase() === target);
}

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
    for (const [attributeKey, attribute] of Object.entries(rawAttributes)) {
        const dbColumnName = physicalColumnName(attribute, attributeKey);
        if (tableHasColumnInsensitive(existingColumns, dbColumnName)) {
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

        try {
            await qi.addColumn(tableName, dbColumnName, safeAttribute as any);
            console.log(`Added missing column ${tableName}.${dbColumnName}`);
        } catch (err: unknown) {
            const code = (err as { parent?: { errno?: number } })?.parent?.errno;
            if (code === 1060) {
                console.warn(
                    `[DB sync] Skipped addColumn ${tableName}.${dbColumnName} (duplicate field; likely already present).`
                );
                continue;
            }
            throw err;
        }
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
        syncModelAdditiveOnly(slot_machine_items),
    ]);
    console.log('Donation tier items and claims tables synced');
    console.log('Slot machine items table synced');

    await Promise.all([
        syncModelAdditiveOnly(news_posts),
        syncModelAdditiveOnly(news_post_items),
        syncModelAdditiveOnly(news_post_claims),
    ]);
    console.log('News posts, items, and claims tables synced');

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
        syncModelAdditiveOnly(item_enchant_translations),
        syncModelAdditiveOnly(donations),
        syncModelAdditiveOnly(daily_rewards),
        syncModelAdditiveOnly(daily_reward_claims),
        syncModelAdditiveOnly(daily_checkin_passes),
        syncModelAdditiveOnly(event_daily_login_events),
        syncModelAdditiveOnly(event_daily_login_rewards),
        syncModelAdditiveOnly(event_daily_login_claims),
        syncModelAdditiveOnly(event_levelup_events),
        syncModelAdditiveOnly(event_levelup_rewards),
        syncModelAdditiveOnly(event_levelup_claims),
        syncModelAdditiveOnly(cashshop_storage),
        syncModelAdditiveOnly(server_status),
    ]);
    console.log('Items, donations, daily rewards, daily checkin pass, cashshop storage, server status synced');

    await syncModelAdditiveOnly(Raffle);
    await syncModelAdditiveOnly(RaffleEntry);
    await syncModelAdditiveOnly(RaffleWinner);
    console.log('Raffle tables synced');

    await syncModelAdditiveOnly(characters);
    console.log('Characters table (dbo_char) synced');
}
