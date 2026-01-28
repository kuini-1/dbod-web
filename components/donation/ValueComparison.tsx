'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faChartLine } from '@fortawesome/free-solid-svg-icons';

interface Package {
    id: number;
    price: number;
    baseCP?: number;
    CP?: number; // Support both naming conventions
    bonusCP?: number;
    firstTime?: boolean;
}

interface ValueComparisonProps {
    packages: Package[];
    bonusCP?: number;
    firstTime?: boolean;
}

export default function ValueComparison({ packages, bonusCP, firstTime }: ValueComparisonProps) {
    // Calculate CP per dollar for each package
    const packagesWithValue = packages.map(pkg => {
        const baseCP = pkg.baseCP || pkg.CP || 0;
        const eventBonusCP = bonusCP && bonusCP > 0 ? Math.round(baseCP * bonusCP) : 0;
        const firstTimeBonusCP = firstTime ? baseCP : 0;
        const totalCP = baseCP + eventBonusCP + firstTimeBonusCP;
        const cpPerDollar = totalCP / pkg.price;
        
        return {
            ...pkg,
            totalCP,
            cpPerDollar
        };
    });
    
    // Find best value (highest CP per dollar)
    const bestValue = packagesWithValue.reduce((best, current) => 
        current.cpPerDollar > best.cpPerDollar ? current : best
    );

    return (
        <div className="w-full bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-500/10 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-500/30 shadow-lg mb-6">
            <div className="flex items-center justify-center gap-4">
                <FontAwesomeIcon icon={faTrophy} className="text-2xl text-yellow-400" />
                <div className="text-center">
                    <div className="text-sm text-white/70 mb-1">Best Value Package</div>
                    <div className="text-xl font-bold text-white">
                        ${bestValue.price} Package - {bestValue.cpPerDollar.toFixed(1)} CP per dollar
                    </div>
                </div>
            </div>
        </div>
    );
}
