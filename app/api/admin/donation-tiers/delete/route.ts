import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { donation_tiers } from "@/lib/models/donation_tiers";
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
        if (!id) {
            return NextResponse.json({ success: false, message: "id is required." }, { status: 400 });
        }

        const tier = await donation_tiers.findByPk(id);
        if (!tier) {
            return NextResponse.json({ success: false, message: "Tier not found." }, { status: 404 });
        }

        await donation_tier_items.destroy({ where: { tierId: id } });
        await tier.destroy();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Admin donation tier delete error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete donation tier." },
            { status: 500 }
        );
    }
}
