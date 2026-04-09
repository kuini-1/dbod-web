import "server-only";

import item_enchant_translations from "@/lib/models/item_enchant_translations";

export type EnchantTranslationLocale = "en" | "kr";

type EnchantTranslationRow = {
    tblidx: number;
    wszName_en: string;
    wszName_kr: string | null;
};

export function normalizeEnchantTranslationLocale(input: string | null | undefined): EnchantTranslationLocale {
    return input === "kr" ? "kr" : "en";
}

export async function loadEnchantTranslationMap(
    locale: EnchantTranslationLocale
): Promise<Map<number, string>> {
    const rows = (await item_enchant_translations.findAll({
        attributes: ["tblidx", "wszName_en", "wszName_kr"],
        raw: true,
    })) as EnchantTranslationRow[];

    const out = new Map<number, string>();
    for (const row of rows) {
        const tblidx = Number(row.tblidx);
        if (!Number.isFinite(tblidx)) {
            continue;
        }
        const selected = locale === "kr" ? row.wszName_kr : row.wszName_en;
        const name = String(selected ?? "").trim();
        if (!name) {
            continue;
        }
        out.set(Math.trunc(tblidx), name);
    }
    return out;
}
