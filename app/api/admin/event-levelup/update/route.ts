import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/utils';
import { event_levelup_events } from '@/lib/models/event_levelup';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || Number(user.isGm) !== 10) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const id = Number(body?.id);
        if (!Number.isFinite(id) || id < 1) {
            return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });
        }

        const event = await event_levelup_events.findByPk(id);
        if (!event) {
            return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
        }

        const patch: Record<string, unknown> = {};
        if (body?.title !== undefined) {
            const title = String(body.title ?? '').trim();
            if (!title) {
                return NextResponse.json({ success: false, message: 'title cannot be empty.' }, { status: 400 });
            }
            patch.title = title;
        }
        if (body?.slug !== undefined) {
            const slug = String(body.slug ?? '').trim();
            patch.slug = slug || null;
        }
        if (body?.startDate !== undefined) {
            const startDate = String(body.startDate ?? '').trim();
            if (!startDate) {
                return NextResponse.json({ success: false, message: 'startDate cannot be empty.' }, { status: 400 });
            }
            patch.startDate = startDate;
        }
        if (body?.endDate !== undefined) {
            const endDate = String(body.endDate ?? '').trim();
            if (!endDate) {
                return NextResponse.json({ success: false, message: 'endDate cannot be empty.' }, { status: 400 });
            }
            patch.endDate = endDate;
        }
        if (body?.isActive !== undefined) {
            patch.isActive = Boolean(body.isActive);
        }

        if (Object.keys(patch).length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update.' }, { status: 400 });
        }

        await event.update(patch);
        return NextResponse.json({ success: true, event: event.toJSON() }, { status: 200 });
    } catch (error) {
        console.error('Admin level-up event update error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update level-up event.' }, { status: 500 });
    }
}
