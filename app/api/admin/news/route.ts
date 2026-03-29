import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { news_posts } from "@/lib/models/news_posts";
import { news_post_items } from "@/lib/models/news_post_items";
import { isNewsCategory } from "@/lib/utils/news-shared";
import { dbod_acc } from "@/lib/database/connection";

function assertGm(user: Awaited<ReturnType<typeof getUserFromRequest>>) {
    return user && Number(user.isGm) === 10;
}

type RewardLineInput = { tblidx: number; amount: number; sortOrder?: number };

function normalizeRewardLines(raw: unknown): RewardLineInput[] {
    if (!Array.isArray(raw)) return [];
    const out: RewardLineInput[] = [];
    for (const row of raw) {
        if (!row || typeof row !== "object") continue;
        const tblidx = Number((row as Record<string, unknown>).tblidx);
        const amount = Number((row as Record<string, unknown>).amount);
        const sortOrder = Number((row as Record<string, unknown>).sortOrder);
        if (!Number.isFinite(tblidx) || tblidx < 1) continue;
        if (!Number.isFinite(amount) || amount < 1) continue;
        out.push({
            tblidx,
            amount: Math.min(999999, Math.trunc(amount)),
            sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : out.length,
        });
    }
    return out;
}

async function attachItemsToPosts(postRows: { id: number }[]) {
    const ids = postRows.map((p) => p.id);
    if (ids.length === 0) return new Map<number, RewardLineInput[]>();
    const allItems = await news_post_items.findAll({
        where: { newsPostId: ids },
        order: [
            ["newsPostId", "ASC"],
            ["sortOrder", "ASC"],
            ["id", "ASC"],
        ],
        raw: true,
    });
    const map = new Map<number, RewardLineInput[]>();
    for (const row of allItems as unknown as { newsPostId: number; tblidx: number; amount: number; sortOrder: number | null }[]) {
        const pid = Number(row.newsPostId);
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid)!.push({
            tblidx: Number(row.tblidx),
            amount: Number(row.amount),
            sortOrder: row.sortOrder ?? 0,
        });
    }
    return map;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!assertGm(user)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const postModels = await news_posts.findAll({
            order: [["updatedAt", "DESC"]],
        });
        const posts = postModels.map(
            (p) => p.get({ plain: true }) as unknown as { id: number } & Record<string, unknown>
        );
        const itemsByPost = await attachItemsToPosts(posts);

        const payload = posts.map((p) => ({
            ...p,
            items: itemsByPost.get(Number(p.id)) || [],
        }));

        return NextResponse.json({ success: true, posts: payload }, { status: 200 });
    } catch (error) {
        console.error("GET /api/admin/news error:", error);
        return NextResponse.json({ success: false, message: "Failed to load news" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!assertGm(user)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== "object") {
            return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
        }

        const category = (body as Record<string, unknown>).category;
        const title_en = String((body as Record<string, unknown>).title_en ?? "").trim();
        const title_kr = String((body as Record<string, unknown>).title_kr ?? "").trim();
        const body_md_en = String((body as Record<string, unknown>).body_md_en ?? "");
        const body_md_kr = String((body as Record<string, unknown>).body_md_kr ?? "");
        const image_url =
            (body as Record<string, unknown>).image_url === null ||
            (body as Record<string, unknown>).image_url === undefined
                ? null
                : String((body as Record<string, unknown>).image_url).trim() || null;
        const active = Boolean((body as Record<string, unknown>).active);
        const items = normalizeRewardLines((body as Record<string, unknown>).items);

        if (!isNewsCategory(category)) {
            return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
        }
        if (!title_en || !title_kr) {
            return NextResponse.json({ success: false, message: "Titles required (en and kr)" }, { status: 400 });
        }

        const created = await dbod_acc.transaction(async (transaction) => {
            const post = await news_posts.create(
                {
                    category,
                    title_en: title_en.slice(0, 512),
                    title_kr: title_kr.slice(0, 512),
                    body_md_en,
                    body_md_kr,
                    image_url: image_url ? image_url.slice(0, 1024) : null,
                    active,
                },
                { transaction }
            );

            if (items.length > 0) {
                await news_post_items.bulkCreate(
                    items.map((it, idx) => ({
                        newsPostId: post.id,
                        tblidx: it.tblidx,
                        amount: it.amount,
                        sortOrder: it.sortOrder ?? idx,
                    })),
                    { transaction }
                );
            }

            return post;
        });

        const itemRows = await news_post_items.findAll({
            where: { newsPostId: created.id },
            order: [
                ["sortOrder", "ASC"],
                ["id", "ASC"],
            ],
            raw: true,
        });

        return NextResponse.json(
            {
                success: true,
                post: {
                    ...(created.get({ plain: true }) as unknown as Record<string, unknown>),
                    items: itemRows,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/admin/news error:", error);
        return NextResponse.json({ success: false, message: "Failed to create post" }, { status: 500 });
    }
}
