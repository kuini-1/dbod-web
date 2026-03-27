'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import { WarningToast, SuccessToast } from '@/lib/utils/toasts';
import toast from 'react-hot-toast';
import { useLocale } from '@/components/LocaleProvider';
import DailyLoginAutoModal from '@/components/DailyLoginAutoModal';

interface DailyReward {
    date: number;
    itemId: number;
    amount: number;
    name: string;
    iconUrl: string | null;
    claimed: boolean;
    available: boolean;
    isRepeat?: boolean;
}

interface CheckinPassState {
    isActive: boolean;
    price: number;
    expiresAt: string | null;
}

export default function DailyLoginPage() {
    const { locale } = useLocale();
    const tx = useCallback((en: string, kr: string) => (locale === 'kr' ? kr : en), [locale]);
    const router = useRouter();
    const [rewards, setRewards] = useState<DailyReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mallpoints, setMallpoints] = useState(0);
    const [pass, setPass] = useState<CheckinPassState>({ isActive: false, price: 150, expiresAt: null });
    const [buyingPass, setBuyingPass] = useState(false);
    const [manualModalOpen, setManualModalOpen] = useState(true);
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
                setMallpoints(Number(res.data.mallpoints ?? 0));

                const response = await API.get('/daily-rewards');
                
                if (response.status === 200) {
                    setRewards(response.data.data);
                    setTimeUntilReset(response.data.timeUntilReset);
                    setPass(response.data.pass ?? { isActive: false, price: 150, expiresAt: null });
                } else {
                    setError(response.data.message || tx('Failed to fetch rewards', '보상을 불러오지 못했습니다'));
                }
            } catch (err) {
                console.error('Error details:', err);
                setError(tx('Error fetching rewards. Please try again later.', '보상을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, locale, tx]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeUntilReset(prev => {
                let { days, hours, minutes, seconds } = prev;
                if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
                    return prev;
                }
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
            toast(tx(`Daily rewards will reset in ${timeUntilReset.hours}h ${timeUntilReset.minutes}m! Make sure to claim all available rewards.`, `일일 보상이 ${timeUntilReset.hours}시간 ${timeUntilReset.minutes}분 후 초기화됩니다! 받을 수 있는 보상을 모두 수령하세요.`), {
                duration: 5000,
                position: 'top-center',
                icon: '⚠️'
            });
        }
    }, [timeUntilReset, locale, tx]);

    const handleClaim = async (date: number) => {
        try {
            const response = await API.post("/daily-rewards/claim", { date: Number(date) });

            if (response.status === 200) {
                const amountText = Number(response.data?.amount ?? 0);
                SuccessToast.fire(tx(`Reward claimed! x${amountText} sent to cashshop storage.`, `보상 수령 완료! x${amountText} 보상이 캐시샵 보관함으로 전송되었습니다.`));
                const rewardsResponse = await API.get("/daily-rewards");
                if (rewardsResponse.status === 200) {
                    setRewards(rewardsResponse.data.data);
                    setTimeUntilReset(rewardsResponse.data.timeUntilReset);
                    setPass(rewardsResponse.data.pass ?? { isActive: false, price: 150, expiresAt: null });
                }
            } else {
                WarningToast.fire(response.data.message || tx('Failed to claim reward', '보상 수령에 실패했습니다'));
            }
        } catch (error: any) {
            console.error('Error claiming reward:', error);
            WarningToast.fire(error.response?.data?.message || tx('Failed to claim reward', '보상 수령에 실패했습니다'));
        }
    };

    const handleBuyPass = async () => {
        try {
            setBuyingPass(true);
            const response = await API.post('/daily-rewards/pass/purchase');
            if (response.status === 200) {
                SuccessToast.fire(tx('Check-in Pass activated!', '체크인 패스가 활성화되었습니다!'));
                setMallpoints(Number(response.data.mallpoints ?? mallpoints));
                const rewardsResponse = await API.get('/daily-rewards');
                if (rewardsResponse.status === 200) {
                    setRewards(rewardsResponse.data.data);
                    setTimeUntilReset(rewardsResponse.data.timeUntilReset);
                    setPass(rewardsResponse.data.pass ?? { isActive: false, price: 150, expiresAt: null });
                }
                return;
            }
            WarningToast.fire(response.data.message || tx('Failed to purchase pass', '패스 구매에 실패했습니다'));
        } catch (error: any) {
            console.error('Error purchasing pass:', error);
            WarningToast.fire(error?.response?.data?.message || tx('Failed to purchase pass', '패스 구매에 실패했습니다'));
        } finally {
            setBuyingPass(false);
        }
    };

    const formatExpiry = (isoString: string | null) => {
        if (!isoString) return tx('Not active', '비활성');
        const date = new Date(isoString);
        return Number.isNaN(date.getTime())
            ? tx('Not active', '비활성')
            : date.toLocaleString();
    };

    const repeatReward = rewards.find((reward) => reward.date === 25) || rewards.find((reward) => reward.isRepeat);

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
                    {local.retry}
                </button>
            </div>
        );
    }

    return (
        <div className="text-white min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
            {!manualModalOpen ? (
                <div className="min-h-screen flex items-center justify-center p-6">
                    <button
                        onClick={() => setManualModalOpen(true)}
                        className="px-6 py-3 rounded-lg font-bold text-base text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 cursor-pointer border border-red-300/45 shadow-[0_6px_14px_rgba(239,68,68,0.25)]"
                    >
                        {tx('Open Daily Login', '출석 보상 열기')}
                    </button>
                </div>
            ) : null}
            <DailyLoginAutoModal
                isOpen={manualModalOpen}
                onClose={() => setManualModalOpen(false)}
                rewards={rewards}
                resetDays={timeUntilReset.days}
                claimedDay={0}
                claimedAmount={0}
                showPurchaseButton
                passIsActive={pass.isActive}
                passPrice={pass.price}
                mallpoints={mallpoints}
                buyingPass={buyingPass}
                onPurchase={handleBuyPass}
                purchaseButtonText={tx('Purchase Now', '지금 구매')}
                passActiveText={tx('Pass Active', '패스 활성')}
                purchasingText={tx('Purchasing...', '구매 중...')}
            />
        </div>
    );
}
