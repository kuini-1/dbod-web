import { NextRequest, NextResponse } from 'next/server';
import { syncCCBDEntry, postToBridge } from '@/lib/utils/character-bridge';

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const charId = body.CharID ?? body.charId;
    const value = body.CCBD_Entry ?? body.ccbdEntry ?? body.ccbd_entry;

    if (charId != null && value != null) {
        try {
            await syncCCBDEntry(Number(charId), Number(value));
            return NextResponse.json({ success: true, CharID: charId, CCBD_Entry: value }, { status: 200 });
        } catch (error) {
            console.error('update-ccbd-entry error:', error);
            return NextResponse.json({ error: 'Failed to update CCBD entry' }, { status: 500 });
        }
    }

    try {
        const response = await postToBridge('/api/update-ccbd-entry', body);
        if (!response.ok) {
            return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
        }
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
    }
}
