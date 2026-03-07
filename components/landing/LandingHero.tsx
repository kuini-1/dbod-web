'use client';

import Link from 'next/link';
import Image from 'next/image';
import { local } from '@/lib/utils/localize';

const heroImage = '34556.jpg';

export function LandingHero() {
    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
            {/* Game imagery background - DBO in-game feel */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={`/${heroImage}`}
                    alt="Dragon Ball Online Daebak"
                    fill
                    priority
                    className="object-cover object-center scale-105"
                    sizes="100vw"
                />
                {/* Dark gradient overlay for readability + immersive depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
                {/* Glow accent */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 via-transparent to-red-400/10" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                {/* Subtle ki/energy ring effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="w-[min(90vw,500px)] aspect-square rounded-full border border-red-400/15 animate-pulse" />
                </div>

                {/* Headline - bold anime/MMORPG style */}
                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-red-400 to-red-300 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        {local.beginAdventure.split('.')[0] || 'BEGIN YOUR ADVENTURE'}
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-400 drop-shadow-[0_0_40px_rgba(239,68,68,0.6)] mt-2">
                        DBO DAEBAK
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-red-100/90 font-medium max-w-2xl mx-auto mb-12">
                    {local.registerDownload}
                </p>

                {/* CTA Buttons - game-style with ki glow */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/register"
                        className="group relative px-10 py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-red-500 to-red-600 text-white
                            shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]
                            border-2 border-red-300/50 hover:border-red-200
                            transition-all duration-300 hover:scale-105"
                    >
                        <span className="relative z-10">{local.homeRegister}</span>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        href="/download"
                        className="group px-10 py-4 rounded-lg font-bold text-lg bg-red-500/10 border-2 border-red-400/60 text-red-100
                            hover:bg-red-500/20 hover:border-red-300
                            shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]
                            transition-all duration-300 hover:scale-105"
                    >
                        {local.homeDownload}
                    </Link>
                </div>
            </div>
        </section>
    );
}
