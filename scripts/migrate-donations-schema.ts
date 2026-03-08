/**
 * One-time migration: Convert legacy donation Value from cents to dollars.
 * Run once after deploying the new donations schema.
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-donations-schema.ts
 *
 * Or with tsx: npx tsx scripts/migrate-donations-schema.ts
 */
import { dbod_acc } from '../lib/database/connection';

async function migrate() {
    try {
        await dbod_acc.authenticate();
        console.log('Connected to database.');

        // Legacy rows have packageId IS NULL and Value was stored in cents.
        // Convert Value from cents to dollars (divide by 100).
        const [results] = await dbod_acc.query(
            `UPDATE donations SET Value = Value / 100 WHERE packageId IS NULL AND Value > 0`
        );
        const affected = (results as any)?.affectedRows ?? 0;
        console.log(`Migrated ${affected} legacy donation rows (Value: cents -> dollars).`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
