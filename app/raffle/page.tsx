'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';
import RaffleWinnerPopup from '@/components/RaffleWinnerPopup';
import CharacterSelect from '@/components/CharacterSelect';

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
            setError('Please select a character first');
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
            setError(err.response?.data?.message || 'Failed to enter raffle');
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
                                <h1 className="text-3xl md:text-4xl font-bold text-red-400 mb-2">Daily Raffle</h1>
                                <p className="text-white/60">Enter for a chance to win Cash Points!</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-2">Current Pot</h2>
                                    <p className="text-3xl font-bold">{raffleState.currentPot} CP</p>
                                </div>
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-2">Time Left</h2>
                                    <p className="text-3xl font-bold">{formatTimeLeft(raffleState.timeLeft)}</p>
                                </div>
                            </div>

                            {isLoggedIn && (
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5 mb-8">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">Enter Raffle</h2>
                                    <div className="space-y-4">
                                        <CharacterSelect
                                            onSelect={setSelectedCharacter}
                                            selectedCharacter={selectedCharacter}
                                            title="Select Character"
                                        />
                                        <button
                                            onClick={() => setShowConfirm(true)}
                                            disabled={!raffleState.isActive || !selectedCharacter}
                                            className="w-full p-3 bg-red-400 hover:bg-red-500 disabled:bg-stone-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors duration-300 cursor-pointer"
                                        >
                                            Enter Raffle (5 CP)
                                        </button>
                                        {error && <p className="text-red-400">{error}</p>}
                                        {success && <p className="text-green-400">{success}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">Current Entries</h2>
                                    <div className="space-y-2">
                                        {raffleState.entries.map((entry, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
                                                <span>Account #{entry.accountId}</span>
                                                <span className="text-white/60">{new Date(entry.timestamp).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {raffleState.entries.length === 0 && (
                                            <p className="text-white/60">No entries yet</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-stone-900/50 p-6 rounded-xl border border-white/5">
                                    <h2 className="text-xl font-bold text-red-400 mb-4">Recent Winners</h2>
                                    <div className="space-y-2">
                                        {raffleState.winners.map((winner, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-stone-800/50 rounded">
                                                <span>Account #{winner.accountId}</span>
                                                <span className="text-green-400">{winner.amount} CP</span>
                                            </div>
                                        ))}
                                        {raffleState.winners.length === 0 && (
                                            <p className="text-white/60">No winners yet</p>
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
                        <h3 className="text-xl font-bold text-red-400 mb-4 text-center">Confirm Raffle Entry</h3>
                        <p className="text-white/80 mb-6 text-center">Are you sure you want to enter the raffle?</p>
                        
                        <div className="mb-6">
                            <p className="text-white/80 mb-3 text-center">Total cost: <span className="text-red-400 font-bold">5 CP</span></p>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                }}
                                className="flex-1 p-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-bold transition-colors duration-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnterRaffle}
                                disabled={isLoading}
                                className="flex-1 p-3 bg-red-400 hover:bg-red-500 rounded-lg font-bold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isLoading ? 'Entering...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
