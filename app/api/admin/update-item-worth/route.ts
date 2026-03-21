import { NextRequest, NextResponse } from 'next/server';
import { syncItemWorth, postToBridge } from '@/lib/utils/character-bridge';

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const charId = body.CharID ?? body.charId;
    const value = body.Item_Worth ?? body.itemWorth ?? body.item_worth;

    if (charId != null && value != null) {
        try {
            await syncItemWorth(Number(charId), Number(value));
            return NextResponse.json({ success: true, CharID: charId, Item_Worth: value }, { status: 200 });
        } catch (error) {
            console.error('update-item-worth error:', error);
            return NextResponse.json({ error: 'Failed to update item worth' }, { status: 500 });
        }
    }

    try {
        const response = await postToBridge('/api/update-item-worth', body);
        if (!response.ok) {
            return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
        }
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
    }
}
