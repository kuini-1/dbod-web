import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { slot_machine_items } from "@/lib/models/slot_machine_items";

function toInt(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const id = toInt(body?.id, 0);

        if (!id) {
            return NextResponse.json({ success: false, message: "id is required." }, { status: 400 });
        }

        const deletedCount = await slot_machine_items.destroy({ where: { id } });
        return NextResponse.json({ success: deletedCount > 0 }, { status: 200 });
    } catch (error) {
        console.error("Admin slot machine item delete error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to remove slot machine item." },
            { status: 500 }
        );
    }
}
