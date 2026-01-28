'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faFire, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';

interface PackageCardProps {
    id: number;
    price: number;
    baseCP: number;
    bonusCP?: number;
    firstTime?: boolean;
    cpPerDollar: number;
    isBestValue?: boolean;
    isRecommended?: boolean;
    index: number;
}

export default function PackageCard({
    id,
    price,
    baseCP,
    bonusCP,
    firstTime,
    cpPerDollar,
    isBestValue = false,
    isRecommended = false,
    index
}: PackageCardProps) {
    const [hover, setHover] = useState(false);
    const router = useRouter();
    
    // Calculate bonuses
    const eventBonusCP = bonusCP && bonusCP > 0 ? Math.round(baseCP * bonusCP) : 0;
    const firstTimeBonusCP = firstTime ? baseCP : 0;
    const totalCP = baseCP + eventBonusCP + firstTimeBonusCP;
    
    // Calculate savings percentage if applicable
    const hasBonuses = eventBonusCP > 0 || firstTimeBonusCP > 0;
    const bonusPercentage = hasBonuses 
        ? Math.round(((eventBonusCP + firstTimeBonusCP) / baseCP) * 100)
        : 0;

    return (
        <div 
            onMouseEnter={() => setHover(true)} 
            onMouseLeave={() => setHover(false)}
            className={`group relative w-full bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl overflow-hidden transition-all duration-500 ${
                hover ? 'scale-[1.03] shadow-2xl' : 'scale-100 shadow-lg'
            } border-2 ${
                isBestValue 
                    ? 'border-yellow-500/50 shadow-yellow-500/20' 
                    : isRecommended
                    ? 'border-red-500/50 shadow-red-500/20'
                    : 'border-white/10'
            }`}
            style={{
                animationDelay: `${index * 100}ms`
            }}
        >
            {/* Animated glowing border effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
                isBestValue 
                    ? 'from-yellow-500/30 via-yellow-400/30 to-yellow-500/30' 
                    : isRecommended
                    ? 'from-red-500/30 via-red-400/30 to-red-500/30'
                    : 'from-red-500/20 via-red-400/20 to-red-500/20'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />
            
            {/* Badge overlays - Center top */}
            {isBestValue && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 mt-4">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                        BEST VALUE
                    </div>
                </div>
            )}
            
            {isRecommended && !isBestValue && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 mt-4">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faFire} className="text-xs" />
                        POPULAR
                    </div>
                </div>
            )}
            
            {/* Main content */}
            <div className='relative p-6 space-y-5'>
                {/* Header: CP Display with animation */}
                <div className='flex items-start justify-between'>
                    <div className='flex items-center space-x-3'>
                        <div className={`relative ${hover ? 'animate-bounce' : ''}`}>
                            <FontAwesomeIcon 
                                icon={faGem} 
                                className={`text-4xl ${
                                    isBestValue 
                                        ? 'text-yellow-400' 
                                        : isRecommended
                                        ? 'text-red-400'
                                        : 'text-red-400'
                                } drop-shadow-lg`} 
                            />
                            {/* Glow effect */}
                            <div className={`absolute inset-0 blur-md ${
                                isBestValue 
                                    ? 'text-yellow-400' 
                                    : 'text-red-400'
                            } opacity-50`} />
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-4xl font-bold text-white leading-tight'>
                                {baseCP.toLocaleString()}
                            </span>
                            <span className='text-xs text-white/60'>Base CP</span>
                        </div>
                    </div>
                    <div className='text-right'>
                        <div className='text-3xl font-bold text-white mb-1'>${price}</div>
                        <div className='text-xs text-white/60'>Price</div>
                        {cpPerDollar > 0 && (
                            <div className='text-xs text-green-400 font-semibold mt-1'>
                                {cpPerDollar.toFixed(1)} CP/$
                            </div>
                        )}
                    </div>
                </div>

                {/* Bonuses Section */}
                {(eventBonusCP > 0 || (firstTime && firstTimeBonusCP > 0)) && (
                    <div className='space-y-2 pt-3 border-t border-white/10'>
                        {eventBonusCP > 0 && (
                            <div className='flex items-center justify-between text-green-400 text-sm bg-green-500/10 rounded-lg px-3 py-2'>
                                <div className='flex items-center gap-2'>
                                    <FontAwesomeIcon icon={faFire} className="text-xs" />
                                    <span className="font-semibold">Event Bonus</span>
                                </div>
                                <span className='font-bold text-lg'>+{eventBonusCP.toLocaleString()} CP</span>
                            </div>
                        )}
                        {firstTime && firstTimeBonusCP > 0 && (
                            <div className='flex items-center justify-between text-green-400 text-sm bg-green-500/10 rounded-lg px-3 py-2'>
                                <div className='flex items-center gap-2'>
                                    <FontAwesomeIcon icon={faStar} className="text-xs" />
                                    <span className="font-semibold">First Time Bonus</span>
                                </div>
                                <span className='font-bold text-lg'>+{firstTimeBonusCP.toLocaleString()} CP</span>
                            </div>
                        )}
                        {bonusPercentage > 0 && (
                            <div className='text-center pt-1'>
                                <span className='text-xs text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded-full'>
                                    +{bonusPercentage}% BONUS!
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Total CP - Prominent Display */}
                <div className='pt-4 border-t-2 border-white/20 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm text-white/70 font-semibold uppercase tracking-wide'>Total CP</span>
                        <span className={`text-3xl font-bold ${
                            isBestValue 
                                ? 'text-yellow-400' 
                                : 'text-red-400'
                        }`}>
                            {totalCP.toLocaleString()}
                        </span>
                    </div>
                    {hasBonuses && (
                        <div className='flex items-center gap-1 text-xs text-green-400'>
                            <FontAwesomeIcon icon={faCheck} className="text-xs" />
                            <span>Includes all bonuses</span>
                        </div>
                    )}
                </div>

                {/* Purchase Button */}
                <button 
                    onClick={async (e) => {
                        e.preventDefault();
                        
                        // Check if token exists in localStorage
                        const token = localStorage.getItem('authToken');
                        
                        // Helper function to get cookies
                        const getCookies = () => {
                            return document.cookie.split(';').reduce((acc, cookie) => {
                                const [key, value] = cookie.trim().split('=');
                                acc[key] = value;
                                return acc;
                            }, {} as Record<string, string>);
                        };
                        
                        // Check if cookie exists
                        let cookies = getCookies();
                        
                        // If no token at all, redirect to login
                        if (!token && !cookies.token) {
                            router.push(`/login?redirect=/donate`);
                            return;
                        }
                        
                        // Ensure cookie is set if we have token but no cookie
                        if (token && !cookies.token) {
                            // Set cookie with same attributes as login route
                            const isSecure = window.location.protocol === 'https:';
                            const secureFlag = isSecure ? '; Secure' : '';
                            // Don't encode the token - match the login route behavior
                            document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
                            
                            // Small delay to ensure cookie is set
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                            // Verify cookie was set
                            cookies = getCookies();
                            if (!cookies.token) {
                                // Cookie setting failed, redirect to login
                                router.push(`/login?redirect=/donate`);
                                return;
                            }
                        }
                        
                        // Final check - if still no auth, redirect to login
                        cookies = getCookies();
                        if (!cookies.token && !token) {
                            router.push(`/login?redirect=/donate`);
                            return;
                        }
                        
                        try {
                            // Create Stripe Checkout Session
                            const response = await fetch('/api/create-checkout-session', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ packageId: id }),
                            });
                            
                            if (!response.ok) {
                                if (response.status === 401) {
                                    router.push(`/login?redirect=/donate`);
                                    return;
                                }
                                throw new Error('Failed to create checkout session');
                            }
                            
                            const data = await response.json();
                            
                            if (data.url) {
                                // Redirect to Stripe Checkout
                                window.location.href = data.url;
                            } else {
                                throw new Error('No checkout URL received');
                            }
                        } catch (error) {
                            console.error('Error creating checkout session:', error);
                            alert('Failed to start checkout. Please try again.');
                        }
                    }}
                    className={`w-full py-3.5 rounded-lg font-bold text-base text-white transition-all duration-300 transform cursor-pointer ${
                        hover ? 'scale-105' : 'scale-100'
                    } shadow-lg ${
                        isBestValue
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                            : isRecommended
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        Purchase Now
                        <FontAwesomeIcon icon={faGem} className="text-sm" />
                    </span>
                </button>
            </div>
            
            {/* Shine effect on hover */}
            {hover && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine pointer-events-none" />
            )}
        </div>
    );
}
