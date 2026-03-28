'use client';

import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faDollarSign, faGift, faCheck } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { useLocale } from '@/components/LocaleProvider';

interface DonationTier {
    id: number;
    amount: number;
    title: string;
    rewardItems?: Array<{
        tblidx: number;
        amount: number;
        sortOrder?: number | null;
        item: {
            tblidx: number;
            name_en: string;
            name_kr: string | null;
            iconUrl: string | null;
        };
    }>;
    icon: string;
    order: number;
    claimed?: boolean;
}

interface EnhancedTierProgressProps {
    totalDonated: number;
    isFirstTimeDonor: boolean;
    donationTiers: DonationTier[];
}

export default function EnhancedTierProgress({ 
    totalDonated, 
    isFirstTimeDonor, 
    donationTiers 
}: EnhancedTierProgressProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [hoveredTier, setHoveredTier] = useState<number | null>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    if (!donationTiers || !Array.isArray(donationTiers) || donationTiers.length === 0) {
        return null;
    }

    const handleMouseEnter = (index: number, event: React.MouseEvent) => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const containerRect = event.currentTarget.parentElement?.getBoundingClientRect();
        if (containerRect && donationTiers.length > 1) {
            const tierPercentage = (index / (donationTiers.length - 1)) * 100;
            const leftPosition = (containerRect.width * tierPercentage) / 100;
            
            setPopupPosition({
                top: 90,
                left: leftPosition
            });
        } else if (containerRect && donationTiers.length === 1) {
            setPopupPosition({
                top: 90,
                left: containerRect.width / 2
            });
        }
        setHoveredTier(index);
    };

    const handleMouseLeave = () => {
        if (!isPopupHovered) {
            hideTimeoutRef.current = setTimeout(() => {
                setHoveredTier(null);
            }, 200);
        }
    };

    const handlePopupMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        setIsPopupHovered(true);
    };

    const handlePopupMouseLeave = () => {
        setIsPopupHovered(false);
        if (hoveredTier !== null) {
            hideTimeoutRef.current = setTimeout(() => {
                setHoveredTier(null);
            }, 200);
        }
    };

    const isTierReached = (tierAmount: number) => totalDonated >= tierAmount;

    const getCurrentTierProgress = () => {
        if (!donationTiers || donationTiers.length === 0) return 0;
        
        let currentTierIndex = 0;
        for (let i = donationTiers.length - 1; i >= 0; i--) {
            if (donationTiers[i] && totalDonated >= (donationTiers[i].amount || 0)) {
                currentTierIndex = i;
                break;
            }
        }

        if (currentTierIndex === donationTiers.length - 1) {
            return 100;
        }

        const currentTier = donationTiers[currentTierIndex];
        const nextTier = donationTiers[currentTierIndex + 1];
        
        if (!currentTier || !nextTier) return 0;
        
        const currentTierAmount = currentTier.amount || 0;
        const nextTierAmount = nextTier.amount || 0;
        const tierRange = nextTierAmount - currentTierAmount;
        
        if (tierRange <= 0) return 100;
        
        const progressInTier = totalDonated - currentTierAmount;
        const tierProgress = (progressInTier / tierRange) * 100;
        const tierPosition = (currentTierIndex / (donationTiers.length - 1)) * 100;
        const nextTierPosition = ((currentTierIndex + 1) / (donationTiers.length - 1)) * 100;
        const tierWidth = nextTierPosition - tierPosition;
        
        return tierPosition + (tierProgress * tierWidth / 100);
    };

    const progress = getCurrentTierProgress();

    return (
        <div className="w-full relative">
            <div className="relative space-y-5">
                {/* Enhanced Total Donated Display */}
                <div className="flex items-center justify-between bg-gradient-to-r from-stone-800 via-stone-850 to-stone-900 rounded-xl px-5 py-4 border-2 border-red-500/30 shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg p-3 border border-red-500/30">
                            <FontAwesomeIcon icon={faDollarSign} className="text-2xl text-red-400" />
                        </div>
                        <div>
                            <span className="text-xs text-white/60 block uppercase tracking-wide mb-1">{tx('Total Donated', '총 후원 금액')}</span>
                            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
                                ${totalDonated.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                    {isFirstTimeDonor && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border-2 border-green-500/40 shadow-lg animate-pulse-slow">
                            <FontAwesomeIcon icon={faGift} className="text-lg text-green-400" />
                            <span className="text-xs font-bold text-green-400 uppercase">{tx('First Time Bonus', '첫 결제 보너스')}</span>
                        </div>
                    )}
                </div>

                {/* Enhanced Progress Bar Container */}
                <div className="relative py-6">
                    {/* Progress Bar Background */}
                    <div className="h-4 bg-stone-800/70 backdrop-blur-sm rounded-full overflow-hidden border-2 border-white/10 shadow-inner">
                        {/* Animated Progress Fill */}
                        <div 
                            className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                            style={{ width: `${progress}%` }}
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine-slow" />
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-red-400 blur-md opacity-50" />
                        </div>
                    </div>

                    {/* Enhanced Tier Markers */}
                    <div className="absolute inset-0 flex items-center justify-between pt-2">
                        {donationTiers.map((tier, index) => {
                            if (!tier) return null;
                            const reached = isTierReached(tier.amount || 0);
                            
                            return (
                                <div
                                    key={tier.id || `tier-${tier.amount || index}-${index}`}
                                    className="relative group"
                                    onMouseEnter={(e) => handleMouseEnter(index, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Enhanced Tier Marker */}
                                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${
                                        reached 
                                            ? 'scale-110 shadow-lg shadow-red-500/50' 
                                            : 'scale-100 hover:scale-110'
                                    } ${
                                        reached
                                            ? 'bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400'
                                            : 'bg-gradient-to-br from-stone-700 to-stone-800 border-2 border-red-500/50'
                                    }`}>
                                        {/* Glow effect for reached tiers */}
                                        {reached && (
                                            <div className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-75 animate-pulse" />
                                        )}
                                        <FontAwesomeIcon 
                                            icon={faAward} 
                                            className={`text-lg relative z-10 ${
                                                reached ? 'text-white' : 'text-red-400'
                                            }`} 
                                        />
                                    </div>

                                    {/* Tier Amount Badge */}
                                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-sm transition-all duration-300 ${
                                            reached
                                                ? 'text-white bg-gradient-to-r from-red-500/90 to-red-600/90 border-red-400/50'
                                                : 'text-white/90 bg-stone-800/90 border-white/20'
                                        }`}>
                                            ${tier.amount || 0}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Enhanced Tier Popup */}
                    {hoveredTier !== null && hoveredTier >= 0 && hoveredTier < donationTiers.length && donationTiers[hoveredTier] && (
                        <div 
                            className="absolute w-80 bg-gradient-to-br from-stone-800 via-stone-850 to-stone-900 rounded-xl p-5 shadow-2xl border-2 border-red-500/30 z-50 backdrop-blur-sm animate-fade-in"
                            style={{
                                top: `${popupPosition.top}px`,
                                left: `${popupPosition.left}px`,
                                transform: 'translateX(-50%)'
                            }}
                            onMouseEnter={handlePopupMouseEnter}
                            onMouseLeave={handlePopupMouseLeave}
                        >
                            {/* Arrow */}
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-stone-800 rotate-45 border-t border-l border-red-500/30"></div>
                            
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${
                                    isTierReached(donationTiers[hoveredTier]?.amount || 0)
                                        ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30'
                                        : 'bg-stone-700/50 border border-white/10'
                                }`}>
                                    <FontAwesomeIcon 
                                        icon={faAward} 
                                        className={`text-xl ${
                                            isTierReached(donationTiers[hoveredTier]?.amount || 0)
                                                ? 'text-red-400'
                                                : 'text-white/60'
                                        }`} 
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                                    {donationTiers[hoveredTier]?.title || tx('Unknown Tier', '알 수 없는 티어')}
                                </h3>
                            </div>
                            
                            {/* Rewards List */}
                            <ul className="space-y-2.5 mb-4 max-h-48 overflow-y-auto">
                                {(donationTiers[hoveredTier]?.rewardItems && donationTiers[hoveredTier]!.rewardItems!.length > 0)
                                    ? donationTiers[hoveredTier]!.rewardItems!.map((reward, i) => (
                                        <li key={`reward-item-${hoveredTier}-${reward.tblidx}-${i}`} className="flex items-start text-sm text-white/90">
                                            <div className="w-8 h-8 rounded-lg bg-stone-800/60 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 border border-white/10 overflow-hidden">
                                                {reward.item?.iconUrl ? (
                                                    <Image
                                                        src={reward.item.iconUrl}
                                                        alt={reward.item.name_en}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faCheck} className="text-green-400 text-xs" />
                                                )}
                                            </div>
                                            <span className="leading-relaxed">
                                                {reward.item?.name_en || `Item ${reward.tblidx}`} <span className="text-white/50">x</span>{reward.amount}
                                            </span>
                                        </li>
                                    ))
                                    : (
                                        <li className="text-sm text-white/50">{tx('No rewards configured.', '설정된 보상이 없습니다.')}</li>
                                    )}
                            </ul>
                            
                            {/* Action Button */}
                            <div className="pt-4 border-t border-white/10">
                                <button 
                                    className={`w-full py-3 rounded-lg font-bold text-sm text-white transition-all duration-300 transform hover:scale-105 ${
                                        isTierReached(donationTiers[hoveredTier]?.amount || 0)
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg'
                                            : 'bg-stone-700 cursor-not-allowed opacity-50'
                                    }`}
                                    disabled={!isTierReached(donationTiers[hoveredTier]?.amount || 0)}
                                >
                                    {isTierReached(donationTiers[hoveredTier]?.amount || 0) 
                                        ? tx('Claim Rewards', '보상 수령') 
                                        : `$${Math.max(0, (donationTiers[hoveredTier]?.amount || 0) - totalDonated).toLocaleString()} ${tx('more needed', '추가 필요')}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
