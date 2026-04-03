'use client';

import { useEffect, useState } from 'react';
import { API } from '../lib/api/client';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faTimes, faGift, faClock, faBox, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useLocale } from './LocaleProvider';

interface PopupBanner {
    id: number;
    title: string;
    active: boolean;
    price?: number; // Price in USD
    packageId?: number; // Package ID for Stripe checkout
    cashPoints?: number; // Cash points included in this banner
    items?: BannerItem[];
}

type CharacterRace = 'human' | 'majin' | 'namekian';
type CharacterGender = 'male' | 'female';

interface CharacterModel {
    race: CharacterRace;
    gender: CharacterGender;
    label: string;
    shortLabel: string;
}

interface BannerItem {
    tblidx: number;
    amount: number;
    sortOrder?: number | null;
    item: {
        tblidx: number;
        name: string;
        iconUrl: string | null;
    };
}

export default function PopupBanner() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [popups, setPopups] = useState<PopupBanner[]>([]);
    const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<{race: CharacterRace; gender: CharacterGender}>({ race: 'human', gender: 'male' });
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] = useState(false);
    const router = useRouter();

    // Character model options
    const characterModels: CharacterModel[] = [
        { race: 'human', gender: 'male', label: 'Human Male', shortLabel: 'Human M' },
        { race: 'human', gender: 'female', label: 'Human Female', shortLabel: 'Human F' },
        { race: 'majin', gender: 'male', label: 'Majin Male', shortLabel: 'Majin M' },
        { race: 'majin', gender: 'female', label: 'Majin Female', shortLabel: 'Majin F' },
        { race: 'namekian', gender: 'male', label: 'Namekian', shortLabel: 'Namekian' },
    ];

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const isSuccess = params.get('success') === 'true';
        const isBannerPurchase = params.get('bannerPurchase') === '1';
        if (isSuccess && isBannerPurchase) {
            setShowPurchaseSuccessModal(true);
            params.delete('bannerPurchase');
            const nextQuery = params.toString();
            const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
            window.history.replaceState({}, '', nextUrl);
        }
    }, []);

    useEffect(() => {
        const fetchPopups = async () => {
            try {
                const gqlRes = await fetch('/api/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `
                          query PopupBanners($lang: String) {
                            popupBanners(lang: $lang) {
                              id
                              title
                              active
                              price
                              packageId
                              cashPoints
                              items {
                                tblidx
                                amount
                                sortOrder
                                item { tblidx name iconUrl }
                              }
                            }
                          }
                        `,
                        variables: { lang: locale },
                    }),
                });

                const gqlJson = await gqlRes.json();
                const data: PopupBanner[] = gqlJson?.data?.popupBanners || [];

                if (Array.isArray(data) && data.length > 0) {
                    const filteredPopups = data.filter((popup: PopupBanner) => {
                        if (popup.active === false) return false;
                        const dismissedPopups = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('dismissedPopups') || '{}' : '{}');
                        const lastDismissed = dismissedPopups[popup.id];

                        if (lastDismissed) {
                            const dismissedTime = new Date(lastDismissed).getTime();
                            const currentTime = new Date().getTime();
                            const hoursSinceDismissed = (currentTime - dismissedTime) / (1000 * 60 * 60);
                            return hoursSinceDismissed >= 24;
                        }

                        return true;
                    });
                    setPopups(filteredPopups);
                    if (filteredPopups.length > 0) {
                        setTimeout(() => setIsVisible(true), 100);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch popup banners:', error);
            }
        };

        fetchPopups();
    }, [locale]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            if (dontShowAgain && typeof window !== 'undefined') {
                const dismissedPopups = JSON.parse(localStorage.getItem('dismissedPopups') || '{}');
                dismissedPopups[popups[currentPopupIndex].id] = new Date().toISOString();
                localStorage.setItem('dismissedPopups', JSON.stringify(dismissedPopups));
            }

            if (currentPopupIndex < popups.length - 1) {
                setCurrentPopupIndex(currentPopupIndex + 1);
                setIsClosing(false);
                setTimeout(() => setIsVisible(true), 50);
            } else {
                setPopups([]);
            }
            setDontShowAgain(false);
        }, 300);
    };

    const handlePurchase = async () => {
        const currentPopup = popups[currentPopupIndex];
        const hasPackagePurchase = !!currentPopup.packageId;
        const hasPricePurchase = typeof currentPopup.price === 'number' && currentPopup.price > 0;

        if (!hasPackagePurchase && !hasPricePurchase) {
            alert(tx('This banner is not configured for purchase. Please contact support.', '이 배너는 구매 설정이 되어 있지 않습니다. 관리자에게 문의하세요.'));
            return;
        }

        setIsPurchasing(true);

        try {
            // Ensure token cookie is set
            const token = localStorage.getItem('authToken');
            if (token) {
                const isSecure = window.location.protocol === 'https:';
                const secureFlag = isSecure ? '; Secure' : '';
                document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
            }

            // Create Stripe Checkout Session - send packageId; price comes from package
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({
                    ...(hasPackagePurchase
                        ? { packageId: currentPopup.packageId }
                        : { amount: currentPopup.price }),
                    bannerId: currentPopup.id,
                    currency: 'usd', // PopupBanner is global; use USD by default
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push(`/login?redirect=/donate`);
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || tx('Failed to create checkout session', '체크아웃 세션 생성에 실패했습니다'));
            }

            const data = await response.json();

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error(tx('No checkout URL received', '체크아웃 URL을 받지 못했습니다'));
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert(error instanceof Error ? error.message : tx('Failed to start checkout. Please try again.', '결제를 시작하지 못했습니다. 다시 시도해주세요.'));
            setIsPurchasing(false);
        }
    };

    const handleCharacterChange = (direction: 'prev' | 'next') => {
        const currentIndex = characterModels.findIndex(
            m => m.race === selectedCharacter.race && m.gender === selectedCharacter.gender
        );
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % characterModels.length;
        } else {
            newIndex = (currentIndex - 1 + characterModels.length) % characterModels.length;
        }
        const newModel = characterModels[newIndex];
        setSelectedCharacter({ race: newModel.race, gender: newModel.gender });
    };

    // Get character image filename based on race and gender
    const getCharacterImageFilename = (race: CharacterRace, gender: CharacterGender): string => {
        const filenameMap: Record<string, string> = {
            'human-male': 'hm.png',
            'human-female': 'hf.png',
            'majin-male': 'mm.png',
            'majin-female': 'mf.png',
            'namekian-male': 'no.png',
        };
        return filenameMap[`${race}-${gender}`] || 'hm.png';
    };

    if (popups.length === 0 && !showPurchaseSuccessModal) return null;

    const hasPopup = popups.length > 0;
    const currentPopup = hasPopup ? popups[currentPopupIndex] : null;
    const currentModel = characterModels.find(
        m => m.race === selectedCharacter.race && m.gender === selectedCharacter.gender
    ) || characterModels[0];
    
    // Get character preview image path - computed based on current selection
    // Add cache-busting query parameter to prevent stale image caching
    // Using popup ID and character selection ensures cache updates when needed
    const characterImagePath = currentPopup
        ? `/banner/${currentPopup.id}/${getCharacterImageFilename(selectedCharacter.race, selectedCharacter.gender)}?t=${currentPopup.id}-${selectedCharacter.race}-${selectedCharacter.gender}`
        : '';

    return (
        <>
        {showPurchaseSuccessModal && (
            <div className="fixed inset-0 z-[10000]">
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowPurchaseSuccessModal(false)}
                />
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <div className="relative w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl">
                        <button
                            onClick={() => setShowPurchaseSuccessModal(false)}
                            className="absolute right-4 top-4 z-10 h-10 w-10 rounded-lg border border-slate-600/50 bg-slate-800/80 text-slate-300 transition-all duration-200 hover:scale-110 hover:bg-slate-700"
                            aria-label={tx('Close', '닫기')}
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                        </button>
                        <div className="pr-12">
                            <h3 className="mb-3 text-2xl font-bold text-emerald-300">
                                {tx('Purchase successful!', '구매가 완료되었습니다!')}
                            </h3>
                            <p className="text-base leading-relaxed text-slate-200">
                                {tx(
                                    'Your items are in Cashshop Storage. Please relog to see and claim them.',
                                    '아이템은 캐시샵 보관함에 지급되었습니다. 재접속 후 확인 및 수령해주세요.'
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {hasPopup && currentPopup && (
        <div className={`fixed inset-0 z-[9999] ${isClosing ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Main Modal */}
            <div 
                className={`relative w-full h-full flex items-center justify-center p-4 md:p-8 ${
                    isVisible && !isClosing ? 'animate-popup-enter' : isClosing ? 'animate-popup-exit' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 z-30 w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-110 border border-slate-600/50 cursor-pointer"
                        aria-label={tx('Close', '닫기')}
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-slate-300 text-lg" />
                    </button>

                    <div className="h-full flex flex-col md:flex-row">
                        {/* Left Side - Character Preview */}
                        <div className="relative w-full md:w-2/3 bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col">
                            {/* Character Preview Area */}
                            <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
                                </div>

                                {/* Character Image */}
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    <div className="relative w-full max-w-2xl h-full max-h-[600px] flex items-center justify-center">
                                        <Image
                                            key={`${currentPopup.id}-${selectedCharacter.race}-${selectedCharacter.gender}`}
                                            src={characterImagePath}
                                            alt={currentModel.label}
                                            width={800}
                                            height={800}
                                            className="w-full h-full object-contain"
                                            priority
                                            unoptimized
                                        />
                                    </div>
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={() => handleCharacterChange('prev')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all duration-200 hover:scale-110 border border-slate-600/50 cursor-pointer"
                                    aria-label="Previous character"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="text-slate-300" />
                                </button>
                                <button
                                    onClick={() => handleCharacterChange('next')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all duration-200 hover:scale-110 border border-slate-600/50 cursor-pointer"
                                    aria-label="Next character"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="text-slate-300" />
                                </button>
                            </div>

                            {/* Character Selector */}
                            <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
                                <div className="flex items-center justify-center gap-2">
                                    {characterModels.map((model) => {
                                        const isSelected = selectedCharacter.race === model.race && selectedCharacter.gender === model.gender;
                                        return (
                                            <button
                                                key={`${model.race}-${model.gender}`}
                                                onClick={() => setSelectedCharacter({ race: model.race, gender: model.gender })}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                                                }`}
                                            >
                                                {model.shortLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Package Info */}
                        <div className="w-full md:w-1/3 bg-slate-800/50 flex flex-col border-t md:border-t-0 md:border-l border-slate-700/50">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-700/50">
                                <h2 className="text-3xl font-bold text-white">{currentPopup.title}</h2>
                            </div>

                            {/* Package Items */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGift} className="text-indigo-400" />
                                    {tx('Package Contents', '패키지 구성품')}
                                </h3>
                                
                                <div className="space-y-3">
                                    {/* Cash Points (if available) */}
                                    {currentPopup.cashPoints && currentPopup.cashPoints > 0 && (
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg border border-indigo-500/50 hover:border-indigo-400/50 transition-all duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-800/50 flex items-center justify-center border border-indigo-600/50">
                                                    <FontAwesomeIcon icon={faGem} className="text-indigo-300 text-xl" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{tx('Cash Points', '캐시 포인트')}</div>
                                                </div>
                                            </div>
                                            <div className="text-indigo-300 font-semibold">
                                                {`x${currentPopup.cashPoints}`}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {(currentPopup.items || []).map((row, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                                                    {row.item?.iconUrl ? (
                                                        <Image
                                                            src={row.item.iconUrl}
                                                            alt={row.item.name}
                                                            width={40}
                                                            height={40}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
                                                            —
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{row.item?.name || `Item ${row.tblidx}`}</div>
                                                </div>
                                            </div>
                                            <div className="text-indigo-400 font-semibold">
                                                {`x${row.amount}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Purchase Section */}
                            <div className="p-6 border-t border-slate-700/50 bg-slate-900/30">
                                <div className="space-y-4">
                                    {/* Price Display */}
                                    <div className="text-center pt-2">
                                        <div className="text-sm text-slate-400 mb-1">{tx('Special Offer', '특가 상품')}</div>
                                        <div className="text-3xl font-bold text-white">
                                            {currentPopup.price != null
                                                ? `$${currentPopup.price.toFixed(2)} USD`
                                                : tx('Contact support', '문의 필요')}
                                        </div>
                                    </div>
                                    
                                    {/* Purchase Button */}
                                    <button
                                        onClick={handlePurchase}
                                        disabled={isPurchasing}
                                        className="w-full h-14 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg text-white flex items-center justify-center gap-2 border-0 outline-none focus:outline-none leading-none hover:shadow-lg hover:shadow-indigo-500/50 transition-all duration-200 cursor-pointer"
                                    >
                                            {isPurchasing ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {tx('Processing...', '처리 중...')}
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faGift} />
                                                {tx('Purchase Now', '지금 구매')}
                                            </>
                                        )}
                                    </button>

                                    {/* Don't show again */}
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="dontShowAgain"
                                            checked={dontShowAgain}
                                            onChange={(e) => setDontShowAgain(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
                                        />
                                        <label htmlFor="dontShowAgain" className="text-slate-400 text-xs cursor-pointer hover:text-slate-300 transition-colors">
                                            {tx("Don't show again for 24 hours", '24시간 동안 다시 보지 않기')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )}
        </>
    );
}
