/**
 * Node-only instrumentation (Sequelize / mysql). Loaded only when `NEXT_RUNTIME !== 'edge'`.
 */
export async function registerNode() {
    const shouldSyncOnBoot =
        process.env.NODE_ENV !== 'production' && process.env.DB_SYNC_ON_BOOT === 'true';

    if (!shouldSyncOnBoot) {
        return;
    }

    const { syncAll } = await import('./lib/database/sync-all');
    await syncAll();
}
