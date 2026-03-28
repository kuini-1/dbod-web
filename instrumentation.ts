declare global {
    var __dbodSyncPromise: Promise<void> | undefined;
}

export async function register() {
    // Run DB additive sync once at startup in Node runtime.
    // This recreates missing tables/columns (e.g. after manual table deletion).
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;
    if (process.env.DB_AUTO_SYNC === '0') return;

    if (!globalThis.__dbodSyncPromise) {
        globalThis.__dbodSyncPromise = (async () => {
            try {
                // Use indirect dynamic import to prevent bundlers from resolving
                // Sequelize/MySQL modules into non-Node builds.
                const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>;
                const { syncAll } = await dynamicImport('./lib/database/sync-all');
                await syncAll();
                console.log('[DB] startup additive sync complete');
            } catch (error) {
                console.error('[DB] startup additive sync failed:', error);
            }
        })();
    }

    await globalThis.__dbodSyncPromise;
}
