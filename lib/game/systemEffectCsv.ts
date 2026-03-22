import { parseCsv } from './itemEnchantCsv';

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Load `table_system_effect_data_rows.csv` from public — maps `tblidx` → `wszName`
 * (join key for enchant `seTblidx`).
 */
export function parseSystemEffectNameMapFromCsv(text: string): Map<number, string> {
    const grid = parseCsv(text.trim());
    if (grid.length < 2) {
        return new Map();
    }
    const header = grid[0].map(normalizeHeader);
    const iTbl = header.indexOf('tblidx');
    const iName = header.indexOf('wszname');
    if (iTbl < 0 || iName < 0) {
        throw new Error('table_system_effect_data_rows.csv: missing tblidx or wszName column.');
    }

    const map = new Map<number, string>();
    for (let r = 1; r < grid.length; r++) {
        const line = grid[r];
        if (line.every((c) => c.trim() === '')) {
            continue;
        }
        const tbl = parseInt(line[iTbl]?.trim() ?? '', 10);
        const name = (line[iName] ?? '').trim();
        if (Number.isFinite(tbl) && name) {
            map.set(tbl, name);
        }
    }
    return map;
}

export async function fetchSystemEffectNameMap(url = '/table_system_effect_data_rows.csv'): Promise<Map<number, string>> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load ${url}: ${res.status}`);
    }
    const text = await res.text();
    return parseSystemEffectNameMapFromCsv(text);
}
