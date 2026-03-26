'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, Swords, Zap, Sparkles, Hammer, RefreshCcw } from 'lucide-react';
import { local } from '@/lib/utils/localize';
import { useLocale } from '@/components/LocaleProvider';

export function CoreFeaturesSection() {
    const { locale } = useLocale();
    const tx = (en: string, kr: string) => (locale === 'kr' ? kr : en);
    const features = [
        {
            icon: Users,
            title: local.dualClass,
            description: local.dualClassDesc,
            gradient: 'from-red-500/20 via-red-500/10 to-transparent',
            borderColor: 'border-red-500/30',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            art: '/illust/1111131_0.png',
        },
        {
            icon: Swords,
            title: local.equipmentUpgrade,
            description: local.equipmentUpgradeDesc,
            gradient: 'from-red-500/20 via-red-500/10 to-transparent',
            borderColor: 'border-red-500/30',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            art: '/illust/4211101_0.png',
        },
        {
            icon: Zap,
            title: local.fastGameplay,
            description: local.fastGameplayDesc,
            gradient: 'from-red-500/20 via-red-500/10 to-transparent',
            borderColor: 'border-red-500/30',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400',
            art: '/illust/2991101_0.png',
        },
        {
            icon: Sparkles,
            title: local.channelBuffs,
            description: local.channelBuffsDesc,
            gradient: 'from-red-500/20 via-red-500/10 to-transparent',
            borderColor: 'border-red-400/30',
            iconBg: 'bg-red-400/20',
            iconColor: 'text-red-300',
            art: '/illust/1841101_0.png',
        },
        {
            icon: Hammer,
            title: local.craftedEquipment,
            description: local.craftedEquipmentDesc,
            gradient: 'from-red-600/20 via-red-600/10 to-transparent',
            borderColor: 'border-red-400/30',
            iconBg: 'bg-red-400/20',
            iconColor: 'text-red-300',
            art: '/illust/5711100_1.png',
        },
        {
            icon: RefreshCcw,
            title: tx('Class & Race Change', '클래스 및 종족 변경'),
            description: tx(
                'Use special in-game items to switch your character race and class without the need to create a new character.',
                '게임 내 특수 아이템으로 새 캐릭터를 만들지 않고도 캐릭터의 종족과 클래스를 변경할 수 있습니다.'
            ),
            gradient: 'from-red-500/20 via-red-500/10 to-transparent',
            borderColor: 'border-red-400/30',
            iconBg: 'bg-red-400/20',
            iconColor: 'text-red-300',
            art: '/illust/31853501_0.png',
        },
    ];

    return (
        <section className="relative w-full py-24 md:py-32 px-4 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#120f0d] via-[#17120f] to-[#0f0c0a]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            {/* Section header */}
            <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
                <p className="text-red-400 font-semibold text-sm uppercase tracking-[0.2em] mb-4">
                    {tx('Why Play Here', '왜 여기서 플레이해야 할까요')}
                </p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-red-400 to-red-200">
                        {local.coreFeatures}
                    </span>
                </h2>
                <p className="mt-6 text-lg md:text-xl text-red-100/70 max-w-2xl mx-auto">
                    {tx('Major features that set our server apart', '우리 서버를 특별하게 만드는 핵심 기능')}
                </p>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group relative rounded-2xl p-8 md:p-10 bg-gradient-to-br ${feature.gradient}
                                backdrop-blur-xl border ${feature.borderColor}
                                hover:shadow-[0_0_50px_rgba(239,68,68,0.2)]
                                transition-all duration-500 hover:-translate-y-1
                                min-h-[300px] flex flex-col overflow-hidden`}
                        >
                            <div className="absolute -right-12 -bottom-8 w-48 h-48 opacity-15 group-hover:opacity-25 transition-opacity">
                                <Image src={feature.art} alt="" fill className="object-contain object-bottom" />
                            </div>
                            <div className="absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-red-300/40 to-transparent" />
                            {/* Icon */}
                            <div className={`mb-6 w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center 
                                ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-7 h-7" strokeWidth={2} />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-red-100/80 text-base md:text-lg leading-relaxed flex-1">
                                {feature.description}
                            </p>

                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400/5 to-transparent 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-16">
                    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-red-400/25 bg-gradient-to-br from-red-950/40 via-black/35 to-red-900/20 p-6 md:p-7 backdrop-blur-sm">
                        <div className="text-center mb-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-red-300/75 font-semibold mb-2">
                                {tx('Ready To Join The Battle', '전투에 참여할 준비가 되셨나요')}
                            </p>
                            <p className="text-red-100/85 text-sm md:text-base">
                                {tx('Create your account, download the client, and enter the world in minutes.', '계정을 만들고 클라이언트를 다운로드한 뒤 몇 분 안에 게임에 접속하세요.')}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-lg
                                    bg-gradient-to-r from-red-500 to-red-600 text-white
                                    shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)]
                                    border-2 border-red-300/40 hover:border-red-200
                                    transition-all duration-300 hover:scale-105"
                            >
                                {local.homeRegister}
                            </Link>
                            <Link
                                href="/download"
                                className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-bold text-lg
                                    bg-red-500/10 border-2 border-red-400/60 text-red-100
                                    hover:bg-red-500/20 hover:border-red-300
                                    shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.35)]
                                    transition-all duration-300 hover:scale-105"
                            >
                                {local.homeDownload}
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-red-100/75">
                            <span>{tx('Unique Systems', '고유 시스템')}</span>
                            <span className="text-red-300/50">|</span>
                            <span>{tx('Frequent Updates', '지속적인 업데이트')}</span>
                            <span className="text-red-300/50">|</span>
                            <span>{tx('Community Driven', '커뮤니티 중심 운영')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
