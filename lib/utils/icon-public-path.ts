/**
 * Build `/icon/...` from a filename (typically after resolveIconFilenameCase).
 * Extension check is case-insensitive so resolved names like `Item.PNG` are not turned into `Item.PNG.png`.
 */
export function iconPublicPathFromFilename(szIcon_Name: string): string | null {
    const t = String(szIcon_Name || "").trim();
    if (!t) return null;
    const hasExtension = /\.[a-z0-9]+$/i.test(t);
    const filename = hasExtension ? t : `${t}.png`;
    return `/icon/${filename}`;
}
