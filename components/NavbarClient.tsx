'use client';

import { useEffect } from 'react';
import { Navbar } from './Navbar';

export default function NavbarClient() {
    useEffect(() => {
        // Sync cookie from localStorage on every page load
        // This ensures cookies are always set when there's a token
        const token = localStorage.getItem('authToken');
        if (token && typeof document !== 'undefined') {
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            
            if (!cookies.token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
            }
        }
    }, []);

    return <Navbar />;
}
