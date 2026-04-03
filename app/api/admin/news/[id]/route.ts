import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getUserFromRequest } from "@/lib/auth/utils";
import { news_posts } from "@/lib/models/news_posts";
import { news_post_items } from "@/lib/models/news_post_items";
import { news_post_claims } from "@/lib/models/news_post_claims";
import { isNewsCategory } from "@/lib/utils/news-shared";
import { dbod_acc } from "@/lib/database/connection";
import { enrichTblidxList, formatRewardLine } from "@/lib/cashshop/enrichByTblidx";
import { isAdminFullGm, isAdminPanelGm } from "@/lib/auth/admin-gm";

function assertNewsRead(user: Awaited<ReturnType<typeof getUserFromRequest>>) {
    return user && isAdminPanelGm(user.isGm);
}

function assertNewsWrite(user: Awaited<ReturnType<typeof getUserFromRequest>>) {
    return user && isAdminFullGm(user.isGm);
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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUserFromRequest(request);
        if (!assertNewsRead(user)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id: idParam } = await context.params;
        const id = parseInt(idParam, 10);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
        }

        const postRow = await news_posts.findByPk(id);
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
                    active: post.active,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                },
                rewardItems,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/news/[id] error:", error);
        return NextResponse.json({ success: false, message: "Failed to load post" }, { status: 500 });
    }
}

async function deleteUploadedImageIfOwned(imageUrl: string | null) {
    if (!imageUrl || !imageUrl.startsWith("/uploads/news/")) return;
    const relative = imageUrl.replace(/^\//, "");
    const full = path.join(process.cwd(), "public", relative);
    const resolvedPublic = path.resolve(process.cwd(), "public", "uploads", "news");
    const resolvedFile = path.resolve(full);
    if (!resolvedFile.startsWith(resolvedPublic)) return;
    try {
        await fs.unlink(resolvedFile);
    } catch {
        /* ignore missing file */
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUserFromRequest(request);
        if (!assertNewsWrite(user)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id: idParam } = await context.params;
        const id = parseInt(idParam, 10);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
        }

        const post = await news_posts.findByPk(id);
        if (!post) {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
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

        const prevImage = post.image_url;
        if (image_url !== prevImage && prevImage?.startsWith("/uploads/news/")) {
            await deleteUploadedImageIfOwned(prevImage);
        }

        await dbod_acc.transaction(async (transaction) => {
            await post.update(
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
            await news_post_items.destroy({ where: { newsPostId: id }, transaction });
            if (items.length > 0) {
                await news_post_items.bulkCreate(
                    items.map((it, idx) => ({
                        newsPostId: id,
                        tblidx: it.tblidx,
                        amount: it.amount,
                        sortOrder: it.sortOrder ?? idx,
                    })),
                    { transaction }
                );
            }
        });

        await post.reload();
        const itemRows = await news_post_items.findAll({
            where: { newsPostId: id },
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
                    ...(post.get({ plain: true }) as unknown as Record<string, unknown>),
                    items: itemRows,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/admin/news/[id] error:", error);
        return NextResponse.json({ success: false, message: "Failed to update post" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUserFromRequest(request);
        if (!assertNewsWrite(user)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { id: idParam } = await context.params;
        const id = parseInt(idParam, 10);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
        }

        const post = await news_posts.findByPk(id);
        if (!post) {
            return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
        }

        const imageUrl = post.image_url;
        await dbod_acc.transaction(async (transaction) => {
            await news_post_claims.destroy({ where: { newsPostId: id }, transaction });
            await news_post_items.destroy({ where: { newsPostId: id }, transaction });
            await post.destroy({ transaction });
        });

        await deleteUploadedImageIfOwned(imageUrl);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/admin/news/[id] error:", error);
        return NextResponse.json({ success: false, message: "Failed to delete post" }, { status: 500 });
    }
}
