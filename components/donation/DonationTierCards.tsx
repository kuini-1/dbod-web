'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

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

interface DonationTierCardsProps {
    totalDonated: number;
    donationTiers: DonationTier[];
}

export default function DonationTierCards({ 
    totalDonated, 
    donationTiers 
}: DonationTierCardsProps) {
    if (!donationTiers || !Array.isArray(donationTiers) || donationTiers.length === 0) {
        return null;
    }

    const isTierReached = (tierAmount: number) => totalDonated >= tierAmount;

    // Sort tiers by amount
    const sortedTiers = [...donationTiers].sort((a, b) => (a.amount || 0) - (b.amount || 0));

    return (
        <div className="w-full space-y-4">
            {sortedTiers.map((tier, index) => {
                const reached = isTierReached(tier.amount || 0);
                const amountNeeded = Math.max(0, (tier.amount || 0) - totalDonated);
                
                return (
                    <div
                        key={tier.id || `tier-${tier.amount || index}-${index}`}
                        className={`relative bg-gradient-to-br ${
                            reached
                                ? 'from-red-500/20 via-red-600/20 to-red-500/20 border-2 border-red-500/50'
                                : 'from-stone-800/90 via-stone-850/90 to-stone-900/90 border-2 border-white/10'
                        } rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${
                                    reached
                                        ? 'bg-gradient-to-br from-red-500/30 to-red-600/30 border border-red-400/50'
                                        : 'bg-stone-700/50 border border-white/10'
                                }`}>
                                    <FontAwesomeIcon 
                                        icon={faAward} 
                                        className={`text-xl ${
                                            reached ? 'text-red-400' : 'text-white/60'
                                        }`} 
                                    />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${
                                        reached
                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600'
                                            : 'text-white/90'
                                    }`}>
                                        {tier.title || `Tier ${index + 1}`}
                                    </h3>
                                    <div className="text-sm text-white/60">
                                        ${tier.amount || 0} Required
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                                reached
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-stone-700/50 text-white/60 border border-white/10'
                            }`}>
                                {reached ? (
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                        Unlocked
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faLock} className="text-xs" />
                                        Locked
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        {!reached && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                                    <span>Progress</span>
                                    <span>${totalDonated.toLocaleString()} / ${tier.amount || 0}</span>
                                </div>
                                <div className="h-2 bg-stone-800/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${Math.min((totalDonated / (tier.amount || 1)) * 100, 100)}%` 
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-red-400 mt-1 font-semibold">
                                    ${amountNeeded.toLocaleString()} more needed
                                </div>
                            </div>
                        )}

                        {/* Rewards List */}
                        <div className="space-y-2">
                            <div className="text-xs text-white/60 uppercase tracking-wide mb-2">Rewards:</div>
                            <ul className="space-y-2">
                                {(tier.rewardItems && tier.rewardItems.length > 0)
                                    ? tier.rewardItems.map((reward, i) => (
                                        <li key={`reward-item-${tier.id}-${reward.tblidx}-${i}`} className="flex items-start text-sm text-white/90">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 border overflow-hidden ${
                                                reached
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : 'bg-stone-700/50 border-white/10'
                                            }`}>
                                                {reward.item?.iconUrl ? (
                                                    <Image
                                                        src={reward.item.iconUrl}
                                                        alt={reward.item.name_en}
                                                        width={32}
                                                        height={32}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon
                                                        icon={faCheck}
                                                        className={`text-xs ${reached ? 'text-green-400' : 'text-white/40'}`}
                                                    />
                                                )}
                                            </div>
                                            <span className={`leading-relaxed ${reached ? '' : 'text-white/60'}`}>
                                                {reward.item?.name_en || `Item ${reward.tblidx}`} <span className="text-white/50">×</span>{reward.amount}
                                            </span>
                                        </li>
                                    ))
                                    : (
                                        <li className="text-sm text-white/50">No rewards configured.</li>
                                    )}
                            </ul>
                        </div>

                        {/* Claim Button */}
                        {reached && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button className="w-full py-3 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer">
                                    Claim Rewards
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
