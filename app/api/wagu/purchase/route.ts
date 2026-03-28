import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { dbod_acc } from "@/lib/database/connection";
import { accounts } from "@/lib/models/accounts";
import { notifyWaguRefresh } from "@/lib/utils/character-bridge";
import { WAGU_CP_PER_COIN } from "@/lib/wagu/constants";

const MAX_WAGU_PER_REQUEST = 10_000;

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const raw = Number(body?.count);
        const count = Math.floor(raw);
        if (!Number.isFinite(count) || count < 1 || count > MAX_WAGU_PER_REQUEST) {
            return NextResponse.json(
                { ok: false, message: `count must be an integer from 1 to ${MAX_WAGU_PER_REQUEST}.` },
                { status: 400 }
            );
        }

        const cpCost = count * WAGU_CP_PER_COIN;

        const result = await dbod_acc.transaction(async (transaction) => {
            const account = await accounts.findByPk(user.AccountID, {
                transaction,
                lock: true,
            });

            if (!account) {
                return { ok: false as const, status: 404, message: "Account not found." };
            }

            const currentCp = Number(account.mallpoints ?? 0);
            if (currentCp < cpCost) {
                return {
                    ok: false as const,
                    status: 402,
                    message: "Not enough Cash Points.",
                    mallpoints: currentCp,
                    required: cpCost,
                };
            }

            const currentWagu = Number(account.WaguCoins ?? 0);
            const nextCp = Math.max(0, currentCp - cpCost);
            const nextWagu = Math.max(0, currentWagu + count);

            await account.update(
                { mallpoints: nextCp, WaguCoins: nextWagu },
                { transaction }
            );

            return {
                ok: true as const,
                status: 200,
                mallpoints: nextCp,
                waguCoins: nextWagu,
                purchased: count,
                cpSpent: cpCost,
            };
        });

        if (!result.ok) {
            return NextResponse.json(result, { status: result.status });
        }

        void notifyWaguRefresh(user.AccountID);

        return NextResponse.json(
            {
                ok: true,
                mallpoints: result.mallpoints,
                waguCoins: result.waguCoins,
                purchased: result.purchased,
                cpSpent: result.cpSpent,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Wagu purchase error:", error);
        return NextResponse.json({ ok: false, message: "Purchase failed." }, { status: 500 });
    }
}
