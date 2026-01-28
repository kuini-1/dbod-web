'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API } from '@/lib/api/client';
import { local } from '@/lib/utils/localize';

export default function HomePage() {
    const [index, setIndex] = useState<number>(0);
    const [status, setStatus] = useState<any>({player_count: 0, auth: 1, ch0: 1, ch9: 1});
    const images = ['34556.jpg', '34596.png', '34572.jpg'];

    useEffect(() => {
        (async () => {
            try {
                const res = await API.get("/private");
                const server_status = await API.get("/status");
                if (server_status.status === 200) setStatus(server_status.data);
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
                    <h4 className='text-lg md:text-xl text-stone-300'>{local.updateEveryMinute}</h4>
                </div>
                <div className="w-full max-w-2xl">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.playerCount}</span>
                                <span className={`text-xl font-bold ${status.player_count === 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {status.player_count}
                                </span>
                            </div>
                        </div>
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.auth}</span>
                                <span className={`text-xl font-bold ${status.auth === 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.auth === 0 ? local.online : local.offline}
                                </span>
                            </div>
                        </div>
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.ch0}</span>
                                <span className={`text-xl font-bold ${status.ch0 === 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.ch0 === 0 ? local.online : local.offline}
                                </span>
                            </div>
                        </div>
                        <div className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-stone-300">{local.ch9}</span>
                                <span className={`text-xl font-bold ${status.ch9 === 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.ch9 === 0 ? local.online : local.offline}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
