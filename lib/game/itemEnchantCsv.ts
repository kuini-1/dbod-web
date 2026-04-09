import {
    ITEM_RANK_EXCELLENT,
    ITEM_RANK_LEGENDARY,
    ITEM_RANK_RARE,
    ITEM_RANK_SUPERIOR,
} from './dboItemWorth';

/** Matches `sITEM_ENCHANT_TBLDAT` (ItemEnchantTable.h) + optional `name` for UI. */
export type ItemEnchantRow = {
    tblidx: number;
    seTblidx: number;
    byExclIdx: number;
    byMinLevel: number;
    byMaxLevel: number;
    byFrequency: number;
    wEnchant_Value: number;
    byKind: number;
    dwEquip: number;
    byGroupNo: number;
    wMaxValue: number;
    bIsSuperior: boolean;
    bIsExcellent: boolean;
    bIsRare: boolean;
    bIsLegendary: boolean;
    name: string;
};

export type ItemEnchantTranslationNames = {
    en: string;
    kr: string;
};

const INVALID_BYTE = 255;

function parseBool(v: string): boolean {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
}

function parseIntField(v: string, def: number): number {
    const n = parseInt(v.trim(), 10);
    return Number.isFinite(n) ? n : def;
}

/** Minimal CSV parser: commas, quoted fields, CRLF/LF. */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQ) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQ = false;
                }
            } else {
                cur += c;
            }
        } else {
            if (c === '"') {
                inQ = true;
            } else if (c === ',') {
                row.push(cur);
                cur = '';
            } else if (c === '\n') {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = '';
            } else if (c === '\r') {
                /* skip */
            } else {
                cur += c;
            }
        }
    }
    row.push(cur);
    if (row.length > 1 || row[0] !== '') {
        rows.push(row);
    }
    return rows;
}

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase().replace(/\s+/g, '_');
}

export function parseItemEnchantRowsFromCsv(text: string): ItemEnchantRow[] {
    const grid = parseCsv(text.trim());
    if (grid.length < 2) {
        return [];
    }
    const header = grid[0].map(normalizeHeader);
    const idx = (name: string) => header.indexOf(name);

    const col = {
        tblidx: idx('tblidx'),
        seTblidx: idx('setblidx'),
        byExclIdx: idx('byexclidx'),
        byMinLevel: idx('byminlevel'),
        byMaxLevel: idx('bymaxlevel'),
        byFrequency: idx('byfrequency'),
        wEnchant_Value: idx('wenchant_value'),
        byKind: idx('bykind'),
        dwEquip: idx('dwequip'),
        byGroupNo: idx('bygroupno'),
        wMaxValue: idx('wmaxvalue'),
        bIsSuperior: idx('bissuperior'),
        bIsExcellent: idx('bisexcellent'),
        bIsRare: idx('bisrare'),
        bIsLegendary: idx('bislegendary'),
        name: idx('name'),
    };

    if (col.tblidx < 0 || col.wEnchant_Value < 0) {
        throw new Error('table_item_enchant_data_rows.csv: missing required columns (tblidx, wEnchant_Value).');
    }

    const out: ItemEnchantRow[] = [];
    for (let r = 1; r < grid.length; r++) {
        const line = grid[r];
        if (line.every((c) => c.trim() === '')) {
            continue;
        }

        const get = (i: number, def = '') => (i >= 0 && i < line.length ? line[i] : def);

        const byMaxLevel =
            col.byMaxLevel >= 0 ? parseIntField(get(col.byMaxLevel), INVALID_BYTE) : INVALID_BYTE;

        out.push({
            tblidx: parseIntField(get(col.tblidx), 0),
            seTblidx: col.seTblidx >= 0 ? parseIntField(get(col.seTblidx), 0) : 0,
            byExclIdx: col.byExclIdx >= 0 ? parseIntField(get(col.byExclIdx), 0) : 0,
            byMinLevel: col.byMinLevel >= 0 ? parseIntField(get(col.byMinLevel), 0) : 0,
            byMaxLevel,
            byFrequency: col.byFrequency >= 0 ? parseIntField(get(col.byFrequency), 1) : 1,
            wEnchant_Value: parseIntField(get(col.wEnchant_Value), 0),
            byKind: col.byKind >= 0 ? parseIntField(get(col.byKind), 0) : 0,
            dwEquip: col.dwEquip >= 0 ? parseIntField(get(col.dwEquip), 0) : 0,
            byGroupNo: col.byGroupNo >= 0 ? parseIntField(get(col.byGroupNo), 0) : 0,
            wMaxValue: col.wMaxValue >= 0 ? parseIntField(get(col.wMaxValue), 0) : 0,
            bIsSuperior: col.bIsSuperior >= 0 ? parseBool(get(col.bIsSuperior)) : false,
            bIsExcellent: col.bIsExcellent >= 0 ? parseBool(get(col.bIsExcellent)) : false,
            bIsRare: col.bIsRare >= 0 ? parseBool(get(col.bIsRare)) : false,
            bIsLegendary: col.bIsLegendary >= 0 ? parseBool(get(col.bIsLegendary)) : false,
            name: col.name >= 0 ? get(col.name).trim() : '',
        });
    }

    return out;
}

