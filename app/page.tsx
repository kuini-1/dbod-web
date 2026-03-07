'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';

export default function HomePage() {
    const [index, setIndex] = useState<number>(0);
    const [status, setStatus] = useState<any>({
        player_count: 0, 
        auth: 1, 
        chat: 1,
        char: 1,
        channels: {
            ch0: 1, ch1: 1, ch2: 1, ch3: 1, ch4: 1,
            ch5: 1, ch6: 1, ch7: 1, ch8: 1, ch9: 1
        },
        bonuses: null,
        channelBonuses: []
    });
    const images = ['34556.jpg', '34596.png', '34572.jpg'];

    useEffect(() => {
        (async () => {
            try {
                const server_status = await API.get("/status");
                if (server_status.status === 200) {
                    const data = server_status.data;
                    console.log('Status data received:', data);
                    // Handle backward compatibility with old API format
                    if (data.channels) {
                        setStatus(data);
                    } else {
                        // Old format - convert to new format
                        setStatus({
                            player_count: data.player_count || 0,
                            auth: data.auth,
                            chat: data.chat || 1,
                            char: data.char || 1,
                            channels: {
                                ch0: data.ch0 || 1,
                                ch1: data.ch1 || 1,
                                ch2: data.ch2 || 1,
                                ch3: data.ch3 || 1,
                                ch4: data.ch4 || 1,
                                ch5: data.ch5 || 1,
                                ch6: data.ch6 || 1,
                                ch7: data.ch7 || 1,
                                ch8: data.ch8 || 1,
                                ch9: data.ch9 || 1
                            },
                            bonuses: data.bonuses || null,
                            channelBonuses: data.channelBonuses || []
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        })();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { 
            setIndex(index === images.length - 1 ? 0 : index + 1); 
        }, 3500);
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className="text-white bg-gradient-to-b from-stone-900 to-stone-800 min-h-screen duration-500 overflow-x-hidden relative">
            {/* Hero Section */}
            <section className="relative">
                <div className="h-[60vh] overflow-hidden">
                    <div className="flex flex-row justify-center items-center h-full transition-all duration-700 ease-in-out" 
                         style={{ transform: `translateX(-${index * 100}vw)`, width: `${images.length * 100}vw` }}>
                        {images.map((image, i) => (
                            <div key={i} className="w-screen h-full bg-black/40 flex justify-center items-center relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-900/80 z-10" />
                                <Image 
                                    priority={i === 0}
                                    className="w-auto max-h-[60vh] object-contain z-20 transform hover:scale-105 transition-transform duration-500" 
                                    src={`/${image}`} 
                                    alt="" 
                                    width={800}
                                    height={600}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-row justify-center items-center mt-5 space-x-3">
                    {images.map((image, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                                index === i ? 'bg-red-400 scale-125' : 'bg-stone-600 hover:bg-stone-500'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full px-4 py-16 mt-4 flex flex-col justify-center items-center bg-stone-800/30 backdrop-blur-sm space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 animate-gradient">
                        {local.beginAdventure}
                    </h1>
                    <h2 className="text-xl md:text-2xl text-stone-300">{local.registerDownload}</h2>
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 w-full max-w-4xl">
                    <Link href="/register" className="w-full md:w-auto group">
                        <button className="bg-gradient-to-r from-red-500 to-red-600 p-4 w-full md:w-[300px] rounded-lg 
                                         transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20
                                         font-bold text-white text-lg md:text-xl cursor-pointer">
                            {local.homeRegister}
                        </button>
                    </Link>
                    <Link href="/download" className="w-full md:w-auto group">
                        <button className="bg-stone-800 p-4 w-full md:w-[300px] rounded-lg border-2 border-red-500
                                         transform transition-all duration-300 hover:scale-105 hover:bg-red-500/10
                                         font-bold text-red-400 text-lg md:text-xl cursor-pointer">
                            {local.homeDownload}
                        </button>
                    </Link>
                </div>
            </section>

            {/* Server Status Section */}
            <section className="w-full px-4 py-16 mt-4 flex flex-col items-center bg-stone-800/30 backdrop-blur-sm space-y-8">
                <div className='flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-5'>
                    <h1 className='text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600'>
                        {local.serverStatus}
                    </h1>
                </div>
                <div className="w-full max-w-4xl">
                    {/* Player Count and Server Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.playerCount}</span>
                                <span className={`text-xl font-bold ${status.player_count === 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {status.player_count || 0}
                                </span>
                            </div>
                        </div>
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.auth}</span>
                                <span className={`text-xl font-bold ${Number(status.auth) === 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {Number(status.auth) === 0 ? local.online : local.offline}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* All Channels */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-stone-300 mb-4">Channels</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((chNum) => {
                                const chKey = `ch${chNum}` as keyof typeof status.channels;
                                const chStatus = status.channels?.[chKey];
                                const isOnline = Number(chStatus) === 0;
                                return (
                                    <div key={chNum} className="bg-stone-800/50 rounded-xl p-4 backdrop-blur-sm border border-stone-700/50">
                                        <div className="flex flex-col items-center space-y-2">
                                            <span className="text-sm font-semibold text-stone-400">Channel {chNum}</span>
                                            <span className={`text-lg font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                                {isOnline ? local.online : local.offline}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bonuses Section */}
                    {status.bonuses && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-stone-300 mb-4">Active Bonuses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {status.bonuses.soloExpBonus > 0 && (
                                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 backdrop-blur-sm border border-green-500/30">
                                        <div className="text-sm text-green-400 font-semibold mb-1">Solo EXP</div>
                                        <div className="text-2xl font-bold text-green-300">+{status.bonuses.soloExpBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.partyExpBonus > 0 && (
                                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 backdrop-blur-sm border border-blue-500/30">
                                        <div className="text-sm text-blue-400 font-semibold mb-1">Party EXP</div>
                                        <div className="text-2xl font-bold text-blue-300">+{status.bonuses.partyExpBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.questExpBonus > 0 && (
                                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 backdrop-blur-sm border border-purple-500/30">
                                        <div className="text-sm text-purple-400 font-semibold mb-1">Quest EXP</div>
                                        <div className="text-2xl font-bold text-purple-300">+{status.bonuses.questExpBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.craftExpBonus > 0 && (
                                    <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 backdrop-blur-sm border border-yellow-500/30">
                                        <div className="text-sm text-yellow-400 font-semibold mb-1">Craft EXP</div>
                                        <div className="text-2xl font-bold text-yellow-300">+{status.bonuses.craftExpBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.zeniDropBonus > 0 && (
                                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl p-4 backdrop-blur-sm border border-amber-500/30">
                                        <div className="text-sm text-amber-400 font-semibold mb-1">Zeni Drop</div>
                                        <div className="text-2xl font-bold text-amber-300">+{status.bonuses.zeniDropBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.questMoneyBonus > 0 && (
                                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 backdrop-blur-sm border border-emerald-500/30">
                                        <div className="text-sm text-emerald-400 font-semibold mb-1">Quest Money</div>
                                        <div className="text-2xl font-bold text-emerald-300">+{status.bonuses.questMoneyBonus}%</div>
                                    </div>
                                )}
                                {status.bonuses.upgradeRateBonus > 0 && (
                                    <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl p-4 backdrop-blur-sm border border-pink-500/30">
                                        <div className="text-sm text-pink-400 font-semibold mb-1">Upgrade Rate</div>
                                        <div className="text-2xl font-bold text-pink-300">+{status.bonuses.upgradeRateBonus}%</div>
                                    </div>
                                )}
                            </div>
                            {Object.values(status.bonuses).every((v: any) => !v || v === 0) && (
                                <div className="text-center text-stone-400 mt-4">No active bonuses at this time</div>
                            )}
                        </div>
                    )}
                    {!status.bonuses && (
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-stone-300 mb-4">Active Bonuses</h2>
                            <div className="text-center text-stone-400">Bonus information unavailable</div>
                        </div>
                    )}

                    {/* Channel Bonuses */}
                    {status.channelBonuses && status.channelBonuses.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-stone-300 mb-4">Channel Bonuses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {status.channelBonuses.map((bonus: any) => {
                                    // Only show channel if it has at least one bonus > 0
                                    const hasBonuses = bonus.maxLpPercent > 0 || bonus.maxEpPercent > 0 || 
                                                      bonus.physicalOffencePercent > 0 || bonus.energyOffencePercent > 0 ||
                                                      bonus.physicalDefencePercent > 0 || bonus.energyDefencePercent > 0 ||
                                                      bonus.attackRatePercent > 0 || bonus.dodgeRatePercent > 0;
                                    
                                    if (!hasBonuses) return null;

                                    return (
                                        <div key={bonus.channelId} className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-4 backdrop-blur-sm border border-red-500/30">
                                            <div className="text-sm text-red-400 font-semibold mb-3">Channel {bonus.channelId}</div>
                                            <div className="space-y-2">
                                                {bonus.maxLpPercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Max LP</span>
                                                        <span className="text-lg font-bold text-green-300">+{bonus.maxLpPercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.maxEpPercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Max EP</span>
                                                        <span className="text-lg font-bold text-blue-300">+{bonus.maxEpPercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.physicalOffencePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Physical Off</span>
                                                        <span className="text-lg font-bold text-red-300">+{bonus.physicalOffencePercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.energyOffencePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Energy Off</span>
                                                        <span className="text-lg font-bold text-yellow-300">+{bonus.energyOffencePercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.physicalDefencePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Physical Def</span>
                                                        <span className="text-lg font-bold text-purple-300">+{bonus.physicalDefencePercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.energyDefencePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Energy Def</span>
                                                        <span className="text-lg font-bold text-cyan-300">+{bonus.energyDefencePercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.attackRatePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Attack Rate</span>
                                                        <span className="text-lg font-bold text-orange-300">+{bonus.attackRatePercent}%</span>
                                                    </div>
                                                )}
                                                {bonus.dodgeRatePercent > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-stone-400">Dodge Rate</span>
                                                        <span className="text-lg font-bold text-pink-300">+{bonus.dodgeRatePercent}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
