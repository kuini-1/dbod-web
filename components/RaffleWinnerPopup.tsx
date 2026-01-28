'use client';

import { useEffect, useState } from 'react';

interface RaffleWinnerPopupProps {
    winner?: {
        accountId: number;
        amount: number;
        timestamp: string;
    };
}

export default function RaffleWinnerPopup({ winner }: RaffleWinnerPopupProps) {
    const [show, setShow] = useState(false);
    const [lastShownWinner, setLastShownWinner] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setLastShownWinner(localStorage.getItem('lastShownRaffleWinner'));
        }
    }, []);

    useEffect(() => {
        if (winner && winner.timestamp !== lastShownWinner) {
            setShow(true);
            setLastShownWinner(winner.timestamp);
            if (typeof window !== 'undefined') {
                localStorage.setItem('lastShownRaffleWinner', winner.timestamp);
            }
        }
    }, [winner, lastShownWinner]);

    const handleClose = () => {
        setShow(false);
        if (winner && typeof window !== 'undefined') {
            localStorage.setItem('lastShownRaffleWinner', winner.timestamp);
        }
    };

    if (!winner || !show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <div className="bg-stone-800 rounded-xl p-6 max-w-lg w-full mx-4 relative">
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className="text-white/60 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <span className="text-xl">×</span>
                        </button>
                    </div>

                    <div className="space-y-4 text-center">
                        <h2 className="text-2xl font-bold text-red-400">🎉 Raffle Winner! 🎉</h2>
                        <h3 className="text-xl font-bold text-white">Congratulations!</h3>
                        <div className="space-y-2 text-white/80">
                            <p>Account ID: {winner.accountId}</p>
                            <p>Won: {winner.amount} CP</p>
                            <p>Time: {new Date(winner.timestamp).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex justify-center pt-4 border-t border-white/10">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-red-400 hover:bg-red-500 rounded-lg font-bold transition-colors duration-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
