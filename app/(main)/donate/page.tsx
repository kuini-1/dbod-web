'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import { local, formatString } from '@/lib/utils/localize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faGem } from '@fortawesome/free-solid-svg-icons';
import PackageCard from '@/components/donation/PackageCard';
import UrgencyIndicator from '@/components/donation/UrgencyIndicator';
import DonationTierCards from '@/components/donation/DonationTierCards';
import QuickPurchase from '@/components/donation/QuickPurchase';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

interface DonationPackage {
    id: number;
    price: number;
    CP: number;
}

interface CharacterOption {
    CharID: number;
    CharName: string;
}

const DEFAULT_DONATION_DATA = {
    DonationData: [
        { id: 1, price: 5, CP: 50 },
        { id: 2, price: 10, CP: 105 },
        { id: 3, price: 25, CP: 275 },
        { id: 4, price: 50, CP: 575 },
        { id: 5, price: 80, CP: 960 },
        { id: 6, price: 100, CP: 1250 }
    ],
    BonusCP: 0.25,
    FirstTimeDonate: true,
    claimedTierIds: [],
    mallpoints: 0,
    TotalDonated: 0
};

const CURRENCIES = [
    { code: 'usd', label: 'USD', region: 'International' },
    { code: 'brl', label: 'BRL', region: 'Brazil (PIX)' },
    { code: 'krw', label: 'KRW', region: 'Korea (Kakao Pay, Payco, Naver Pay)' },
    { code: 'eur', label: 'EUR', region: 'Europe (iDEAL, Bancontact, etc.)' },
] as const;

