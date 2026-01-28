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

        // This endpoint doesn't seem to return anything in the original
        return NextResponse.json(
            { message: "OK" },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donation log error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
