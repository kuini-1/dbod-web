import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, getTokenFromRequest } from './utils';

export async function ensureAuth(request: NextRequest) {
    const token = getTokenFromRequest(request);
    
    if (!token) {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    const user = await getUserFromToken(token);
    
    if (!user) {
        return NextResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Attach user to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user', JSON.stringify(user));
    
    return { user, requestHeaders };
}
