'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faFire, faGift } from '@fortawesome/free-solid-svg-icons';

interface UrgencyIndicatorProps {
    bonusCP?: number;
    firstTime?: boolean;
    eventEndDate?: Date; // Optional: if you have event end dates
}

export default function UrgencyIndicator({ bonusCP, firstTime, eventEndDate }: UrgencyIndicatorProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        if (eventEndDate) {
            const updateTimeLeft = () => {
                const now = new Date();
                const end = new Date(eventEndDate);
                const diff = end.getTime() - now.getTime();
                
                if (diff <= 0) {
                    setTimeLeft('Event Ended');
                    return;
                }
                
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m`);
                } else {
                    setTimeLeft(`${minutes}m`);
                }
            };
            
            updateTimeLeft();
            const interval = setInterval(updateTimeLeft, 60000); // Update every minute
            
            return () => clearInterval(interval);
        }
    }, [eventEndDate]);

    if (!mounted) return null;

    const hasActiveBonuses = (bonusCP && bonusCP > 0) || firstTime;

    if (!hasActiveBonuses && !eventEndDate) {
        return null;
    }

    return (
        <div className="w-full bg-gradient-to-r from-red-900/40 via-red-800/40 to-red-900/40 backdrop-blur-sm rounded-xl p-4 border-2 border-red-500/50 shadow-lg mb-6 animate-pulse-slow">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                {/* Event Bonus Indicator */}
                {bonusCP && bonusCP > 0 && (
                    <div className="flex items-center gap-3 bg-red-500/20 rounded-lg px-4 py-2 border border-red-500/30">
                        <div className="relative">
                            <FontAwesomeIcon icon={faFire} className="text-2xl text-red-400 animate-bounce" />
                            <div className="absolute inset-0 blur-md bg-red-400 opacity-50" />
                        </div>
                        <div>
                            <div className="text-xs text-white/70 uppercase tracking-wide">Event Active</div>
                            <div className="text-lg font-bold text-red-400">
                                +{(bonusCP * 100).toFixed(0)}% Bonus CP
                            </div>
                        </div>
                    </div>
                )}

                {/* First Time Bonus Indicator */}
                {firstTime && (
                    <div className="flex items-center gap-3 bg-green-500/20 rounded-lg px-4 py-2 border border-green-500/30">
                        <div className="relative">
                            <FontAwesomeIcon icon={faGift} className="text-2xl text-green-400 animate-bounce" />
                            <div className="absolute inset-0 blur-md bg-green-400 opacity-50" />
                        </div>
                        <div>
                            <div className="text-xs text-white/70 uppercase tracking-wide">Limited Offer</div>
                            <div className="text-lg font-bold text-green-400">
                                2x Cash Points!
                            </div>
                        </div>
                    </div>
                )}

                {/* Countdown Timer */}
                {eventEndDate && timeLeft && (
                    <div className="flex items-center gap-3 bg-yellow-500/20 rounded-lg px-4 py-2 border border-yellow-500/30">
                        <FontAwesomeIcon icon={faClock} className="text-2xl text-yellow-400" />
                        <div>
                            <div className="text-xs text-white/70 uppercase tracking-wide">Time Remaining</div>
                            <div className="text-lg font-bold text-yellow-400">
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                )}

                {/* Urgency Message */}
                {hasActiveBonuses && (
                    <div className="text-center md:text-left">
                        <div className="text-sm font-bold text-white/90">
                            Don't miss out on these bonuses!
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                            {firstTime && bonusCP && bonusCP > 0 
                                ? 'First-time bonus + event bonus active now'
                                : firstTime
                                ? 'First-time bonus available for new players'
                                : 'Event bonus active for limited time'
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
