'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faCheck, faLock, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import { SuccessToast, WarningToast } from '@/lib/utils/toasts';

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
    claimedTierIds?: number[];
    characters?: Array<{ CharID: number; CharName: string }>;
    onClaimSuccess?: () => void;
}

export default function DonationTierCards({
    totalDonated,
    donationTiers,
    claimedTierIds = [],
    characters = [],
    onClaimSuccess
}: DonationTierCardsProps) {
    const [claimingTierId, setClaimingTierId] = useState<number | null>(null);
    const [selectedCharacterByTier, setSelectedCharacterByTier] = useState<Record<number, number>>({});

    // Use donation value (totalDonated) to check if tier is unlocked
    const isTierReached = (tierAmount: number) => totalDonated >= tierAmount;
    const isTierClaimed = (tierId: number) => claimedTierIds.includes(tierId);

    const handleClaim = async (tierId: number) => {
        const characterId = selectedCharacterByTier[tierId];
        if (!characterId) {
            WarningToast.fire('Please select a character for CCBD Limit +1 before claiming.');
            return;
        }
        if (claimingTierId) return;
        setClaimingTierId(tierId);
        try {
            const response = await API.post('/donation-tiers/claim', { tierId, characterId });
            if (response.status === 200 && response.data?.success) {
                SuccessToast.fire(response.data.message || 'Rewards claimed successfully!');
                onClaimSuccess?.();
            } else {
                WarningToast.fire(response.data?.message || 'Failed to claim rewards');
            }
        } catch (error) {
            WarningToast.fire('Failed to claim rewards');
        } finally {
            setClaimingTierId(null);
        }
    };

    // Sort tiers by amount
    const sortedTiers = [...donationTiers].sort((a, b) => (a.amount || 0) - (b.amount || 0));

    return (
        <div className="w-full space-y-4">
            {sortedTiers.map((tier, index) => {
                const reached = isTierReached(tier.amount || 0);
                const claimed = isTierClaimed(tier.id);
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
                                claimed
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : reached
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-stone-700/50 text-white/60 border border-white/10'
                            }`}>
                                {claimed ? (
                                    <span className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                        Claimed
                                    </span>
                                ) : reached ? (
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
                                <li className="flex items-start text-sm text-white/90">
                                    <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 border overflow-hidden ${
                                        reached
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-stone-700/50 border-white/10'
                                    }`}>
                                        <FontAwesomeIcon
                                            icon={faArrowUp}
                                            className={`text-xs ${reached ? 'text-green-400' : 'text-white/60'}`}
                                        />
                                    </div>
                                    <span className={`leading-relaxed ${reached ? '' : 'text-white/60'}`}>
                                        CCBD Limit +1
                                    </span>
                                </li>
                                {(tier.rewardItems && tier.rewardItems.length > 0)
                                    ? tier.rewardItems.map((reward, i) => (
                                        <li key={`reward-item-${tier.id}-${reward.tblidx}-${i}`} className="flex items-start text-sm text-white/90">
                                            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 border overflow-hidden ${
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
                                                <span className="absolute -bottom-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-md bg-black/80 border border-white/20 text-[10px] leading-none font-bold text-white flex items-center justify-center">
                                                    {reward.amount}
                                                </span>
                                            </div>
                                            <span className={`leading-relaxed ${reached ? '' : 'text-white/60'}`}>
                                                {reward.item?.name_en || `Item ${reward.tblidx}`}
                                            </span>
                                        </li>
                                    ))
                                    : (
                                        <li className="text-sm text-white/50">No rewards configured.</li>
                                    )}
                            </ul>
                        </div>

                        {/* Claim Button - only when reached and not yet claimed */}
                        {reached && !claimed && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <label className="mb-3 block">
                                    <span className="mb-1 block text-xs text-white/65">
                                        Select character for CCBD Limit +1:
                                    </span>
                                    <select
                                        value={selectedCharacterByTier[tier.id] ?? ''}
                                        onChange={(e) =>
                                            setSelectedCharacterByTier((prev) => ({
                                                ...prev,
                                                [tier.id]: Number(e.target.value)
                                            }))
                                        }
                                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                    >
                                        <option value="" disabled>Select character</option>
                                        {characters.map((char) => (
                                            <option key={char.CharID} value={char.CharID}>
                                                {char.CharName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    onClick={() => handleClaim(tier.id)}
                                    disabled={claimingTierId === tier.id || !selectedCharacterByTier[tier.id]}
                                    className="w-full py-3 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {claimingTierId === tier.id ? 'Claiming...' : 'Claim Rewards'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
