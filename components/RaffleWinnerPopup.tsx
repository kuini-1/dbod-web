'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './LocaleProvider';

interface RaffleWinnerPopupProps {
    winner?: {
        accountId: number;
        amount: number;
        timestamp: string;
    };
}

export default function RaffleWinnerPopup({ winner }: RaffleWinnerPopupProps) {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [lastShownWinner, setLastShownWinner] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('lastShownRaffleWinner');
    });

    const handleClose = () => {
        if (winner && typeof window !== 'undefined') {
            localStorage.setItem('lastShownRaffleWinner', winner.timestamp);
        }
        if (winner) {
            setLastShownWinner(winner.timestamp);
        }
    };

    const show = !!winner && winner.timestamp !== lastShownWinner;
    if (!show || !winner) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <div className="bg-stone-800 rounded-xl p-6 max-w-lg w-full mx-4 relative">
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className="text-white/60 hover:text-white transition-colors"
                            aria-label={tx('Close', '닫기')}
                        >
                            <span className="text-xl">x</span>
                        </button>
                    </div>

                    <div className="space-y-4 text-center">
                        <h2 className="text-2xl font-bold text-red-400">🎉 {tx('Raffle Winner!', '래플 당첨자!')} 🎉</h2>
                        <h3 className="text-xl font-bold text-white">{tx('Congratulations!', '축하합니다!')}</h3>
                        <div className="space-y-2 text-white/80">
                            <p>{tx('Account ID', '계정 ID')}: {winner.accountId}</p>
                            <p>{tx('Won', '당첨 금액')}: {winner.amount} CP</p>
                            <p>{tx('Time', '시간')}: {new Date(winner.timestamp).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex justify-center pt-4 border-t border-white/10">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-red-400 hover:bg-red-500 rounded-lg font-bold transition-colors duration-300"
                        >
                            {tx('Close', '닫기')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
