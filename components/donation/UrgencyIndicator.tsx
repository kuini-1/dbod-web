'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faFire, faGift } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '@/components/LocaleProvider';

interface UrgencyIndicatorProps {
    bonusCP?: number;
    firstTime?: boolean;
    eventEndDate?: Date; // Optional: if you have event end dates
}

export default function UrgencyIndicator({ bonusCP, firstTime, eventEndDate }: UrgencyIndicatorProps) {
    const { locale } = useLocale();
    const tx = useCallback((en: string, kr: string) => (locale === 'kr' ? kr : en), [locale]);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (eventEndDate) {
            const updateTimeLeft = () => {
                const now = new Date();
                const end = new Date(eventEndDate);
                const diff = end.getTime() - now.getTime();
                
                if (diff <= 0) {
                    setTimeLeft(tx('Event Ended', '이벤트 종료'));
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
    }, [eventEndDate, tx]);

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
                            <div className="text-xs text-white/70 uppercase tracking-wide">{tx('Event Active', '이벤트 진행 중')}</div>
                            <div className="text-lg font-bold text-red-400">
                                +{(bonusCP * 100).toFixed(0)}% {tx('Bonus CP', '보너스 CP')}
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
                            <div className="text-xs text-white/70 uppercase tracking-wide">{tx('Limited Offer', '한정 혜택')}</div>
                            <div className="text-lg font-bold text-green-400">
                                {tx('2x Cash Points!', '캐시 포인트 2배!')}
                            </div>
                        </div>
                    </div>
                )}

                {/* Countdown Timer */}
                {eventEndDate && timeLeft && (
                    <div className="flex items-center gap-3 bg-yellow-500/20 rounded-lg px-4 py-2 border border-yellow-500/30">
                        <FontAwesomeIcon icon={faClock} className="text-2xl text-yellow-400" />
                        <div>
                            <div className="text-xs text-white/70 uppercase tracking-wide">{tx('Time Remaining', '남은 시간')}</div>
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
                            {tx("Don't miss out on these bonuses!", '이 보너스를 놓치지 마세요!')}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                            {firstTime && bonusCP && bonusCP > 0 
                                ? tx('First-time bonus + event bonus active now', '첫 결제 + 이벤트 보너스 동시 적용 중')
                                : firstTime
                                ? tx('First-time bonus available for new players', '신규 유저 첫 결제 보너스 제공')
                                : tx('Event bonus active for limited time', '한정 기간 이벤트 보너스 진행 중')
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
