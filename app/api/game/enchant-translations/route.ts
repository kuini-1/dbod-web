import { NextRequest, NextResponse } from "next/server";

import {
    loadEnchantTranslationMap,
    normalizeEnchantTranslationLocale,
} from "@/lib/game/itemEnchantTranslations";

export async function GET(request: NextRequest) {
    try {
        const locale = normalizeEnchantTranslationLocale(request.nextUrl.searchParams.get("locale"));
        const map = await loadEnchantTranslationMap(locale);
        const namesByTblidx: Record<string, string> = {};

        for (const [tblidx, name] of map.entries()) {
            namesByTblidx[String(tblidx)] = name;
        }

        return NextResponse.json({ success: true, locale, namesByTblidx }, { status: 200 });
    } catch (error) {
        console.error("Enchant translations fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch enchant translations." },
            { status: 500 }
        );
    }
}