/** Same bucketing as `CItemEnchantTable::AddTable`. */
export function buildEnchantByRank(rows: ItemEnchantRow[]): ItemEnchantRow[][] {
    const vec: ItemEnchantRow[][] = [[], [], [], [], [], []];
    for (const row of rows) {
        if (row.bIsSuperior) {
            vec[ITEM_RANK_SUPERIOR].push(row);
        }
        if (row.bIsExcellent) {
            vec[ITEM_RANK_EXCELLENT].push(row);
        }
        if (row.bIsRare) {
            vec[ITEM_RANK_RARE].push(row);
        }
        if (row.bIsLegendary) {
            vec[ITEM_RANK_LEGENDARY].push(row);
        }
    }
    return vec;
}

export async function fetchItemEnchantCsv(url = '/table_item_enchant_data_rows.csv'): Promise<ItemEnchantRow[]> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to load ${url}: ${res.status}`);
    }
    const text = await res.text();
    return parseItemEnchantRowsFromCsv(text);
}

type ItemEnchantApiRow = Partial<Record<keyof ItemEnchantRow, unknown>> & {
    tblidx?: unknown;
    seTblidx?: unknown;
    byExclIdx?: unknown;
    byMinLevel?: unknown;
    byMaxLevel?: unknown;
    byFrequency?: unknown;
    wEnchant_Value?: unknown;
    byKind?: unknown;
    dwEquip?: unknown;
    byGroupNo?: unknown;
    wMaxValue?: unknown;
    bIsSuperior?: unknown;
    bIsExcellent?: unknown;
    bIsRare?: unknown;
    bIsLegendary?: unknown;
};

function pickField(row: ItemEnchantApiRow, keys: string[]): unknown {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
            return (row as Record<string, unknown>)[key];
        }
    }
    return undefined;
}

function toInt(v: unknown, def: number): number {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : def;
}

function toBool(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    const s = String(v ?? '').trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes';
}

function toItemEnchantRowFromApi(row: ItemEnchantApiRow): ItemEnchantRow {
    return {
        tblidx: toInt(pickField(row, ['tblidx']), 0),
        seTblidx: toInt(pickField(row, ['seTblidx', 'setblidx']), 0),
        byExclIdx: toInt(pickField(row, ['byExclIdx', 'byexclidx']), 0),
        byMinLevel: toInt(pickField(row, ['byMinLevel', 'byminlevel']), 0),
        byMaxLevel: toInt(pickField(row, ['byMaxLevel', 'bymaxlevel']), INVALID_BYTE),
        byFrequency: toInt(pickField(row, ['byFrequency', 'byfrequency']), 1),
        wEnchant_Value: toInt(pickField(row, ['wEnchant_Value', 'wenchant_value']), 0),
        byKind: toInt(pickField(row, ['byKind', 'bykind']), 0),
        dwEquip: toInt(pickField(row, ['dwEquip', 'dwequip']), 0),
        byGroupNo: toInt(pickField(row, ['byGroupNo', 'bygroupno']), 0),
        wMaxValue: toInt(pickField(row, ['wMaxValue', 'wmaxvalue']), 0),
        bIsSuperior: toBool(pickField(row, ['bIsSuperior', 'bissuperior'])),
        bIsExcellent: toBool(pickField(row, ['bIsExcellent', 'bisexcellent'])),
        bIsRare: toBool(pickField(row, ['bIsRare', 'bisrare'])),
        bIsLegendary: toBool(pickField(row, ['bIsLegendary', 'bislegendary'])),
        name: '',
    };
}

export async function fetchItemEnchantData(
    locale: 'en' | 'kr'
): Promise<{ rows: ItemEnchantRow[]; translationsByTblidx: Map<number, ItemEnchantTranslationNames> }> {
    const res = await fetch(`/api/game/item-enchant-data?locale=${encodeURIComponent(locale)}`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error(`Failed to load /api/game/item-enchant-data: ${res.status}`);
    }
    const payload = (await res.json()) as {
        rows?: ItemEnchantApiRow[];
        namesByTblidx?: Record<string, string>;
        translations?: Array<{
            tblidx?: unknown;
            wszName_en?: unknown;
            wszName_kr?: unknown;
        }>;
    };

    const rows = (payload.rows ?? []).map(toItemEnchantRowFromApi);
    const translationsByTblidx = new Map<number, ItemEnchantTranslationNames>();

    for (const tr of payload.translations ?? []) {
        const tblidx = Number(tr.tblidx);
        if (!Number.isFinite(tblidx)) {
            continue;
        }
        const en = String(tr.wszName_en ?? '').trim();
        const kr = String(tr.wszName_kr ?? '').trim();
        translationsByTblidx.set(Math.trunc(tblidx), { en, kr });
    }

    // Backward compatibility with server payloads that only send namesByTblidx.
    if (translationsByTblidx.size === 0) {
        const localeNames = payload.namesByTblidx ?? {};
        for (const [key, value] of Object.entries(localeNames)) {
            const tblidx = Number(key);
            if (!Number.isFinite(tblidx)) {
                continue;
            }
            const name = String(value ?? '').trim();
            translationsByTblidx.set(Math.trunc(tblidx), {
                en: locale === 'en' ? name : '',
                kr: locale === 'kr' ? name : '',
            });
        }
    }

    return { rows, translationsByTblidx };
}
