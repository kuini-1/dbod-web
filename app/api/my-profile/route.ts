import { NextRequest, NextResponse } from 'next/server';
import { characters } from '../../../lib/models/characters';
import { donations } from '../../../lib/models/donations';
import { getUserFromRequest } from '../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        // Debug logging
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');
        console.log('[My-Profile API] Authorization header present:', !!authHeader);
        console.log('[My-Profile API] Cookie header present:', !!cookieHeader);
        
        const Account = await getUserFromRequest(request);
        
        if (!Account) {
            console.error('[My-Profile API] getUserFromRequest returned null - Unauthorized');
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }
        
        console.log('[My-Profile API] User authenticated:', Account.Username);

        const Characters: any = await characters.findAll({raw: true, where: {
            AccountID: Account.AccountID
        }});
        const DonationLog: any = await donations.findAll({raw: true, where: {
            Username: Account.Username
        }});

        if (Account && DonationLog) {
            return NextResponse.json(
                { Account: Account, Characters: Characters, DonationLog: DonationLog },
                { status: 201 }
            );
        }

        return NextResponse.json(
            { message: "Error fetching profile" },
            { status: 500 }
        );
    } catch (error) {
        console.error('My profile error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