export default function DonatePage() {
    const [donationData, setDonationData] = useState<any>(null);
    const [donationTiers, setDonationTiers] = useState<DonationTier[]>([]);
    const [characters, setCharacters] = useState<CharacterOption[]>([]);
    const [currency, setCurrency] = useState<string>('usd');
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [tiersLoading, setTiersLoading] = useState(true);
    const [infoLoading, setInfoLoading] = useState(true);
    const [charactersLoading, setCharactersLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setDonationData(DEFAULT_DONATION_DATA);

                API.get('/donation-tiers')
                    .then((tiersResponse) => {
                        setDonationTiers(tiersResponse.data.tiers || []);
                    })
                    .catch((tiersError) => {
                        console.error('Could not fetch donation tiers:', tiersError);
                        setDonationTiers([]);
                    })
                    .finally(() => setTiersLoading(false));

                API.get('/donation-info')
                    .then((infoResponse) => {
                        setDonationData((prev: any) => ({
                            ...(prev || DEFAULT_DONATION_DATA),
                            TotalDonated: infoResponse.data?.TotalDonated || 0,
                            FirstTimeDonate: prev?.FirstTimeDonate ?? infoResponse.data?.FirstTimeDonate ?? true,
                            claimedTierIds: infoResponse.data?.claimedTierIds || [],
                            mallpoints: Number(infoResponse.data?.mallpoints ?? 0)
                        }));
                    })
                    .catch((infoError) => {
                        console.log('Could not fetch donation-info (might not be logged in):', infoError);
                    })
                    .finally(() => setInfoLoading(false));

                API.get('/characters')
                    .then((charactersResponse) => {
                        if (charactersResponse.status === 200 && charactersResponse.data?.success) {
                            setCharacters(charactersResponse.data.characters || []);
                        } else {
                            setCharacters([]);
                        }
                    })
                    .catch(() => setCharacters([]))
                    .finally(() => setCharactersLoading(false));

                API.post("/donate", {})
                    .then((packagesResponse) => {
                        setDonationData((prev: any) => ({
                            ...(prev || DEFAULT_DONATION_DATA),
                            ...packagesResponse.data,
                            FirstTimeDonate: packagesResponse.data?.FirstTimeDonate ?? prev?.FirstTimeDonate ?? true,
                            BonusCP: packagesResponse.data?.BonusCP ?? prev?.BonusCP ?? 0.25
                        }));
                    })
                    .catch((packagesError) => {
                        console.log('Could not fetch donate packages (might not be logged in):', packagesError);
                    })
                    .finally(() => setPackagesLoading(false));
            } catch (error) {
                console.error('Error fetching donation data:', error);
                setDonationData(DEFAULT_DONATION_DATA);
                setDonationTiers([]);
                setCharacters([]);
                setPackagesLoading(false);
                setTiersLoading(false);
                setInfoLoading(false);
                setCharactersLoading(false);
            }
        })();
    }, []);

    const DonationData: DonationPackage[] = donationData?.DonationData || [
        { id: 1, price: 5, CP: 50 },
        { id: 2, price: 10, CP: 105 },
        { id: 3, price: 25, CP: 275 },
        { id: 4, price: 50, CP: 575 },
        { id: 5, price: 80, CP: 960 },
        { id: 6, price: 100, CP: 1250 }
    ];

    // Calculate CP per dollar for each package to determine best value
    const packagesWithValue = DonationData.map(pkg => {
        const eventBonusCP = donationData?.BonusCP && donationData.BonusCP > 0 
            ? Math.round(pkg.CP * donationData.BonusCP) 
            : 0;
        const firstTimeBonusCP = donationData?.FirstTimeDonate ? pkg.CP : 0;
        const totalCP = pkg.CP + eventBonusCP + firstTimeBonusCP;
        const cpPerDollar = totalCP / pkg.price;
        
        return {
            ...pkg,
            totalCP,
            cpPerDollar
        };
    });

    // Find best value package (highest CP per dollar)
    const bestValuePackage = packagesWithValue.reduce((best, current) => 
        current.cpPerDollar > best.cpPerDollar ? current : best
    );

    // Determine recommended package (usually the middle-high value package)
    const sortedByValue = [...packagesWithValue].sort((a, b) => b.cpPerDollar - a.cpPerDollar);
    const recommendedPackage = sortedByValue[Math.floor(sortedByValue.length / 2)];

    return (
        <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen duration-500 px-4 md:px-6 lg:px-8 py-8 md:py-12">
            {/* Animated Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Section */}
                <div className='text-center mb-10 md:mb-12'>
                    <div className="relative inline-block">
                        {/* Main Title */}
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-6 drop-shadow-2xl">
                            {local.donation || 'DONATION'}
                        </h1>
                        
                        {/* Underline accent */}
                        <div className="relative mx-auto mb-6">
                            <div className="h-1.5 w-48 bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-full shadow-lg mx-auto" />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <FontAwesomeIcon icon={faGem} className="text-2xl text-red-600 px-2" />
                            </div>
                        </div>
                        
                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light">
                            Get Cash Points instantly and unlock exclusive rewards
                        </p>
                        <p className="mt-3 text-sm md:text-base text-red-200/90">
                            Current Cash Points: <span className="font-semibold text-red-300">{Number(donationData?.mallpoints ?? 0).toLocaleString()}</span>
                        </p>

                        {/* Currency selector for regional payment methods */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <span className="text-white/70 text-sm">Payment currency:</span>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="w-[280px] sm:w-[320px]">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.label} — {c.region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Urgency Indicator */}
                <UrgencyIndicator 
                    bonusCP={donationData?.BonusCP}
                    firstTime={donationData?.FirstTimeDonate}
                />

                {/* Quick Purchase (for returning customers) */}
                <QuickPurchase 
                    bonusCP={donationData?.BonusCP}
                    firstTime={donationData?.FirstTimeDonate}
                    currency={currency}
                />

                {/* Main Content: Packages and Tier Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column: Package Grid */}
                    <div className="lg:col-span-2">
                        {packagesLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <div key={`pkg-skeleton-${idx}`} className="rounded-2xl border-2 border-white/10 bg-stone-900/60 p-5 animate-pulse">
                                        <div className="h-5 w-24 rounded bg-white/10 mb-4" />
                                        <div className="h-8 w-32 rounded bg-white/10 mb-3" />
                                        <div className="h-4 w-full rounded bg-white/10 mb-2" />
                                        <div className="h-4 w-2/3 rounded bg-white/10 mb-6" />
                                        <div className="h-10 w-full rounded-xl bg-white/10" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                                {DonationData.map((pkg, index) => {
                                    const isBestValue = pkg.id === bestValuePackage.id;
                                    const isRecommended = pkg.id === recommendedPackage.id && !isBestValue;
                                    
                                    // Calculate CP per dollar
                                    const eventBonusCP = donationData?.BonusCP && donationData.BonusCP > 0 
                                        ? Math.round(pkg.CP * donationData.BonusCP) 
                                        : 0;
                                    const firstTimeBonusCP = donationData?.FirstTimeDonate ? pkg.CP : 0;
                                    const totalCP = pkg.CP + eventBonusCP + firstTimeBonusCP;
                                    const cpPerDollar = totalCP / pkg.price;

                                    return (
                                        <PackageCard
                                            key={pkg.id}
                                            id={pkg.id}
                                            price={pkg.price}
                                            baseCP={pkg.CP}
                                            bonusCP={donationData?.BonusCP}
                                            firstTime={donationData?.FirstTimeDonate}
                                            cpPerDollar={cpPerDollar}
                                            isBestValue={isBestValue}
                                            isRecommended={isRecommended}
                                            index={index}
                                            currency={currency}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Donation Tier Cards (Sticky) */}
                    {(tiersLoading || donationTiers.length > 0) && (
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-gradient-to-br from-stone-800/95 via-stone-850/95 to-stone-900/95 backdrop-blur-md rounded-2xl p-5 md:p-6 border-2 border-white/10 shadow-2xl">
                                    <h2 className="text-xl md:text-2xl font-bold text-center mb-6 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                        {local.donationTiers || 'Donation Tiers'}
                                    </h2>
                                    {tiersLoading ? (
                                        <div className="space-y-4">
                                            {Array.from({ length: 3 }).map((_, idx) => (
                                                <div key={`tier-skeleton-${idx}`} className="rounded-xl border-2 border-white/10 bg-stone-900/50 p-4 animate-pulse">
                                                    <div className="h-5 w-32 rounded bg-white/10 mb-3" />
                                                    <div className="h-4 w-24 rounded bg-white/10 mb-4" />
                                                    <div className="h-2 w-full rounded bg-white/10 mb-3" />
                                                    <div className="h-4 w-2/3 rounded bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <DonationTierCards 
                                            totalDonated={donationData?.TotalDonated || 0}
                                            donationTiers={donationTiers}
                                            claimedTierIds={donationData?.claimedTierIds || []}
                                            characters={characters}
                                            onClaimSuccess={() => {
                                                API.get('/donation-info').then((res) => {
                                                    if (res.data?.claimedTierIds !== undefined) {
                                                        setDonationData((prev: any) => ({
                                                            ...prev,
                                                            TotalDonated: res.data.TotalDonated,
                                                            claimedTierIds: res.data.claimedTierIds,
                                                            mallpoints: Number(res.data.mallpoints ?? prev?.mallpoints ?? 0)
                                                        }));
                                                    }
                                                });
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
