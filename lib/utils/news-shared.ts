import type { NewsCategory } from "@/lib/models/news_posts";

const CATEGORIES: NewsCategory[] = ["info", "events"];

export function isNewsCategory(value: unknown): value is NewsCategory {
    return typeof value === "string" && (CATEGORIES as string[]).includes(value);
}

export function parseNewsCategoryParam(value: string | null): NewsCategory | undefined {
    if (!value || value === "all") return undefined;
    return isNewsCategory(value) ? value : undefined;
}
