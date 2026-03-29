import type { Block } from '@blocknote/core';

export function parseBlockNoteDocumentJson(raw: string): Block[] | null {
    const t = raw?.trim() ?? '';
    if (!t.startsWith('[')) return null;
    try {
        const parsed = JSON.parse(t) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        const first = parsed[0] as { type?: string };
        if (typeof first?.type !== 'string') return null;
        return parsed as Block[];
    } catch {
        return null;
    }
}

export function isBlockNoteDocumentString(raw: string): boolean {
    return parseBlockNoteDocumentJson(raw) !== null;
}
