import "server-only";
import path from "path";
import { readdir } from "fs/promises";

const ICONS_DIR = path.join(process.cwd(), "public", "icon");

let iconFilenameMap: Map<string, string> | null = null;

async function getIconFilenameMap(): Promise<Map<string, string>> {
    if (iconFilenameMap) return iconFilenameMap;

    const map = new Map<string, string>();
    try {
        const files = await readdir(ICONS_DIR, { withFileTypes: true });
        for (const entry of files) {
            if (!entry.isFile()) continue;
            map.set(entry.name.toLowerCase(), entry.name);
        }
    } catch (error) {
        // Keep empty map if icon directory is not readable.
        console.error("Failed to read public/icon directory:", error);
    }

    iconFilenameMap = map;
    return map;
}

export async function resolveIconFilenameCase(rawIconName: string): Promise<string> {
    const trimmed = String(rawIconName || "").trim();
    if (!trimmed) return "i_empty_cs_s.png";

    const normalized = trimmed.replace(/^\/+/, "").replace(/^icon\//i, "");
    const hasExtension = /\.[a-z0-9]+$/i.test(normalized);
    const candidates = hasExtension ? [normalized] : [`${normalized}.png`, normalized];

    const map = await getIconFilenameMap();
    for (const candidate of candidates) {
        const match = map.get(candidate.toLowerCase());
        if (match) return match;
    }

    return hasExtension ? normalized : `${normalized}.png`;
}
