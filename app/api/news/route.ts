import { NextRequest, NextResponse } from "next/server";
import { Op, col, fn } from "sequelize";
import { news_posts } from "@/lib/models/news_posts";
import { news_post_items } from "@/lib/models/news_post_items";
import { news_post_claims } from "@/lib/models/news_post_claims";
import { getUserFromRequest } from "@/lib/auth/utils";
import { parseNewsCategoryParam, isNewsCategory } from "@/lib/utils/news-shared";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10));
        const categoryRaw = searchParams.get("category");
        const categoryFilter = parseNewsCategoryParam(categoryRaw);

        if (categoryRaw && categoryRaw !== "all" && !isNewsCategory(categoryRaw)) {
            return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
        }

        const where: Record<string, unknown> = { active: true };
        if (categoryFilter) {
            where.category = categoryFilter;
        }

        const total = await news_posts.count({ where });

        const rows = await news_posts.findAll({
            where,
            order: [["updatedAt", "DESC"]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });

        const postIds = rows.map((r) => Number(r.id));
        const rewardCountByPostId = new Map<number, number>();
        if (postIds.length > 0) {
            const aggRows = await news_post_items.findAll({
                attributes: ["newsPostId", [fn("COUNT", col("id")), "rewardCount"]],
                where: { newsPostId: { [Op.in]: postIds } },
                group: ["newsPostId"],
                raw: true,
            });
            for (const row of aggRows as unknown as { newsPostId: number; rewardCount: string | number }[]) {
                rewardCountByPostId.set(Number(row.newsPostId), Number(row.rewardCount));
            }
        }

        const items = rows.map((row) => {
            const plain = row.get({ plain: true }) as unknown as Record<string, unknown>;
            const id = Number(plain.id);
            const rewardCount = rewardCountByPostId.get(id) ?? 0;
            return {
                id: plain.id,
                category: plain.category,
                title_en: plain.title_en,
                title_kr: plain.title_kr,
                image_url: plain.image_url,
                updatedAt: plain.updatedAt,
                hasReward: rewardCount > 0,
            };
        });

        const user = await getUserFromRequest(request);
        const idsWithRewards = items.filter((it) => it.hasReward).map((it) => Number(it.id));
        let claimedIds = new Set<number>();
        if (user?.AccountID && idsWithRewards.length > 0) {
            const claimRows = await news_post_claims.findAll({
                where: {
                    AccountID: user.AccountID,
                    newsPostId: { [Op.in]: idsWithRewards },
                },
                attributes: ["newsPostId"],
                raw: true,
            });
            claimedIds = new Set(
                (claimRows as { newsPostId: number }[]).map((r) => Number(r.newsPostId))
            );
        }

        const itemsOut = items.map((it) => ({
            ...it,
            claimableReward:
                Boolean(user?.AccountID) && it.hasReward && !claimedIds.has(Number(it.id)),
        }));

        return NextResponse.json(
            {
                success: true,
                items: itemsOut,
                total,
                page,
                pageSize,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/news error:", error);
        return NextResponse.json({ success: false, message: "Failed to load news" }, { status: 500 });
    }
}
