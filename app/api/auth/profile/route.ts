import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        
        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            message: 'logged in',
            AccountID: user.AccountID,
            Username: user.Username,
            isGm: user.isGm,
            email: user.email,
            mallpoints: user.mallpoints,
            donated: user.donated
        }, { status: 200 });
    } catch (error) {
        console.error('Profile error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
