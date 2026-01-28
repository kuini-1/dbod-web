import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        const Account = await getUserFromRequest(request);
        
        if (!Account) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { Account: Account },
            { status: 201 }
        );
    } catch (error) {
        console.error('Account error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
