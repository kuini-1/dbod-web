'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faGem, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { API } from '@/lib/api/client';
import { useLocale } from '@/components/LocaleProvider';

interface QuickPurchaseProps {
    bonusCP?: number;
    firstTime?: boolean;
    currency?: string;
}

const CURRENCY_RATES: Record<string, number> = {
    usd: 1,
    brl: 6.0,
    krw: 1350,
    eur: 0.92,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    usd: '$',
    brl: 'R$',
    krw: '₩',
    eur: '€',
};

export default function QuickPurchase({ bonusCP, firstTime, currency = 'usd' }: QuickPurchaseProps) {
    const router = useRouter();
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const rate = CURRENCY_RATES[currency] || 1;
    const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';
    const [lastPurchase, setLastPurchase] = useState<{ price: number; cp: number } | null>(null);
    const [isReturningCustomer, setIsReturningCustomer] = useState(false);
    const [loading, setLoading] = useState<number | null>(null);
    
    // Map price to package ID
    const getPackageId = (price: number): number => {
        switch (price) {
            case 5: return 1;
            case 10: return 2;
            case 25: return 3;
            case 50: return 4;
            case 80: return 5;
            case 100: return 6;
            default: return 3; // Default to $25 package
        }
    };
    
    const handleQuickPurchase = async (price: number) => {
        const packageId = getPackageId(price);
        setLoading(price);
        
        try {
            const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ packageId, amount: price, currency }),
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    router.push(`/login?redirect=/donate`);
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || tx('Failed to create checkout session', '체크아웃 세션 생성 실패'));
            }
            
            const data = await response.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(tx('No checkout URL received', '체크아웃 URL을 받지 못했습니다'));
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert(error instanceof Error ? error.message : tx('Failed to start checkout. Please try again.', '결제를 시작하지 못했습니다. 다시 시도해주세요.'));
            setLoading(null);
        }
    };

    useEffect(() => {
        // Check if user has made previous purchases
        // This would typically come from the backend
        const checkReturningCustomer = async () => {
            try {
                const response = await API.get('/donation-info');
                if (response.data && response.data.TotalDonated > 0) {
                    setIsReturningCustomer(true);
                    // You could fetch last purchase from backend here
                    // For now, we'll use a default or calculate from total
                }
            } catch (error) {
                // User might not be logged in or no previous purchases
                setIsReturningCustomer(false);
            }
        };

        checkReturningCustomer();
    }, []);

    // Default quick purchase options (most popular packages)
    const quickOptions = [
        { price: 25, cp: 275, label: tx('Popular', '인기') },
        { price: 50, cp: 575, label: tx('Best Value', '최고 효율') },
        { price: 100, cp: 1250, label: tx('Maximum', '최대') }
    ];

    if (!isReturningCustomer) {
        return null; // Only show for returning customers
    }

    return (
        <div className="w-full bg-gradient-to-r from-purple-900/40 via-purple-800/40 to-purple-900/40 backdrop-blur-sm rounded-xl p-5 border-2 border-purple-500/50 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg p-2 border border-purple-500/30">
                    <FontAwesomeIcon icon={faBolt} className="text-xl text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{tx('Quick Purchase', '빠른 구매')}</h3>
                    <p className="text-xs text-white/60">{tx('One-click access to your favorites', '즐겨찾는 패키지를 원클릭 구매')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickOptions.map((option) => {
                    const eventBonusCP = bonusCP && bonusCP > 0 ? Math.round(option.cp * bonusCP) : 0;
                    const firstTimeBonusCP = firstTime ? option.cp : 0;
                    const totalCP = option.cp + eventBonusCP + firstTimeBonusCP;
                    const convertedPrice = option.price * rate;
                    const formattedPrice = currency === 'krw'
                        ? Math.round(convertedPrice).toLocaleString()
                        : convertedPrice.toFixed(2);

                    return (
                        <button
                            key={option.price}
                            onClick={() => handleQuickPurchase(option.price)}
                            disabled={loading === option.price}
                            className="group w-full text-left cursor-pointer disabled:cursor-not-allowed"
                        >
                            <div className={`bg-gradient-to-br from-stone-800/90 to-stone-900/90 rounded-lg p-4 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg ${loading === option.price ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-purple-400 font-semibold uppercase">
                                        {option.label}
                                    </span>
                                    <FontAwesomeIcon 
                                        icon={faArrowRight} 
                                        className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FontAwesomeIcon icon={faGem} className="text-lg text-red-400" />
                                    <span className="text-xl font-bold text-white">
                                        {totalCP.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-purple-400">
                                    {currencySymbol}{formattedPrice}
                                </div>
                                {(eventBonusCP > 0 || firstTimeBonusCP > 0) && (
                                    <div className="text-xs text-green-400 mt-1">
                                        +{(eventBonusCP + firstTimeBonusCP).toLocaleString()} {tx('bonus', '보너스')}
                                    </div>
                                )}
                                {loading === option.price && (
                                    <div className="text-xs text-purple-400 mt-2">{tx('Loading...', '로딩 중...')}</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
