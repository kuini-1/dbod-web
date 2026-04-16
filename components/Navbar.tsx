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

type NavbarProps = {
    hasLevelupNotification?: boolean;
};

export function Navbar({ hasLevelupNotification = false }: NavbarProps) {
    const { locale, setLocale, t } = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasProfileNotification, setHasProfileNotification] = useState(false);
    const [hasDonateNotification, setHasDonateNotification] = useState(false);
    const [hasNewsNotification, setHasNewsNotification] = useState(false);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const res = await API.get("/private");
            if (res.status === 201 || res.status === 200) {
                setIsLoggedIn(true);
                setUser(res.data);

                const [charactersRes, donationInfoRes, donationTiersRes, newsUnclaimedRes] = await Promise.allSettled([
                    API.get('/characters'),
                    API.get('/donation-info'),
                    API.get('/donation-tiers'),
                    API.get('/news/unclaimed', { cache: 'no-store' }),
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

                const newsUnclaimed =
                    newsUnclaimedRes.status === 'fulfilled' &&
                    Boolean(newsUnclaimedRes.value.data?.hasUnclaimed);

                setHasProfileNotification(hasUpgradeableTokens);
                setHasDonateNotification(hasClaimableTier);
                setHasNewsNotification(newsUnclaimed);
            } else {
                setIsLoggedIn(false);
                setUser(null);
                setHasProfileNotification(false);
                setHasDonateNotification(false);
                setHasNewsNotification(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
            setUser(null);
            setHasProfileNotification(false);
            setHasDonateNotification(false);
            setHasNewsNotification(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();

        const handleLogin = () => {
            checkAuth();
        };

        const handleNewsClaimed = () => {
            void (async () => {
                try {
                    const res = await API.get('/news/unclaimed', { cache: 'no-store' });
                    if (res.status === 200 && res.data?.success) {
                        setHasNewsNotification(Boolean(res.data.hasUnclaimed));
                    }
                } catch {
                    setHasNewsNotification(false);
                }
            })();
        };

        window.addEventListener('user-logged-in', handleLogin);
        window.addEventListener('news-reward-claimed', handleNewsClaimed);

        return () => {
            window.removeEventListener('user-logged-in', handleLogin);
            window.removeEventListener('news-reward-claimed', handleNewsClaimed);
        };
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await API.get("/auth/logout");
            localStorage.removeItem('authToken');
            setIsLoggedIn(false);
            setUser(null);
            setHasProfileNotification(false);
            setHasDonateNotification(false);
            setHasNewsNotification(false);
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
                            <Link
                                href="/news"
                                className={`hover:text-red-400 transition-colors ${pathname === '/news' || pathname?.startsWith('/news/') ? 'text-red-400' : 'text-stone-300'} flex items-center gap-2`}
                            >
                                <span>{t('navItemNews')}</span>
                                {isLoggedIn && hasNewsNotification ? (
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                                ) : null}
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
                            <Link href="/event-schedule" className={`hover:text-red-400 transition-colors ${pathname === '/event-schedule' ? 'text-red-400' : 'text-stone-300'} flex items-center gap-2`}>
                                <span>{t('navItemEventSchedule')}</span>
                                {isLoggedIn && hasLevelupNotification ? (
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                                ) : null}
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
