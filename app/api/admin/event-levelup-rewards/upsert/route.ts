import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/utils';
import { event_levelup_rewards } from '@/lib/models/event_levelup';

function toInt(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.trunc(parsed);
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const id = toInt(body?.id, 0);
        const eventId = toInt(body?.eventId, 0);
        const requiredLevel = Math.max(1, toInt(body?.requiredLevel, 0));
        const hasItemId = body?.itemId != null && Number.isFinite(Number(body.itemId));
        const hasAmount = body?.amount != null && Number.isFinite(Number(body.amount));
        const itemId = hasItemId ? Math.max(0, toInt(body?.itemId, 0)) : null;
        const amount = hasAmount ? Math.max(1, toInt(body?.amount, 1)) : null;

        if (!eventId || !requiredLevel) {
            return NextResponse.json(
                { success: false, message: 'eventId and requiredLevel are required.' },
                { status: 400 }
            );
        }

        if (id) {
            const existing = await event_levelup_rewards.findByPk(id);
            if (!existing) {
                return NextResponse.json({ success: false, message: 'Reward row not found.' }, { status: 404 });
            }
            await existing.update({
                eventId,
                requiredLevel,
                ...(itemId != null ? { itemId } : {}),
                ...(amount != null ? { amount } : {}),
            });
            return NextResponse.json({ success: true, reward: existing.toJSON() }, { status: 200 });
        }

        const duplicate = await event_levelup_rewards.findOne({ where: { eventId, requiredLevel } });
        if (duplicate) {
            await duplicate.update({
                ...(itemId != null ? { itemId } : {}),
                ...(amount != null ? { amount } : {}),
            });
            return NextResponse.json({ success: true, reward: duplicate.toJSON() }, { status: 200 });
        }

        const created = await event_levelup_rewards.create({
            eventId,
            requiredLevel,
            itemId: itemId ?? 0,
            amount: amount ?? 1,
        } as any);
        return NextResponse.json({ success: true, reward: created.toJSON() }, { status: 200 });
    } catch (error) {
        console.error('Admin level-up reward upsert error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to save level-up event reward.' },
            { status: 500 }
        );
    }
}
