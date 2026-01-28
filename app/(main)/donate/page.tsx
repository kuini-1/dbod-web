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

export default function DonatePage() {
    const [donationData, setDonationData] = useState<any>(null);
    const [donationTiers, setDonationTiers] = useState<DonationTier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                let infoResponse: any = { data: {} };
                let packagesResponse: any = { data: {} };
                let tiersResponse: any = { data: { tiers: [] } };
                
                // Fetch donation tiers (public endpoint, no auth required)
                try {
                    tiersResponse = await API.get('/donation-tiers');
                    setDonationTiers(tiersResponse.data.tiers || []);
                } catch (tiersError) {
                    console.error('Could not fetch donation tiers:', tiersError);
                    setDonationTiers([]);
                }
                
                // Try to fetch donation info (total donated and first time status)
                try {
                    infoResponse = await API.get('/donation-info');
                } catch (infoError) {
                    console.log('Could not fetch donation-info (might not be logged in):', infoError);
                }
                
                // Try to fetch donation packages data
                try {
                    packagesResponse = await API.post("/donate", {});
                } catch (packagesError) {
                    console.log('Could not fetch donate packages (might not be logged in):', packagesError);
                    // If not logged in, use default data
                    packagesResponse = {
                        data: {
                            DonationData: [
                                { id: 1, price: 5, CP: 50 },
                                { id: 2, price: 10, CP: 105 },
                                { id: 3, price: 25, CP: 275 },
                                { id: 4, price: 50, CP: 575 },
                                { id: 5, price: 80, CP: 960 },
                                { id: 6, price: 100, CP: 1250 }
                            ],
                            BonusCP: 0.25,
                            FirstTimeDonate: true
                        }
                    };
                }
                
                // Combine the data
                const combinedData = {
                    ...packagesResponse.data,
                    TotalDonated: infoResponse.data?.TotalDonated || 0,
                    FirstTimeDonate: packagesResponse.data?.FirstTimeDonate ?? infoResponse.data?.FirstTimeDonate ?? true,
                    BonusCP: packagesResponse.data?.BonusCP ?? 0.25
                };
                
                setDonationData(combinedData);
            } catch (error) {
                console.error('Error fetching donation data:', error);
                // Set default data on error
                setDonationData({
                    DonationData: [
                        { id: 1, price: 5, CP: 50 },
                        { id: 2, price: 10, CP: 105 },
                        { id: 3, price: 25, CP: 275 },
                        { id: 4, price: 50, CP: 575 },
                        { id: 5, price: 80, CP: 960 },
                        { id: 6, price: 100, CP: 1250 }
                    ],
                    BonusCP: 0.25,
                    FirstTimeDonate: true
                });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="text-white bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-4"></div>
                    <div className="text-xl">Loading...</div>
                </div>
            </div>
        );
    }

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
                />

                {/* Main Content: Packages and Tier Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column: Package Grid */}
                    <div className="lg:col-span-2">
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
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Donation Tier Cards (Sticky) */}
                    {donationTiers.length > 0 && (
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-gradient-to-br from-stone-800/95 via-stone-850/95 to-stone-900/95 backdrop-blur-md rounded-2xl p-5 md:p-6 border-2 border-white/10 shadow-2xl">
                                    <h2 className="text-xl md:text-2xl font-bold text-center mb-6 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                        {local.donationTiers || 'Donation Tiers'}
                                    </h2>
                                    <DonationTierCards 
                                        totalDonated={donationData?.TotalDonated || 0}
                                        donationTiers={donationTiers}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
