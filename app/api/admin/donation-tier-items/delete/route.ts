import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { donation_tier_items } from "@/lib/models/donation_tier_items";

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
        const tierId = toInt(body?.tierId, 0);
        const tblidx = toInt(body?.tblidx, 0);

        if (id) {
            const deletedCount = await donation_tier_items.destroy({ where: { id } });
            return NextResponse.json({ success: deletedCount > 0 }, { status: 200 });
        }

        if (!tierId || !tblidx) {
            return NextResponse.json(
                { success: false, message: "id or (tierId + tblidx) is required." },
                { status: 400 }
            );
        }

        const deletedCount = await donation_tier_items.destroy({ where: { tierId, tblidx } });
        return NextResponse.json({ success: deletedCount > 0 }, { status: 200 });
    } catch (error) {
        console.error("Admin donation tier item delete error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to remove donation tier item." },
            { status: 500 }
        );
    }
}
