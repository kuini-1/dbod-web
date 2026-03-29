import { NextRequest, NextResponse } from "next/server";
import { news_posts } from "@/lib/models/news_posts";
import { news_post_items } from "@/lib/models/news_post_items";
import { news_post_claims } from "@/lib/models/news_post_claims";
import { getUserFromRequest } from "@/lib/auth/utils";
import { enrichTblidxList, formatRewardLine } from "@/lib/cashshop/enrichByTblidx";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await context.params;
        const id = parseInt(idParam, 10);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
        }

        const postRow = await news_posts.findOne({
            where: { id, active: true },
        });
        if (!postRow) {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
        }
        const post = postRow.get({ plain: true }) as unknown as Record<string, unknown>;

        const itemRows = await news_post_items.findAll({
            where: { newsPostId: id },
            order: [
                ["sortOrder", "ASC"],
                ["id", "ASC"],
            ],
            raw: true,
        });

        const tblidxList = itemRows.map((r: { tblidx: number }) => Number(r.tblidx));
        const itemByTblidx = await enrichTblidxList(tblidxList);
        const rewardItems = itemRows.map((row: { tblidx: number; amount: number; sortOrder?: number | null }) =>
            formatRewardLine(row, itemByTblidx)
        );

        const user = await getUserFromRequest(request);
        let claimed = false;
        if (user?.AccountID) {
            const claim = await news_post_claims.findOne({
                where: { AccountID: user.AccountID, newsPostId: id },
            });
            claimed = Boolean(claim);
        }

        return NextResponse.json(
            {
                success: true,
                post: {
                    id: post.id,
                    category: post.category,
                    title_en: post.title_en,
                    title_kr: post.title_kr,
                    body_md_en: post.body_md_en,
                    body_md_kr: post.body_md_kr,
                    image_url: post.image_url,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                },
                rewardItems,
                claimed,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/news/[id] error:", error);
        return NextResponse.json({ success: false, message: "Failed to load post" }, { status: 500 });
    }
}
