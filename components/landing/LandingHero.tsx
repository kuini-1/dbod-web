'use client';

import Link from 'next/link';
import Image from 'next/image';
import { local } from '@/lib/utils/localize';
import { useLocale } from '@/components/LocaleProvider';

const heroImage = '34556.jpg';

export function LandingHero() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);

    return (
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-red-500/20">
            {/* Game imagery background - DBO in-game feel */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={`/${heroImage}`}
                    alt={tx('Dragon Ball Online Daebak', '드래곤볼 온라인 대박')}
                    fill
                    priority
                    className="object-cover object-center scale-105"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/95" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.18)_0%,_rgba(0,0,0,0)_55%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(0,0,0,0.65)_0%,_rgba(0,0,0,0.3)_50%,_rgba(0,0,0,0.7)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_rgba(220,38,38,0.25)_0%,_rgba(0,0,0,0)_45%)]" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0c0a09] to-transparent" />
            </div>
            <div className="pointer-events-none absolute inset-6 md:inset-10 z-[1] rounded-2xl border border-red-300/15" />
            <div className="pointer-events-none absolute inset-10 md:inset-16 z-[1] rounded-2xl border border-red-500/10" />

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <div className="w-[min(90vw,580px)] aspect-square rounded-full border border-red-400/20 animate-pulse" />
                    <div className="absolute w-[min(86vw,680px)] aspect-square rounded-full border border-red-300/10" />
                </div>

                <div className="mb-5 flex justify-center">
                    <span className="rounded-full border border-red-300/30 bg-black/45 px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-red-100/85">
                        {tx('Enter The World', '세계로 입장')}
                    </span>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4">
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-100 via-red-300 to-red-200 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        {local.beginAdventure.split('.')[0] || tx('BEGIN YOUR ADVENTURE', '모험을 시작하세요')}
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-300 drop-shadow-[0_0_45px_rgba(239,68,68,0.65)] mt-2">
                        {tx('DBO DAEBAK', 'DBO 대박')}
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-red-100/90 font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
                    {local.registerDownload}
                </p>

                <div className="mx-auto mb-7 h-px w-52 bg-gradient-to-r from-transparent via-red-300/65 to-transparent" />

                <div className="inline-flex flex-col sm:flex-row gap-4 justify-center rounded-2xl border border-red-400/20 bg-black/35 px-5 py-5 backdrop-blur-sm">
                    <Link
                        href="/register"
                        className="group relative px-10 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-red-500 to-red-600 text-white
                            shadow-[0_0_24px_rgba(239,68,68,0.45)] hover:shadow-[0_0_40px_rgba(239,68,68,0.65)]
                            border-2 border-red-200/60 hover:border-red-100
                            transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                    >
                        <span className="relative z-10">{local.homeRegister}</span>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        href="/download"
                        className="group px-10 py-4 rounded-xl font-bold text-lg bg-red-500/10 border-2 border-red-400/60 text-red-100
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
