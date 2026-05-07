import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import { dbod_acc } from '@/lib/database/connection';
import { accounts } from '@/lib/models/accounts';
import { syncPurchasedSP } from '@/lib/utils/character-bridge';

const SP_PRICE_CP = 10;
const MAX_PURCHASE_SP_TOTAL = 100;

function quoteIdentifier(value: string): string {
    return `\`${value.replace(/`/g, '``')}\``;
}

const charDbName = process.env.DB_CHAR_NAME || 'dbo_char';
const charactersTable = `${quoteIdentifier(charDbName)}.${quoteIdentifier('characters')}`;

type CharacterRow = {
    CharID: number;
    CharName: string;
    AccountID: number;
    SpPoint: number;
    BoughtSP: number | null;
};

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const charId = Number(body?.charId ?? body?.CharID ?? 0);
        const quantity = Math.floor(Number(body?.quantity ?? body?.sp ?? 0));

        if (!Number.isFinite(charId) || charId <= 0) {
            return NextResponse.json({ success: false, message: 'charId is required.' }, { status: 400 });
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return NextResponse.json(
                { success: false, message: 'Quantity must be at least 1.' },
                { status: 400 }
            );
        }

        const totalCost = quantity * SP_PRICE_CP;

        const result = await dbod_acc.transaction(async (transaction) => {
            const account = await accounts.findByPk(user.AccountID, {
                transaction,
                lock: true,
            });

            if (!account) {
                return { ok: false as const, status: 404, message: 'Account not found.' };
            }

            const [character] = await dbod_acc.query<CharacterRow>(
                `SELECT CharID, CharName, AccountID, SpPoint, BoughtSP FROM ${charactersTable} WHERE CharID = ? AND AccountID = ? FOR UPDATE`,
                {
                    replacements: [charId, user.AccountID],
                    transaction,
                    type: QueryTypes.SELECT,
                }
            );

            if (!character) {
                return { ok: false as const, status: 404, message: 'Character not found.' };
            }

            const currentBoughtSP = Math.max(0, Number(character.BoughtSP ?? 0));
            const remainingPurchasable = Math.max(0, MAX_PURCHASE_SP_TOTAL - currentBoughtSP);
            if (remainingPurchasable <= 0) {
                return {
                    ok: false as const,
                    status: 400,
                    message: `This character already reached the max purchased SP (${MAX_PURCHASE_SP_TOTAL}).`,
                    maxPurchasedSP: MAX_PURCHASE_SP_TOTAL,
                    currentBoughtSP,
                    remainingPurchasable,
                };
            }

            if (quantity > remainingPurchasable) {
                return {
                    ok: false as const,
                    status: 400,
                    message: `You can only purchase up to ${remainingPurchasable} more SP for this character.`,
                    maxPurchasedSP: MAX_PURCHASE_SP_TOTAL,
                    currentBoughtSP,
                    remainingPurchasable,
                };
            }

            const mallpoints = Number(account.mallpoints ?? 0);
            if (mallpoints < totalCost) {
                return {
                    ok: false as const,
                    status: 402,
                    message: 'Not enough cash points.',
                    mallpoints,
                    required: totalCost,
                };
            }

            const boughtSP = currentBoughtSP + quantity;
            const spPoint = Math.max(0, Number(character.SpPoint ?? 0)) + quantity;
            const remainingPoints = mallpoints - totalCost;

            await dbod_acc.query(
                `UPDATE ${charactersTable} SET BoughtSP = ?, SpPoint = ? WHERE CharID = ? AND AccountID = ?`,
                {
                    replacements: [boughtSP, spPoint, charId, user.AccountID],
                    transaction,
                    type: QueryTypes.UPDATE,
                }
            );

            await account.update({ mallpoints: remainingPoints }, { transaction });

            return {
                ok: true as const,
                status: 200,
                message: 'SP purchase successful.',
                mallpoints: remainingPoints,
                character: {
                    CharID: character.CharID,
                    CharName: character.CharName,
                    BoughtSP: boughtSP,
                    SpPoint: spPoint,
                },
                purchased: {
                    quantity,
                    unitCost: SP_PRICE_CP,
                    totalCost,
                },
            };
        });

        if (result.ok) {
            await syncPurchasedSP(result.character.CharID, result.character.BoughtSP, result.character.SpPoint);
        }

        return NextResponse.json(
            {
                success: result.ok,
                ...result,
            },
            { status: result.status }
        );
    } catch (error) {
        console.error('Purchase SP error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to complete SP purchase.' },
            { status: 500 }
        );
    }
}
