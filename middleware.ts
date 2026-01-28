import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_TOKEN } from './lib/auth/jwt';

// Protected routes that require authentication
// Note: /panel handles its own auth check in the component
const protectedRoutes = [
    '/admin',
    '/daily-login',
    '/raffle'
];

// API routes that require authentication
const protectedApiRoutes = [
    '/api/auth/profile',
    '/api/auth/change-password',
    '/api/account',
    // Note: these endpoints perform their own auth via `getUserFromRequest()`.
    // Keeping them out of middleware avoids false 401s when cookies/headers differ.
    // '/api/characters',
    // '/api/my-profile',
    // '/api/donation-log',
    '/api/daily-rewards',
    '/api/raffle/enter'
];
// Note: /api/donate and /api/donation-info are public but return user-specific data if authenticated

function getTokenFromRequest(request: NextRequest, isApiRoute: boolean = false): string | undefined {
    // For API routes, prioritize Authorization header (more reliable)
    if (isApiRoute) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
    }
    
    // Try to get token from cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const trimmed = cookie.trim();
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                let value = trimmed.substring(equalIndex + 1).trim();
                
                // Try to decode URL-encoded values, but keep original if decoding fails
                // This handles both encoded and non-encoded cookies
                try {
                    const decoded = decodeURIComponent(value);
                    // Only use decoded if it's different (was actually encoded)
                    // Otherwise use original to avoid double-decoding
                    acc[key] = decoded !== value ? decoded : value;
                } catch {
                    // If decoding fails, use original value
                    acc[key] = value;
                }
            }
            return acc;
        }, {} as Record<string, string>);
        
        if (cookies.token) {
            return cookies.token;
        }
    }

    // Try to get token from Authorization header (fallback for page routes)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return undefined;
}

function verifyToken(token: string): { subject: string } | null {
    try {
        const verify: any = jwt.verify(token, JWT_TOKEN);
        return verify ? { subject: verify.subject } : null;
    } catch (error) {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if it's a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute || isProtectedApiRoute) {
        const token = getTokenFromRequest(request, isProtectedApiRoute);
        
        // Debug logging (can be removed in production)
        if (process.env.NODE_ENV === 'development') {
            const cookieHeader = request.headers.get('cookie');
            const authHeader = request.headers.get('authorization');
            console.log(`[Middleware] Checking route: ${pathname}`);
            console.log(`[Middleware] Is API route: ${isProtectedApiRoute}`);
            console.log(`[Middleware] Authorization header present: ${!!authHeader}`);
            console.log(`[Middleware] Authorization header preview: ${authHeader?.substring(0, 50) || 'none'}`);
            console.log(`[Middleware] Cookie header present: ${!!cookieHeader}`);
            console.log(`[Middleware] Cookie header preview: ${cookieHeader?.substring(0, 100) || 'none'}`);
            console.log(`[Middleware] Token found: ${!!token}`);
            if (token) {
                console.log(`[Middleware] Token length: ${token.length}`);
                console.log(`[Middleware] Token preview: ${token.substring(0, 20)}...`);
            } else {
                console.log(`[Middleware] No token found - checking why...`);
                if (cookieHeader) {
                    const cookies = cookieHeader.split(';').map(c => c.trim().split('=')[0]);
                    console.log(`[Middleware] Available cookie keys: ${cookies.join(', ')}`);
                }
            }
        }
        
        if (!token) {
            if (isProtectedApiRoute) {
                return NextResponse.json(
                    { message: 'Unauthorized' },
                    { status: 401 }
                );
            }
            // Redirect to login for page routes
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Verify token without database access (Edge runtime compatible)
        const verified = verifyToken(token);
        
        if (!verified) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Middleware] Token verification failed for route: ${pathname}`);
            }
            if (isProtectedApiRoute) {
                return NextResponse.json(
                    { message: 'Unauthorized' },
                    { status: 401 }
                );
            }
            // Redirect to login for page routes
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Add username to request headers for API routes (full user lookup happens in API route)
        if (isProtectedApiRoute) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-username', verified.subject);
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
