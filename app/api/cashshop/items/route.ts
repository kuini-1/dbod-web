import { NextResponse } from "next/server";
import { CASHSHOP_TABLE_ID, fetchCashshopCatalog } from "@/lib/cashshop/catalog";

export async function GET() {
    try {
        const items = await fetchCashshopCatalog();
        return NextResponse.json(
            {
                success: true,
                items,
                tableId: CASHSHOP_TABLE_ID,
                hint:
                    items.length === 0
                        ? "No rows found. Verify table_id in Supabase and set CASHSHOP_TABLE_ID in .env.local if needed."
                        : undefined,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Cashshop items error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load cashshop items." },
            { status: 500 }
        );
    }
}
