import { NextRequest, NextResponse } from 'next/server';
import { characters } from '../../../lib/models/characters';
import { accounts } from '../../../lib/models/accounts';
import { getUserFromRequest } from '../../../lib/auth/utils';

const REFILL_COST_CP = 25;

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { CharID } = await request.json();
        if (!CharID) {
            return NextResponse.json({ success: false, message: 'CharID is required' }, { status: 400 });
        }

        const char = await characters.findOne({
            where: { CharID, AccountID: user.AccountID }
        });

        if (!char) {
            return NextResponse.json({ success: false, message: 'Character not found' }, { status: 404 });
        }

        const ccbdEntry = char.CCBD_Entry ?? 0;
        const ccbdLimit = char.CCBD_Limit ?? 0;

        if (ccbdEntry >= ccbdLimit) {
            return NextResponse.json({ success: false, message: 'CCBD Entry already at max' }, { status: 400 });
        }

        const account = await accounts.findByPk(user.AccountID);
        if (!account) {
            return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
        }

        const mallpoints = account.mallpoints ?? 0;
        if (mallpoints < REFILL_COST_CP) {
            return NextResponse.json({ success: false, message: 'Not enough Cash Points. Need 25 CP.' }, { status: 400 });
        }

        await account.update({ mallpoints: mallpoints - REFILL_COST_CP });
        await char.update({ CCBD_Entry: ccbdLimit });

        return NextResponse.json({
            success: true,
            message: 'CCBD Entry refilled successfully',
            CCBD_Entry: ccbdLimit
        }, { status: 200 });
    } catch (error) {
        console.error('CCBD refill error:', error);
        return NextResponse.json({ success: false, message: 'Failed to refill' }, { status: 500 });
    }
}
