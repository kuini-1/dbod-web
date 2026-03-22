/**
 * Turn `wszName` from table_system_effect (e.g. PASSIVE_CON_UP, ACTIVE_FOC_UP) into short player-facing labels.
 */
export function formatSystemEffectLabel(raw: string): string {
    const s = raw.trim();
    if (!s) {
        return '';
    }

    const up = s.match(/^(?:PASSIVE|ACTIVE)_(.+)_UP$/i);
    if (up) {
        return simplifyToken(up[1]);
    }

    const down = s.match(/^(?:PASSIVE|ACTIVE)_(.+)_DOWN$/i);
    if (down) {
        return `${simplifyToken(down[1])} (down)`;
    }

    const rest = s.match(/^(?:PASSIVE|ACTIVE)_(.+)$/i);
    if (rest) {
        return simplifyToken(rest[1]);
    }

    return s.replace(/_/g, ' ');
}

function simplifyToken(inner: string): string {
    const known = inner
        .replace(/^STRANGE_/i, '')
        .replace(/_/g, ' ')
        .trim();
    return known || inner;
}
