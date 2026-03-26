'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import RaffleWinnerPopup from '@/components/RaffleWinnerPopup';
import CharacterSelect from '@/components/CharacterSelect';
import { useLocale } from '@/components/LocaleProvider';

interface RaffleState {
    currentPot: number;
    entries: Array<{
        accountId: number;
        timestamp: string;
    }>;
    timeLeft: number;
    winners: Array<{
        accountId: number;
        amount: number;
        timestamp: string;
    }>;
    isActive: boolean;
    lastWinner?: {
        accountId: number;
        amount: number;
        timestamp: string;
    };
}

export default function RafflePage() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const [raffleState, setRaffleState] = useState<RaffleState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await API.get("/private");
            setIsLoggedIn(res.status === 201 || res.status === 200);
        })();
    }, []);

    const fetchRaffleState = async () => {
        try {
            const res = await API.get('/raffle');
            if (res.status === 200 && res.data.success) {
                setRaffleState(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching raffle state:', error);
        }
    };

    useEffect(() => {
        fetchRaffleState();
        const interval = setInterval(fetchRaffleState, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleEnterRaffle = async () => {
        if (!selectedCharacter) {
            setError(tx('Please select a character first', '먼저 캐릭터를 선택하세요'));
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const res = await API.post('/raffle/enter', {
                characterName: selectedCharacter.CharName,
                CharID: selectedCharacter.CharID
            });
            setSuccess(res.data.message);
            setShowConfirm(false);
            setSelectedCharacter(null);
            fetchRaffleState();
        } catch (err: any) {
            console.error('Error entering raffle:', err);
            setError(err.response?.data?.message || tx('Failed to enter raffle', '래플 참여에 실패했습니다'));
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeLeft = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="text-white bg-stone-900 min-h-screen duration-500 overflow-x-hidden px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-stone-800/50 rounded-xl p-6 md:p-10 border border-white/5">
                    {raffleState && (
                        <>
                            <RaffleWinnerPopup 
                                winner={raffleState.lastWinner} 
                            />
                            <div className="text-center mb-8">
                                <h1 className="text-3xl md:text-4xl font-bold text-red-400 mb-2">{local.dailyRaffle}</h1>
                                <p className="text-white/60">{local.enterForChance}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-2">{local.currentPot}</h2>
                                    <p className="text-3xl font-bold">{raffleState.currentPot} CP</p>
                                </div>
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-2">{local.timeLeft}</h2>
                                    <p className="text-3xl font-bold">{formatTimeLeft(raffleState.timeLeft)}</p>
                                </div>
                            </div>

                            {isLoggedIn && (
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5 mb-8">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">{local.enterRaffle}</h2>
                                    <div className="space-y-4">
                                        <CharacterSelect
                                            onSelect={setSelectedCharacter}
                                            selectedCharacter={selectedCharacter}
                                            title={tx('Select Character', '캐릭터 선택')}
                                        />
                                        <button
                                            onClick={() => setShowConfirm(true)}
                                            disabled={!raffleState.isActive || !selectedCharacter}
                                            className="w-full p-3 bg-red-400 hover:bg-red-500 disabled:bg-stone-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors duration-300 cursor-pointer"
                                        >
                                            {local.enterRaffleCost}
                                        </button>
                                        {error && <p className="text-red-400">{error}</p>}
                                        {success && <p className="text-green-400">{success}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">{local.currentEntries}</h2>
                                    <div className="space-y-2">
                                        {raffleState.entries.map((entry, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
                                                <span>{tx('Account', '계정')} #{entry.accountId}</span>
                                                <span className="text-white/60">{new Date(entry.timestamp).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {raffleState.entries.length === 0 && (
                                            <p className="text-white/60">{local.noEntriesYet}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">{local.recentWinners}</h2>
                                    <div className="space-y-2">
                                        {raffleState.winners.map((winner, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
                                                <span>{tx('Account', '계정')} #{winner.accountId}</span>
                                                <span className="text-green-400">{winner.amount} CP</span>
                                            </div>
                                        ))}
                                        {raffleState.winners.length === 0 && (
                                            <p className="text-white/60">{local.noWinnersYet}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-stone-800 p-6 rounded-xl border border-white/5 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-red-400 mb-4 text-center">{local.confirmRaffleEntry}</h3>
                        <p className="text-white/80 mb-6 text-center">{local.confirmRaffleDesc}</p>
                        
                        <div className="mb-6">
                            <p className="text-white/80 mb-3 text-center">{local.totalCost} <span className="text-red-400 font-bold">5 CP</span></p>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                }}
                                className="flex-1 p-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-bold transition-colors duration-300 cursor-pointer"
                            >
                                {local.cancel}
                            </button>
                            <button
                                onClick={handleEnterRaffle}
                                disabled={isLoading}
                                className="flex-1 p-3 bg-red-400 hover:bg-red-500 rounded-lg font-bold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? local.entering : local.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
