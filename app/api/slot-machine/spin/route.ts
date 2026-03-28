import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/utils";
import { dbod_acc } from "@/lib/database/connection";
import { accounts } from "@/lib/models/accounts";
import { slot_machine_items } from "@/lib/models/slot_machine_items";
import { enrichSlotRowsWithSupabase } from "@/lib/slot-machine/enrich";
import { addItemsToCashshop } from "@/lib/utils/cashshop";
import { notifyCashshopRefresh, notifyWaguRefresh } from "@/lib/utils/character-bridge";

type PoolRow = { id: number; tblidx: number; amount: number; feq: number };

function waguPerSpin(): number {
    const raw = process.env.SLOT_MACHINE_WAGU_PER_SPIN;
    const n = raw === undefined || raw === "" ? 1 : Number(raw);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.floor(n));
}

function validPoolRow(row: PoolRow): boolean {
    const t = Number(row.tblidx);
    const a = Number(row.amount);
    const f = Number(row.feq);
    return Number.isFinite(t) && t > 0 && Number.isFinite(a) && a > 0 && Number.isFinite(f) && f >= 1 && f <= 10;
}

function pickWeighted(pool: PoolRow[]): PoolRow {
    const total = pool.reduce((s, r) => s + r.feq, 0);
    if (total <= 0) return pool[pool.length - 1];
    let x = Math.random() * total;
    for (const row of pool) {
        x -= row.feq;
        if (x < 0) return row;
    }
    return pool[pool.length - 1];
}

const ALLOWED_COUNTS = new Set([1, 5, 10]);

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const count = Number(body?.count);
        if (!ALLOWED_COUNTS.has(count)) {
            return NextResponse.json(
                { ok: false, message: "count must be 1, 5, or 10." },
                { status: 400 }
            );
        }

        const perSpinCost = waguPerSpin();
        const totalCost = perSpinCost * count;

        const rawPool = await slot_machine_items.findAll({
            order: [["id", "ASC"]],
            raw: true,
        });
        const pool = (rawPool as PoolRow[]).filter(validPoolRow);

        if (pool.length === 0) {
            return NextResponse.json(
                { ok: false, message: "Slot machine has no rewards configured." },
                { status: 400 }
            );
        }

        const picks: PoolRow[] = [];
        for (let i = 0; i < count; i++) {
            picks.push(pickWeighted(pool));
        }

        const uniqueTblidx = Array.from(new Set(picks.map((p) => p.tblidx)));
        const enrichInputs: PoolRow[] = uniqueTblidx.map((tblidx) => ({
            id: 0,
            tblidx,
            amount: 0,
            feq: 1,
        }));
        const enriched = await enrichSlotRowsWithSupabase(enrichInputs);
        const metaByTblidx = new Map(enriched.map((e) => [e.tblidx, e]));

        const wins = picks.map((p) => {
            const meta = metaByTblidx.get(p.tblidx);
            return {
                tblidx: p.tblidx,
                amount: p.amount,
                name: meta?.name || `Item ${p.tblidx}`,
                iconUrl: meta?.iconUrl ?? null,
            };
        });

        const deliverMap = new Map<number, number>();
        for (const p of picks) {
            deliverMap.set(p.tblidx, (deliverMap.get(p.tblidx) ?? 0) + p.amount);
        }
        const deliveryItems = [...deliverMap.entries()].map(([tblidx, amount]) => ({ tblidx, amount }));

        const result = await dbod_acc.transaction(async (transaction) => {
            const account = await accounts.findByPk(user.AccountID, {
                transaction,
                lock: true,
            });

            if (!account) {
                return { ok: false as const, status: 404, message: "Account not found." };
            }

            const currentWagu = Number(account.WaguCoins ?? 0);
            if (currentWagu < totalCost) {
                return {
                    ok: false as const,
                    status: 402,
                    message: "Not enough Wagu coins.",
                    waguCoins: currentWagu,
                    required: totalCost,
                };
            }

            const remainingWagu = Math.max(0, currentWagu - totalCost);
            await account.update({ WaguCoins: remainingWagu }, { transaction });

            await addItemsToCashshop(user.AccountID, deliveryItems, {
                senderName: "SlotMachine",
                price: 0,
                buyerAccountId: user.AccountID,
                transaction,
            });

            return {
                ok: true as const,
                status: 200,
                waguCoins: remainingWagu,
                wins,
                totalCost,
            };
        });

        if (!result.ok) {
            return NextResponse.json(result, { status: result.status });
        }

        const accountId = user.AccountID;
        void notifyCashshopRefresh(accountId);
        void notifyWaguRefresh(accountId);

        return NextResponse.json(
            {
                ok: true,
                waguCoins: result.waguCoins,
                wins: result.wins,
                totalCost: result.totalCost,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Slot machine spin error:", error);
        return NextResponse.json({ ok: false, message: "Spin failed." }, { status: 500 });
    }
}
