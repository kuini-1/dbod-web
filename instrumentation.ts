declare global {
    var __dbodSyncPromise: Promise<void> | undefined;
}

/** Whether to run additive DB sync on Node server boot (creates missing tables/columns). */
function isDbSyncOnBootEnabled(): boolean {
    const boot = process.env.DB_SYNC_ON_BOOT?.trim();
    if (boot !== undefined && boot !== '') {
        const v = boot.toLowerCase();
        if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
        if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
        // Unrecognized explicit value: fall through to legacy flag
    }
    // Legacy: default on unless explicitly disabled
    return process.env.DB_AUTO_SYNC !== '0';
}

function dbSyncOnBootSkipReason(): string {
    const boot = process.env.DB_SYNC_ON_BOOT?.trim();
    if (boot !== undefined && boot !== '') {
        const v = boot.toLowerCase();
        if (v === '0' || v === 'false' || v === 'no' || v === 'off') {
            return 'DB_SYNC_ON_BOOT disables sync';
        }
    }
    if (process.env.DB_AUTO_SYNC === '0') {
        return 'DB_AUTO_SYNC=0 (set DB_SYNC_ON_BOOT=1 to force sync on boot)';
    }
    return 'sync disabled';
}

export async function register() {
    // Run DB additive sync once at startup in Node runtime.
    // This recreates missing tables/columns (e.g. after manual table deletion).
    if (process.env.NEXT_RUNTIME !== 'nodejs') {
        return;
    }
    if (!isDbSyncOnBootEnabled()) {
        console.log(`[DB] startup sync skipped: ${dbSyncOnBootSkipReason()}`);
        return;
    }

    if (!globalThis.__dbodSyncPromise) {
        globalThis.__dbodSyncPromise = (async () => {
            try {
                // Do not use a static `import()` here: webpack would bundle Sequelize into the
                // instrumentation graph and fail on Node built-ins (`fs`, `crypto`, `path`).
                // This indirect import is resolved only at runtime in Node.
                // Ship `./lib/**` in standalone via `outputFileTracingIncludes` in next.config.mjs.
                const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<{ syncAll: () => Promise<void> }>;
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
