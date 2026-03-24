import { NextRequest, NextResponse } from "next/server";
import { querySupabaseTable } from "@/lib/supabase/server";
import { resolveIconFilenameCase } from "@/lib/utils/icon-resolver";
import { getUserFromRequest } from "@/lib/auth/utils";

type CashshopAdminRow = {
    id?: string;
    tblidx?: number;
    wszName?: string;
    szIcon_Name?: string;
    dwPriority?: number;
    dwCash?: number;
    byStackCount?: number;
    byDiscount?: number;
    table_id?: string;
};

function toInt(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const rows = await querySupabaseTable<CashshopAdminRow>({
            table: "table_hls_item_data",
            params: {
                select: "id,tblidx,wszName,szIcon_Name,dwPriority,dwCash,byStackCount,byDiscount,table_id",
                order: "dwPriority.desc,tblidx.asc",
                limit: "5000",
            },
        });

        const items = await Promise.all(
            rows.map(async (row) => {
                const iconName = await resolveIconFilenameCase(String(row.szIcon_Name ?? "").trim());
                return {
                    id: String(row.id ?? "").trim(),
                    tblidx: toInt(row.tblidx, 0),
                    wszName: String(row.wszName ?? "").trim(),
                    szIcon_Name: iconName,
                    dwPriority: toInt(row.dwPriority, 0),
                    dwCash: toInt(row.dwCash, 0),
                    byStackCount: toInt(row.byStackCount, 1),
                    byDiscount: toInt(row.byDiscount, 0),
                    table_id: String(row.table_id ?? "").trim(),
                    active: toInt(row.dwPriority, 0) === 555,
                };
            })
        );

        return NextResponse.json({ success: true, items }, { status: 200 });
    } catch (error) {
        console.error("Admin cashshop list error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch cashshop rows." },
            { status: 500 }
        );
    }
}
