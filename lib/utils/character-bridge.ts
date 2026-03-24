import { characters } from '../models/characters';

const bridgeUrl = process.env.WEB_BRIDGE_URL || 'http://127.0.0.1:8080';
const apiKey = process.env.WEB_BRIDGE_API_KEY || '';

function bridgeHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
}

/**
 * POST a JSON body to a web-bridge API path.
 */
export async function postToBridge(path: string, body: object): Promise<Response> {
    return fetch(`${bridgeUrl}${path}`, {
        method: 'POST',
        headers: bridgeHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store'
    });
}

/**
 * Update CCBD_Entry in DB and notify web-bridge.
 */
export async function syncCCBDEntry(charId: number, value: number): Promise<void> {
    await characters.update({ CCBD_Entry: value }, { where: { CharID: charId } });
    try {
        const res = await postToBridge('/api/update-ccbd-entry', { CharID: charId, CCBD_Entry: value });
        if (!res.ok) {
            console.error('Bridge update-ccbd-entry failed:', res.status, await res.text());
        }
    } catch (err) {
        console.error('Bridge update-ccbd-entry error:', err);
    }
}

/**
 * Update Item_Worth in DB and notify web-bridge.
 */
const ITEM_WORTH_MAX = 65535;

export async function syncItemWorth(charId: number, value: number): Promise<void> {
    const clamped = Math.max(0, Math.min(ITEM_WORTH_MAX, Math.floor(Number(value))));
    await characters.update({ Item_Worth: clamped }, { where: { CharID: charId } });
    try {
        const res = await postToBridge('/api/update-item-worth', { CharID: charId, Item_Worth: clamped });
        if (!res.ok) {
            console.error('Bridge update-item-worth failed:', res.status, await res.text());
        }
    } catch (err) {
        console.error('Bridge update-item-worth error:', err);
    }
}
