import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { slot_machine_items } from "@/lib/models/slot_machine_items";
import { enrichSlotRowsWithSupabase } from "@/lib/slot-machine/enrich";

function validPoolRow(row: { tblidx: number; amount: number; feq: number }): boolean {
    const t = Number(row.tblidx);
    const a = Number(row.amount);
    const f = Number(row.feq);
    return Number.isFinite(t) && t > 0 && Number.isFinite(a) && a > 0 && Number.isFinite(f) && f >= 1 && f <= 10;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const rawRows = await slot_machine_items.findAll({
            order: [["id", "ASC"]],
            raw: true,
        });

        const rows = (rawRows as { id: number; tblidx: number; amount: number; feq: number }[]).filter(validPoolRow);
        const items = await enrichSlotRowsWithSupabase(rows);

        return NextResponse.json({ success: true, items }, { status: 200 });
    } catch (error) {
        console.error("Slot machine GET error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load slot machine." },
            { status: 500 }
        );
    }
}
