import jwt from 'jsonwebtoken';
import { JWT_TOKEN } from './jwt';
import { accounts } from '../models/accounts';
import type { NextRequest } from 'next/server';

export const getTokenFromRequest = (request: NextRequest): string | undefined => {
    // Prioritize Authorization header (more reliable for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Fallback to cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const trimmed = cookie.trim();
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                const rawValue = trimmed.substring(equalIndex + 1).trim();

                // Support both encoded and non-encoded cookie values
                try {
                    acc[key] = decodeURIComponent(rawValue);
                } catch {
                    acc[key] = rawValue;
                }
            }
            return acc;
        }, {} as Record<string, string>);

        if (cookies.token) return cookies.token;
    }

    return undefined;
};

export const getAccountIdFromSession = async (token: string | undefined): Promise<number | null> => {
    if (!token) return null;

    try {
        const verify: any = jwt.verify(token, JWT_TOKEN);
        if (!verify) return null;

        const user = await accounts.findOne({
            where: { Username: verify.subject }
        });

        return user ? user.AccountID : null;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
};

export const getUserFromToken = async (token: string | undefined) => {
    if (!token) return null;

    try {
        const verify: any = jwt.verify(token, JWT_TOKEN);
        if (!verify) return null;

        const user = await accounts.findOne({
            raw: true,
            where: { Username: verify.subject }
        });

        return user;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
};

export const getUserFromUsername = async (username: string | undefined) => {
    if (!username) return null;

    try {
        const user = await accounts.findOne({
            raw: true,
            where: { Username: username }
        });

        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

export const getUserFromRequest = async (request: NextRequest) => {
    // Try to get username from header (set by middleware) first
    const username = request.headers.get('x-username');
    if (username) {
        return await getUserFromUsername(username);
    }
    
    // Fallback to token verification
    const token = getTokenFromRequest(request);
    return await getUserFromToken(token);
};
