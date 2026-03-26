/**
 * Instrumentation runs in both Node and Edge builds. DB sync must live in a Node-only module
 * so the Edge bundle never tries to bundle Sequelize (uses `fs`, `crypto`, etc.).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'edge') {
        return;
    }

    // `require` here matches Next’s Node/Edge split so `instrumentation.node` stays out of Edge bundles.
    const { registerNode } = require('./instrumentation.node') as typeof import('./instrumentation.node');
    await registerNode();
}
