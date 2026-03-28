import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { fetchCashshopCatalog } from "@/lib/cashshop/catalog";
import { dbod_acc } from "@/lib/database/connection";
import { accounts } from "@/lib/models/accounts";
import { characters } from "@/lib/models/characters";
import { addItemsToCashshop } from "@/lib/utils/cashshop";
import { notifyCashshopRefresh } from "@/lib/utils/character-bridge";

const DONATE_REDIRECT_URL = "/donate?from=cashshop&insufficient=1";

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const itemId = Number(body?.itemId);
        const quantity = Math.max(1, Math.min(50, Number(body?.quantity ?? 1)));
        const isGift = Boolean(body?.isGift);
        const giftCharacterName = String(body?.giftCharacterName ?? "").trim();

        if (!Number.isFinite(itemId) || itemId <= 0) {
            return NextResponse.json(
                { success: false, message: "itemId is required." },
                { status: 400 }
            );
        }

        if (isGift && !giftCharacterName) {
            return NextResponse.json(
                { success: false, message: "giftCharacterName is required for gifts." },
                { status: 400 }
            );
        }

        const catalog = await fetchCashshopCatalog();
        const item = catalog.find((entry) => entry.itemId === itemId);

        if (!item) {
            return NextResponse.json(
                { success: false, message: "Item not found in cashshop catalog." },
                { status: 404 }
            );
        }

        const totalCost = item.finalCash * quantity;
        let giftTarget:
            | { CharID: number; CharName: string; AccountID: number }
            | null = null;

        if (isGift) {
            const target = await characters.findOne({
                where: { CharName: giftCharacterName },
                attributes: ["CharID", "CharName", "AccountID"],
                raw: true,
            });

            if (!target) {
                return NextResponse.json(
                    { success: false, message: "Gift target character not found." },
                    { status: 404 }
                );
            }

            giftTarget = {
                CharID: target.CharID,
                CharName: target.CharName,
                AccountID: target.AccountID,
            };
        }

        const refreshAccountId = giftTarget?.AccountID ?? user.AccountID;

        const result = await dbod_acc.transaction(async (transaction) => {
            const account = await accounts.findByPk(user.AccountID, {
                transaction,
                lock: true,
            });

            if (!account) {
                return { ok: false as const, status: 404, message: "Account not found." };
            }

            if ((account.mallpoints ?? 0) < totalCost) {
                return {
                    ok: false as const,
                    status: 402,
                    message: "Not enough mallpoints.",
                    redirectTo: DONATE_REDIRECT_URL,
                    mallpoints: account.mallpoints ?? 0,
                    required: totalCost,
                };
            }

            const totalStack = Math.max(1, item.byStackCount * quantity);
            await addItemsToCashshop(
                giftTarget?.AccountID ?? user.AccountID,
                [{ tblidx: item.itemId, amount: totalStack }],
                {
                    senderName: isGift ? user.Username : "Cashshop",
                    price: item.finalCash,
                    giftCharId: giftTarget?.CharID ?? null,
                    buyerAccountId: user.AccountID,
                    transaction,
                }
            );

            const remainingPoints = Math.max(0, (account.mallpoints ?? 0) - totalCost);
            await account.update({ mallpoints: remainingPoints }, { transaction });

            return {
                ok: true as const,
                status: 200,
                message: "Purchase successful.",
                mallpoints: remainingPoints,
                purchased: {
                    itemId: item.itemId,
                    quantity,
                    totalStack,
                    totalCost,
                    gift: giftTarget
                        ? {
                            CharID: giftTarget.CharID,
                            CharName: giftTarget.CharName,
                        }
                        : null,
                },
            };
        });

        if (result.ok) {
            await notifyCashshopRefresh(refreshAccountId);
        }

        return NextResponse.json(result, { status: result.status });
    } catch (error) {
        console.error("Cashshop purchase error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to complete purchase." },
            { status: 500 }
        );
    }
}
