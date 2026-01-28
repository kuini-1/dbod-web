'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import CharacterSelect from '@/components/CharacterSelect';
import { WarningToast, SuccessToast } from '@/lib/utils/toasts';
import toast from 'react-hot-toast';

interface DailyReward {
    date: number;
    itemId: number;
    amount: number;
    claimed: boolean;
    available: boolean;
    isBonus?: boolean;
}

export default function DailyLoginPage() {
    const router = useRouter();
    const [rewards, setRewards] = useState<DailyReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
    const [timeUntilReset, setTimeUntilReset] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await API.get("/private");
                const isLoggedIn = res.status === 201 || res.status === 200;
                
                if (!isLoggedIn) {
                    router.push('/login');
                    return;
                }

                const response = await API.get('/daily-rewards');
                
                if (response.status === 200) {
                    setRewards(response.data.data);
                    setTimeUntilReset(response.data.timeUntilReset);
                } else {
                    setError(response.data.message || 'Failed to fetch rewards');
                }
            } catch (err) {
                console.error('Error details:', err);
                setError('Error fetching rewards. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeUntilReset(prev => {
                let { days, hours, minutes, seconds } = prev;
                seconds--;
                
                if (seconds < 0) {
                    seconds = 59;
                    minutes--;
                }
                if (minutes < 0) {
                    minutes = 59;
                    hours--;
                }
                if (hours < 0) {
                    hours = 23;
                    days--;
                }
                
                return { days, hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const totalSeconds = timeUntilReset.days * 86400 + timeUntilReset.hours * 3600 + timeUntilReset.minutes * 60 + timeUntilReset.seconds;
        if (totalSeconds > 0 && totalSeconds <= 3600) {
            toast(`Daily rewards will reset in ${timeUntilReset.hours}h ${timeUntilReset.minutes}m! Make sure to claim all available rewards.`, {
                duration: 5000,
                position: 'top-center',
                icon: '⚠️'
            });
        }
    }, [timeUntilReset]);

    const handleClaim = async (date: number) => {
        if (!selectedCharacter) {
            WarningToast.fire('Please select a character first');
            return;
        }

        try {
            const requestData = {
                date: Number(date),
                characterName: String(selectedCharacter.CharName),
                CharID: Number(selectedCharacter.CharID)
            };

            const response = await API.post("/daily-rewards/claim", requestData);

            if (response.status === 200) {
                SuccessToast.fire('Reward claimed successfully!');
                const rewardsResponse = await API.get("/daily-rewards");
                setRewards(rewardsResponse.data.data);
                setTimeUntilReset(rewardsResponse.data.timeUntilReset);
            } else {
                WarningToast.fire(response.data.message || 'Failed to claim reward');
            }
        } catch (error: any) {
            console.error('Error claiming reward:', error);
            WarningToast.fire(error.response?.data?.message || 'Failed to claim reward');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-stone-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-red-500 space-y-4">
                <div>{error}</div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-stone-800/50 rounded-xl p-6 md:p-10 border border-white/5">
                    <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                        Daily Login Rewards
                    </h1>

                    <div className="text-center mb-8">
                        <div className="text-lg text-white/60">
                            Next Reset: {timeUntilReset.days}d {timeUntilReset.hours}h {timeUntilReset.minutes}m {timeUntilReset.seconds}s
                        </div>
                    </div>

                    <div className="mb-8">
                        <CharacterSelect
                            onSelect={setSelectedCharacter}
                            selectedCharacter={selectedCharacter}
                            title="Select Character to Receive Rewards"
                        />
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 29 }, (_, i) => {
                            const date = i + 1;
                            const reward = rewards.find(r => r.date === date);
                            const isSpecialDay = date % 7 === 0 || date === 28;
                            const isBonusDay = date === 29;
                            
                            return (
                                <div key={date} className="relative">
                                    <div 
                                        className={`relative aspect-square rounded-lg overflow-hidden ${
                                            isBonusDay
                                                ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50'
                                                : isSpecialDay 
                                                    ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/50' 
                                                    : 'bg-stone-800/50 border border-white/5'
                                        }`}
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                            <span className="text-lg font-bold mb-2">
                                                {isBonusDay ? 'Bonus' : `Day ${date}`}
                                            </span>

                                            <Image 
                                                src="/event icons/i_hls_aoto_lp_s.png"
                                                alt="Reward" 
                                                width={48}
                                                height={48}
                                                className="mb-2"
                                            />

                                            <span className={`text-sm font-bold ${isBonusDay ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {reward?.amount || 0}
                                            </span>

                                            {reward && (
                                                <div className="mt-2">
                                                    {reward.claimed ? (
                                                        <span className="text-xs text-green-400">Claimed</span>
                                                    ) : reward.available ? (
                                                        <button
                                                            onClick={() => handleClaim(date)}
                                                            className={`text-xs px-3 py-1 rounded-full transition-colors cursor-pointer ${
                                                                isBonusDay 
                                                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                                                    : 'bg-red-500 hover:bg-red-600'
                                                            }`}
                                                        >
                                                            Claim
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-white/40">
                                                            Not Available
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
