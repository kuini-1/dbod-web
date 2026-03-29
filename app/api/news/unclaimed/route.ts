import { NextRequest, NextResponse } from "next/server";
import { QueryTypes } from "sequelize";
import { getUserFromRequest } from "@/lib/auth/utils";
import { dbod_acc } from "@/lib/database/connection";

/**
 * Whether the current user has at least one active news post with rewards they have not claimed.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user?.AccountID) {
            return NextResponse.json({ success: true, hasUnclaimed: false }, { status: 200 });
        }

        const rows = await dbod_acc.query<{ id: number }>(
            `SELECT np.id AS id FROM news_posts np
             WHERE np.active = 1
             AND EXISTS (SELECT 1 FROM news_post_items i WHERE i.newsPostId = np.id)
             AND NOT EXISTS (
               SELECT 1 FROM news_post_claims c
               WHERE c.newsPostId = np.id AND c.AccountID = :accountId
             )
             LIMIT 1`,
            {
                replacements: { accountId: user.AccountID },
                type: QueryTypes.SELECT,
            }
        );

        return NextResponse.json(
            { success: true, hasUnclaimed: Array.isArray(rows) && rows.length > 0 },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/news/unclaimed error:", error);
        return NextResponse.json({ success: false, hasUnclaimed: false }, { status: 500 });
    }
}
