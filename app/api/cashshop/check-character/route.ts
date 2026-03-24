import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { characters } from "@/lib/models/characters";

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const characterName = String(body?.characterName ?? "").trim();

        if (!characterName) {
            return NextResponse.json(
                { success: false, message: "Character name is required." },
                { status: 400 }
            );
        }

        const target = await characters.findOne({
            where: { CharName: characterName },
            attributes: ["CharID", "CharName", "AccountID"],
            raw: true,
        });

        if (!target) {
            return NextResponse.json(
                { success: false, exists: false, message: "Character not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                exists: true,
                character: {
                    CharID: target.CharID,
                    CharName: target.CharName,
                    AccountID: target.AccountID,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Cashshop character check error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to verify character." },
            { status: 500 }
        );
    }
}
