import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { donation_tiers } from "@/lib/models/donation_tiers";

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

        const patch: Record<string, string | number> = {};
        if (body?.title !== undefined) {
            const title = String(body.title ?? "").trim();
            if (!title) {
                return NextResponse.json(
                    { success: false, message: "title cannot be empty." },
                    { status: 400 }
                );
            }
            patch.title = title;
        }
        if (body?.amount !== undefined) {
            patch.amount = Math.max(0, toInt(body.amount, 0));
        }
        if (body?.icon !== undefined) {
            patch.icon = String(body.icon ?? "award").trim() || "award";
        }
        if (body?.order !== undefined) {
            patch.order = Math.max(0, toInt(body.order, 0));
        }

        if (Object.keys(patch).length === 0) {
            return NextResponse.json(
                { success: false, message: "No fields to update." },
                { status: 400 }
            );
        }

        const tier = await donation_tiers.findByPk(id);
        if (!tier) {
            return NextResponse.json({ success: false, message: "Tier not found." }, { status: 404 });
        }

        await tier.update(patch);
        return NextResponse.json({ success: true, tier: tier.toJSON() }, { status: 200 });
    } catch (error) {
        console.error("Admin donation tier update error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update donation tier." },
            { status: 500 }
        );
    }
}
