'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API } from '../lib/api/client';
import { local } from '../lib/utils/localize';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const res = await API.get("/private");
            if (res.status === 201 || res.status === 200) {
                setIsLoggedIn(true);
                setUser(res.data);
            } else {
                setIsLoggedIn(false);
                setUser(null);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
        
        // Listen for custom login event
        const handleLogin = () => {
            checkAuth();
        };
        
        window.addEventListener('user-logged-in', handleLogin);
        
        return () => {
            window.removeEventListener('user-logged-in', handleLogin);
        };
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await API.get("/auth/logout");
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
            setUser(null);
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="bg-stone-900/90 backdrop-blur-sm border-b border-stone-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="text-red-400 font-bold text-xl hover:text-red-300 transition-colors">
                            DBOD
                        </Link>
                        <div className="hidden md:flex space-x-6">
                            <Link href="/" className={`hover:text-red-400 transition-colors ${pathname === '/' ? 'text-red-400' : 'text-stone-300'}`}>
                                {local.navItemHome}
                            </Link>
                            <Link href="/news" className={`hover:text-red-400 transition-colors ${pathname === '/news' ? 'text-red-400' : 'text-stone-300'}`}>
                                {local.navItemNews}
                            </Link>
                            <Link href="/donate" className={`hover:text-red-400 transition-colors ${pathname === '/donate' ? 'text-red-400' : 'text-stone-300'}`}>
                                {local.navItemDonation}
                            </Link>
                            <Link href="/cashshop" className={`hover:text-red-400 transition-colors ${pathname === '/cashshop' ? 'text-red-400' : 'text-stone-300'}`}>
                                {local.navItemCashshop}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {isLoading ? (
                            // Skeleton loading state
                            <>
                                <div className="h-6 w-16 bg-stone-700/50 rounded animate-pulse" />
                                <div className="h-9 w-24 bg-stone-700/50 rounded animate-pulse" />
                            </>
                        ) : isLoggedIn ? (
                            <>
                                <button 
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        // Ensure cookie is set before navigating
                                        const token = localStorage.getItem('authToken');
                                        if (!token) {
                                            router.push('/login?redirect=/panel');
                                            return;
                                        }
                                        
                                        // Check if cookie exists
                                        const getCookies = () => {
                                            return document.cookie.split(';').reduce((acc, cookie) => {
                                                const [key, value] = cookie.trim().split('=');
                                                acc[key] = value;
                                                return acc;
                                            }, {} as Record<string, string>);
                                        };
                                        
                                        let cookies = getCookies();
                                        
                                        if (!cookies.token) {
                                            const isSecure = window.location.protocol === 'https:';
                                            const secureFlag = isSecure ? '; Secure' : '';
                                            document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                                            // Wait and verify cookie was set
                                            await new Promise(resolve => setTimeout(resolve, 200));
                                            cookies = getCookies();
                                            
                                            if (!cookies.token) {
                                                console.error('Failed to set cookie, redirecting to login');
                                                router.push('/login?redirect=/panel');
                                                return;
                                            }
                                        }
                                        
                                        router.push('/panel');
                                    }}
                                    className="text-stone-300 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    {local.navSubItemProfile}
                                </button>
                                <button onClick={handleLogout} className="text-stone-300 hover:text-red-400 transition-colors cursor-pointer">
                                    {local.navSubItemLogout}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-stone-300 hover:text-red-400 transition-colors">
                                    {local.navSubItemLogin}
                                </Link>
                                <Link href="/register" className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                    {local.navSubItemRegister}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
