import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";

function getSupabaseConfig() {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!url || !key) {
        throw new Error("Supabase configuration is missing.");
    }
    return { url, key };
}

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

        const body = await request.json();
        const id = String(body?.id ?? "").trim();
        const patch: Record<string, string | number> = {};

        if (!id) {
            return NextResponse.json(
                { success: false, message: "id is required." },
                { status: 400 }
            );
        }

        if (body?.wszName !== undefined) {
            patch.wszName = String(body.wszName ?? "").trim();
        }
        if (body?.dwCash !== undefined) {
            patch.dwCash = Math.max(0, toInt(body.dwCash, 0));
        }
        if (body?.byStackCount !== undefined) {
            patch.byStackCount = Math.max(1, Math.min(255, toInt(body.byStackCount, 1)));
        }
        if (body?.dwPriority !== undefined) {
            patch.dwPriority = toInt(body.dwPriority, 0);
        }

        if (Object.keys(patch).length === 0) {
            return NextResponse.json(
                { success: false, message: "No fields to update." },
                { status: 400 }
            );
        }

        const { url, key } = getSupabaseConfig();
        const endpoint = `${url}/rest/v1/table_hls_item_data?id=eq.${encodeURIComponent(id)}`;
        const response = await fetch(endpoint, {
            method: "PATCH",
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
            },
            body: JSON.stringify(patch),
            cache: "no-store",
        });

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json(
                { success: false, message: `Supabase update failed: ${err}` },
                { status: 500 }
            );
        }

        const updated = await response.json();
        return NextResponse.json({ success: true, updated }, { status: 200 });
    } catch (error) {
        console.error("Admin cashshop update error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update cashshop row." },
            { status: 500 }
        );
    }
}
