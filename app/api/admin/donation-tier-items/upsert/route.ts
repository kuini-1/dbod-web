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
        const tblidx = Math.max(0, toInt(body?.tblidx, 0));
        const amount = Math.max(1, toInt(body?.amount, 1));
        const sortOrder = Math.max(0, toInt(body?.sortOrder, 0));

        if (!tierId || !tblidx) {
            return NextResponse.json(
                { success: false, message: "tierId and tblidx are required." },
                { status: 400 }
            );
        }

        if (id) {
            const existing = await donation_tier_items.findByPk(id);
            if (!existing) {
                return NextResponse.json(
                    { success: false, message: "Tier item not found." },
                    { status: 404 }
                );
            }

            await existing.update({ amount, sortOrder });
            return NextResponse.json({ success: true, item: existing.toJSON() }, { status: 200 });
        }

        const duplicate = await donation_tier_items.findOne({ where: { tierId, tblidx } });
        if (duplicate) {
            await duplicate.update({ amount, sortOrder });
            return NextResponse.json({ success: true, item: duplicate.toJSON() }, { status: 200 });
        }

        const created = await donation_tier_items.create({
            tierId,
            tblidx,
            amount,
            sortOrder,
        });
        return NextResponse.json({ success: true, item: created.toJSON() }, { status: 200 });
    } catch (error) {
        console.error("Admin donation tier item upsert error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to save donation tier item." },
            { status: 500 }
        );
    }
}
