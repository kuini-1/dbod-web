export async function register() {
    // Avoid runtime schema mutations in production deploys.
    // In production, DB migrations should be run explicitly, not during app boot.
    const shouldSyncOnBoot =
        process.env.NEXT_RUNTIME === 'nodejs' &&
        process.env.NODE_ENV !== 'production' &&
        process.env.DB_SYNC_ON_BOOT === 'true';

    if (shouldSyncOnBoot) {
        const { syncAll } = await import('./lib/database/sync-all');
        await syncAll();
    }
}
