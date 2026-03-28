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
        const tblidx = Math.max(0, toInt(body?.tblidx, 0));
        const amount = Math.max(1, toInt(body?.amount, 1));
        const feq = toInt(body?.feq, 5);

        if (!tblidx) {
            return NextResponse.json(
                { success: false, message: "tblidx is required." },
                { status: 400 }
            );
        }

        if (feq < 1 || feq > 10) {
            return NextResponse.json(
                { success: false, message: "feq must be between 1 and 10." },
                { status: 400 }
            );
        }

        if (id) {
            const existing = await slot_machine_items.findByPk(id);
            if (!existing) {
                return NextResponse.json(
                    { success: false, message: "Slot item not found." },
                    { status: 404 }
                );
            }

            await existing.update({ tblidx, amount, feq });
            return NextResponse.json({ success: true, item: existing.toJSON() }, { status: 200 });
        }

        const created = await slot_machine_items.create({
            tblidx,
            amount,
            feq,
        });
        return NextResponse.json({ success: true, item: created.toJSON() }, { status: 200 });
    } catch (error) {
        console.error("Admin slot machine item upsert error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to save slot machine item." },
            { status: 500 }
        );
    }
}
