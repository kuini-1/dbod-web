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
        const requiredLevel = toInt(body?.requiredLevel, 0);

        if (id) {
            const deletedCount = await event_levelup_rewards.destroy({ where: { id } });
            return NextResponse.json({ success: deletedCount > 0 }, { status: 200 });
        }

        if (!eventId || !requiredLevel) {
            return NextResponse.json(
                { success: false, message: 'id or (eventId + requiredLevel) is required.' },
                { status: 400 }
            );
        }

        const deletedCount = await event_levelup_rewards.destroy({ where: { eventId, requiredLevel } });
        return NextResponse.json({ success: deletedCount > 0 }, { status: 200 });
    } catch (error) {
        console.error('Admin level-up reward delete error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to remove level-up event reward.' },
            { status: 500 }
        );
    }
}
