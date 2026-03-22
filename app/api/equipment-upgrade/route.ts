import { NextRequest, NextResponse } from 'next/server';
import { characters } from '../../../lib/models/characters';
import { getUserFromRequest } from '../../../lib/auth/utils';
import { syncItemWorth } from '../../../lib/utils/character-bridge';

const TOKENS_PER_PERCENT = 5;
const MAX_ITEM_WORTH = 255;

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const { CharID } = body;
        const upgradeAmount = Math.floor(Number(body.upgradeAmount));

        if (!CharID) {
            return NextResponse.json({ success: false, message: 'CharID is required' }, { status: 400 });
        }
        if (!Number.isFinite(upgradeAmount) || upgradeAmount < 1) {
            return NextResponse.json({ success: false, message: 'upgradeAmount must be a positive integer' }, { status: 400 });
        }

        const char = await characters.findOne({
            where: { CharID, AccountID: user.AccountID }
        });

        if (!char) {
            return NextResponse.json({ success: false, message: 'Character not found' }, { status: 404 });
        }

        const tokens = char.CCBD_Token ?? 0;
        const itemWorth = char.Item_Worth ?? 0;
        const tokenCost = upgradeAmount * TOKENS_PER_PERCENT;

        if (tokenCost > tokens) {
            return NextResponse.json({ success: false, message: 'Not enough CCBD tokens' }, { status: 400 });
        }

        const newItemWorth = itemWorth + upgradeAmount;
        if (newItemWorth > MAX_ITEM_WORTH) {
            return NextResponse.json(
                { success: false, message: `Cannot exceed ${MAX_ITEM_WORTH}% upgraded stats` },
                { status: 400 }
            );
        }

        const newTokens = tokens - tokenCost;

        await char.update({ CCBD_Token: newTokens });
        await syncItemWorth(char.CharID, newItemWorth);

        return NextResponse.json({
            success: true,
            message: 'Equipment stats upgraded',
            Item_Worth: newItemWorth,
            CCBD_Token: newTokens
        }, { status: 200 });
    } catch (error) {
        console.error('Equipment upgrade error:', error);
        return NextResponse.json({ success: false, message: 'Failed to upgrade equipment stats' }, { status: 500 });
    }
}
