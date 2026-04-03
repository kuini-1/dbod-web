/** Full admin (all admin tools + news write). */
export const ADMIN_GM_FULL = 10;
/** News-only admin: view news in admin panel only; no other sections or writes. */
export const ADMIN_GM_NEWS_VIEWER = 9;

export function isAdminPanelGm(isGm: number | string | undefined | null): boolean {
    const n = Number(isGm);
    return n === ADMIN_GM_NEWS_VIEWER || n === ADMIN_GM_FULL;
}

export function isAdminFullGm(isGm: number | string | undefined | null): boolean {
    return Number(isGm) === ADMIN_GM_FULL;
}

export function isAdminNewsViewerOnlyGm(isGm: number | string | undefined | null): boolean {
    return Number(isGm) === ADMIN_GM_NEWS_VIEWER;
}
