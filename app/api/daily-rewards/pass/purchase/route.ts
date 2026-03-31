import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import { accounts } from '@/lib/models/accounts';
import { daily_checkin_passes } from '@/lib/models/daily_rewards';
import { dbod_acc } from '@/lib/database/connection';

const CHECKIN_PASS_PRICE = Number(process.env.DAILY_CHECKIN_PASS_PRICE ?? 150);

function isSchemaError(error: unknown): boolean {
    const message = String((error as any)?.message || '').toLowerCase();
    return message.includes('unknown column') || message.includes('doesn\'t exist') || message.includes('unknown table');
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user?.AccountID) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const perpetualEnd = new Date('2099-12-31T23:59:59.999Z');

        const result = await dbod_acc.transaction(async (transaction) => {
            const existingPass = await daily_checkin_passes.findOne({
                where: {
                    AccountID: user.AccountID,
                    activeUntil: { [Op.gte]: now }
                },
                transaction,
                lock: true
            });

            if (existingPass && new Date(existingPass.activeUntil).getTime() >= now.getTime()) {
                return { ok: false as const, status: 400, message: 'Check-in Pass already active' };
            }

            const account = await accounts.findByPk(user.AccountID, { transaction, lock: true });
            if (!account) {
                return { ok: false as const, status: 404, message: 'Account not found' };
            }

            const currentPoints = Number(account.mallpoints ?? 0);
            if (currentPoints < CHECKIN_PASS_PRICE) {
                return {
                    ok: false as const,
                    status: 402,
                    message: 'Not enough mallpoints',
                    mallpoints: currentPoints,
                    required: CHECKIN_PASS_PRICE
                };
            }

            const updatedPoints = Math.max(0, currentPoints - CHECKIN_PASS_PRICE);
            await account.update({ mallpoints: updatedPoints }, { transaction });

            await daily_checkin_passes.create({
                AccountID: user.AccountID,
                purchaseYear: currentYear,
                purchaseMonth: currentMonth,
                activeFrom: now,
                activeUntil: perpetualEnd
            }, { transaction });

            return {
                ok: true as const,
                status: 200,
                message: 'Check-in Pass purchased successfully',
                mallpoints: updatedPoints,
                pass: {
                    isActive: true,
                    expiresAt: perpetualEnd.toISOString(),
                    price: CHECKIN_PASS_PRICE
                }
            };
        });

        return NextResponse.json(
            result.ok ? { success: true, ...result } : { success: false, ...result },
            { status: result.status }
        );
    } catch (error) {
        if (isSchemaError(error)) {
            return NextResponse.json(
                { success: false, message: 'Check-in Pass is not available yet (database update required)' },
                { status: 503 }
            );
        }
        console.error('Error purchasing check-in pass:', error);
        return NextResponse.json({ success: false, message: 'Failed to purchase check-in pass' }, { status: 500 });
    }
}

