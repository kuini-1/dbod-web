import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { slot_machine_items } from "@/lib/models/slot_machine_items";

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const rows = await slot_machine_items.findAll({
            order: [["id", "ASC"]],
            raw: true,
        });

        return NextResponse.json({ success: true, items: rows }, { status: 200 });
    } catch (error) {
        console.error("Admin slot machine items list error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to load slot machine items." },
            { status: 500 }
        );
    }
}
