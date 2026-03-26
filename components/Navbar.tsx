'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API } from '../lib/api/client';
import { useLocale } from './LocaleProvider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function Navbar() {
    const { locale, setLocale, t } = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [serverTimeMs, setServerTimeMs] = useState<number | null>(null);
    const [hasProfileNotification, setHasProfileNotification] = useState(false);
    const [hasDonateNotification, setHasDonateNotification] = useState(false);

    const formatKstClock = (ms: number | null): string => {
        if (!ms) return '--:--:--';
        const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
        return new Date(ms + KST_OFFSET_MS).toISOString().slice(11, 19);
    };

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const res = await API.get("/private");
            if (res.status === 201 || res.status === 200) {
                setIsLoggedIn(true);
                setUser(res.data);
                const parsedServerTime = Date.parse(String(res.data?.serverTimeUtc ?? ''));
                if (Number.isFinite(parsedServerTime)) {
                    setServerTimeMs(parsedServerTime);
                } else {
                    setServerTimeMs(Date.now());
                }

                const [charactersRes, donationInfoRes, donationTiersRes] = await Promise.allSettled([
                    API.get('/characters'),
                    API.get('/donation-info'),
                    API.get('/donation-tiers'),
                ]);

                const characters = charactersRes.status === 'fulfilled'
                    ? (charactersRes.value.data?.characters || [])
                    : [];
                const hasUpgradeableTokens = characters.some((char: any) => Number(char?.CCBD_Token ?? 0) >= 5);

                const donationInfo = donationInfoRes.status === 'fulfilled'
                    ? donationInfoRes.value.data
                    : null;
                const tiers = donationTiersRes.status === 'fulfilled'
                    ? (donationTiersRes.value.data?.tiers || [])
                    : [];
                const totalDonated = Number(donationInfo?.TotalDonated ?? 0);
                const claimedTierIds: number[] = Array.isArray(donationInfo?.claimedTierIds)
                    ? donationInfo.claimedTierIds.map((id: any) => Number(id))
                    : [];
                const hasClaimableTier = tiers.some((tier: any) => {
                    const tierId = Number(tier?.id);
                    const tierAmount = Number(tier?.amount ?? 0);
                    return tierAmount <= totalDonated && !claimedTierIds.includes(tierId);
                });

                setHasProfileNotification(hasUpgradeableTokens);
                setHasDonateNotification(hasClaimableTier);
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setServerTimeMs(null);
                setHasProfileNotification(false);
                setHasDonateNotification(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setUser(null);
            setServerTimeMs(null);
            setHasProfileNotification(false);
            setHasDonateNotification(false);
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

    useEffect(() => {
        if (!isLoggedIn) return;
        const timer = setInterval(() => {
            setServerTimeMs((prev) => (prev ? prev + 1000 : prev));
        }, 1000);
        return () => clearInterval(timer);
    }, [isLoggedIn]);

    const handleLogout = async () => {
        try {
            await API.get("/auth/logout");
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
            setUser(null);
            setServerTimeMs(null);
            setHasProfileNotification(false);
            setHasDonateNotification(false);
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
                                {t('navItemHome')}
                            </Link>
                            <Link href="/news" className={`hover:text-red-400 transition-colors ${pathname === '/news' ? 'text-red-400' : 'text-stone-300'}`}>
                                {t('navItemNews')}
                            </Link>
                            <Link href="/donate" className={`hover:text-red-400 transition-colors ${pathname === '/donate' ? 'text-red-400' : 'text-stone-300'} flex items-center gap-2`}>
                                <span>{t('navItemDonation')}</span>
                                {isLoggedIn && hasDonateNotification ? (
                                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                ) : null}
                            </Link>
                            <Link href="/cashshop" className={`hover:text-red-400 transition-colors ${pathname === '/cashshop' ? 'text-red-400' : 'text-stone-300'}`}>
                                {t('navItemCashshop')}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Select value={locale} onValueChange={(value) => setLocale(value as 'en' | 'kr')}>
                            <SelectTrigger aria-label={t('navItemLanguage')} className="h-8 w-[88px] border-stone-700 bg-stone-800 text-stone-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">EN</SelectItem>
                                <SelectItem value="kr">KR</SelectItem>
                            </SelectContent>
                        </Select>
                        {isLoggedIn ? (
                            <span className="hidden lg:inline-flex text-xs font-mono text-red-200/90 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                                KST (UTC+9) {formatKstClock(serverTimeMs)}
                            </span>
                        ) : null}
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
                                    className="text-stone-300 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <span>{t('navSubItemProfile')}</span>
                                    {hasProfileNotification ? (
                                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                    ) : null}
                                </button>
                                <button onClick={handleLogout} className="text-stone-300 hover:text-red-400 transition-colors cursor-pointer">
                                    {t('navSubItemLogout')}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-stone-300 hover:text-red-400 transition-colors">
                                    {t('navSubItemLogin')}
                                </Link>
                                <Link href="/register" className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                    {t('navSubItemRegister')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
