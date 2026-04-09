import { NextRequest, NextResponse } from "next/server";

import { querySupabaseTable } from "@/lib/supabase/server";
import item_enchant_translations from "@/lib/models/item_enchant_translations";

type SupabaseEnchantRow = {
    tblidx?: number | string;
    seTblidx?: number | string;
    byExclIdx?: number | string;
    byMinLevel?: number | string;
    byMaxLevel?: number | string;
    byFrequency?: number | string;
    wEnchant_Value?: number | string;
    byKind?: number | string;
    dwEquip?: number | string;
    byGroupNo?: number | string;
    wMaxValue?: number | string;
    bIsSuperior?: boolean | number | string;
    bIsExcellent?: boolean | number | string;
    bIsRare?: boolean | number | string;
    bIsLegendary?: boolean | number | string;
};

type TranslationRow = {
    tblidx: number | string;
    wszName_en: string | null;
    wszName_kr: string | null;
};

export async function GET(request: NextRequest) {
    try {
        const locale = request.nextUrl.searchParams.get("locale") === "kr" ? "kr" : "en";
        const [rows, translations] = await Promise.all([
            querySupabaseTable<SupabaseEnchantRow>({
                table: "table_item_enchant_data",
                params: {
                    select:
                        "tblidx,seTblidx,byExclIdx,byMinLevel,byMaxLevel,byFrequency,wEnchant_Value,byKind,dwEquip,byGroupNo,wMaxValue,bIsSuperior,bIsExcellent,bIsRare,bIsLegendary",
                    order: "tblidx.asc",
                    limit: "10000",
                },
            }),
            item_enchant_translations.findAll({
                attributes: ["tblidx", "wszName_en", "wszName_kr"],
                raw: true,
            }),
        ]);

        const namesByTblidx: Record<string, string> = {};
        for (const tr of translations as TranslationRow[]) {
            const tblidx = Number(tr.tblidx);
            if (!Number.isFinite(tblidx)) {
                continue;
            }
            const selected = locale === "kr" ? tr.wszName_kr : tr.wszName_en;
            const name = String(selected ?? "").trim();
            if (!name) {
                continue;
            }
            namesByTblidx[String(Math.trunc(tblidx))] = name;
        }

        return NextResponse.json(
            {
                success: true,
                locale,
                rows,
                translations,
                namesByTblidx,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Item enchant data fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch item enchant data." },
            { status: 500 }
        );
    }
}
