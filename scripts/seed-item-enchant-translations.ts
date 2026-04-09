import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import type { Sequelize } from 'sequelize';
import type item_enchant_translations from '../lib/models/item_enchant_translations';

type SupabaseEnchantRow = {
    tblidx: number;
    wszName: string;
};

function loadEnvFiles() {
    const cwd = process.cwd();
    const candidates = ['.env.local', '.env'];
    for (const file of candidates) {
        const fullPath = path.join(cwd, file);
        if (existsSync(fullPath)) {
            dotenv.config({ path: fullPath, override: false });
        }
    }
}

function getSupabaseConfig() {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!url || !key) {
        throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    return { url, key };
}

async function fetchSupabaseEnchantNames(): Promise<SupabaseEnchantRow[]> {
    const { url, key } = getSupabaseConfig();
    const params = new URLSearchParams({
        select: 'tblidx,wszName',
        order: 'tblidx.asc',
        limit: '10000',
    });
    const endpoint = `${url}/rest/v1/table_item_enchant_data?${params.toString()}`;
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch table_item_enchant_data (${response.status}): ${text}`);
    }
    return (await response.json()) as SupabaseEnchantRow[];
}

async function seed() {
    loadEnvFiles();

    let dbod_acc: Sequelize | null = null;
    try {
        // IMPORTANT: load env first, then import modules that read process.env at import time.
        ({ dbod_acc } = await import('../lib/database/connection'));
        const { default: itemEnchantTranslations } = await import('../lib/models/item_enchant_translations');

        await dbod_acc.authenticate();
        await itemEnchantTranslations.sync();

        const sourceRows = await fetchSupabaseEnchantNames();
        const deduped = new Map<number, string>();
        let skipped = 0;

        for (const row of sourceRows) {
            const tblidx = Number(row.tblidx);
            const wszName = String(row.wszName ?? '').trim();
            if (!Number.isFinite(tblidx) || !wszName) {
                skipped++;
                continue;
            }
            if (!deduped.has(Math.trunc(tblidx))) {
                deduped.set(Math.trunc(tblidx), wszName);
            }
        }

        const rows = [...deduped.entries()].map(([tblidx, wszName_en]) => ({
            tblidx,
            wszName_en,
            wszName_kr: null as string | null,
        }));

        if (rows.length === 0) {
            console.log('No valid source rows found. Nothing to seed.');
            return;
        }

        const existing = await itemEnchantTranslations.count();
        await itemEnchantTranslations.bulkCreate(rows, {
            updateOnDuplicate: ['wszName_en'],
        });
        const totalAfter = await itemEnchantTranslations.count();
        const inserted = Math.max(0, totalAfter - existing);
        const updated = Math.max(0, rows.length - inserted);

        console.log('Seed complete:');
        const [dbNameRows] = await dbod_acc.query('SELECT DATABASE() AS db');
        console.log(`- Target DB: ${(dbNameRows as { db?: string }[])[0]?.db ?? 'unknown'}`);
        console.log(`- Source rows read: ${sourceRows.length}`);
        console.log(`- Valid unique rows: ${rows.length}`);
        console.log(`- Inserted: ${inserted}`);
        console.log(`- Updated: ${updated}`);
        console.log(`- Skipped (invalid/empty): ${skipped}`);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    } finally {
        if (dbod_acc) {
            await dbod_acc.close();
        }
    }
}

seed();
