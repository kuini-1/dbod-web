'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem } from '@fortawesome/free-solid-svg-icons';

interface CPVisualizationProps {
    totalCP: number;
    baseCP: number;
    maxCP?: number; // Maximum CP from all packages for scaling
    size?: 'small' | 'medium' | 'large';
}

export default function CPVisualization({ 
    totalCP, 
    baseCP, 
    maxCP = 2000, 
    size = 'medium' 
}: CPVisualizationProps) {
    // Calculate visual representation
    // Show gems/bars proportional to CP amount
    const gemCount = Math.min(Math.ceil(totalCP / 100), 20); // Max 20 gems for visual clarity
    const percentage = maxCP > 0 ? Math.min((totalCP / maxCP) * 100, 100) : 0;
    
    const sizeClasses = {
        small: {
            gem: 'text-lg',
            container: 'h-12'
        },
        medium: {
            gem: 'text-2xl',
            container: 'h-16'
        },
        large: {
            gem: 'text-3xl',
            container: 'h-20'
        }
    };

    const currentSize = sizeClasses[size];

    return (
        <div className="w-full">
            {/* Visual Bar Representation */}
            <div className={`relative w-full ${currentSize.container} bg-stone-800/50 rounded-lg overflow-hidden border border-white/10 mb-3`}>
                {/* Filled portion */}
                <div 
                    className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-400 to-red-500 rounded-lg transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
                
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine-slow" />
                
                {/* CP Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white drop-shadow-lg">
                        {totalCP.toLocaleString()} CP
                    </span>
                </div>
            </div>

            {/* Gem Icons Representation */}
            <div className="flex items-center justify-center gap-1 flex-wrap">
                {Array.from({ length: gemCount }).map((_, index) => (
                    <div
                        key={index}
                        className={`${currentSize.gem} text-red-400 transition-all duration-300`}
                        style={{
                            animationDelay: `${index * 50}ms`,
                            opacity: index < gemCount ? 1 : 0.3
                        }}
                    >
                        <FontAwesomeIcon icon={faGem} />
                    </div>
                ))}
                {gemCount >= 20 && (
                    <span className="text-xs text-white/60 ml-2">+{totalCP - 2000} more</span>
                )}
            </div>

            {/* Value Indicator */}
            <div className="text-center mt-2">
                <div className="text-xs text-white/60">
                    Base: {baseCP.toLocaleString()} CP
                </div>
                {totalCP > baseCP && (
                    <div className="text-xs text-green-400 font-semibold">
                        +{(totalCP - baseCP).toLocaleString()} bonus CP
                    </div>
                )}
            </div>
        </div>
    );
}
