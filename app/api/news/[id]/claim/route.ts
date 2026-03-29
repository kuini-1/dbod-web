import { NextRequest, NextResponse } from "next/server";
import { news_posts } from "@/lib/models/news_posts";
import { news_post_items } from "@/lib/models/news_post_items";
import { news_post_claims } from "@/lib/models/news_post_claims";
import { getUserFromRequest } from "@/lib/auth/utils";
import { addItemsToCashshop } from "@/lib/utils/cashshop";
import { dbod_acc } from "@/lib/database/connection";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user?.AccountID) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { id: idParam } = await context.params;
        const newsPostId = parseInt(idParam, 10);
        if (!Number.isFinite(newsPostId) || newsPostId < 1) {
            return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
        }

        const post = await news_posts.findOne({
            where: { id: newsPostId, active: true },
        });
        if (!post) {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
        }

        const itemRows = await news_post_items.findAll({
            where: { newsPostId },
            raw: true,
        });
        if (itemRows.length === 0) {
            return NextResponse.json({ success: false, message: "No reward configured for this post" }, { status: 400 });
        }

        const existing = await news_post_claims.findOne({
            where: { AccountID: user.AccountID, newsPostId },
        });
        if (existing) {
            return NextResponse.json({ success: false, message: "Already claimed" }, { status: 409 });
        }

        const itemsToAdd = itemRows.map((row: { tblidx: number; amount: number }) => ({
            tblidx: Number(row.tblidx),
            amount: Number(row.amount),
        }));

        try {
            await dbod_acc.transaction(async (transaction) => {
                await addItemsToCashshop(user.AccountID, itemsToAdd, {
                    senderName: "News",
                    price: 0,
                    transaction,
                });
                await news_post_claims.create(
                    {
                        AccountID: user.AccountID,
                        newsPostId,
                        claimedAt: new Date(),
                    },
                    { transaction }
                );
            });
        } catch (err: unknown) {
            const code = (err as { parent?: { errno?: number } })?.parent?.errno;
            if (code === 1062) {
                return NextResponse.json({ success: false, message: "Already claimed" }, { status: 409 });
            }
            throw err;
        }

        return NextResponse.json({ success: true, message: "Reward claimed. Check your cashshop storage." }, { status: 200 });
    } catch (error) {
        console.error("POST /api/news/[id]/claim error:", error);
        return NextResponse.json({ success: false, message: "Failed to claim reward" }, { status: 500 });
    }
}
