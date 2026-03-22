export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { syncAll } = await import('./lib/database/sync-all');
        await syncAll();
    }
}
