'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Swords, Zap, Sparkles, Hammer } from 'lucide-react';
import { local } from '@/lib/utils/localize';

const features = [
    {
        icon: Users,
        title: local.dualClass,
        description: local.dualClassDesc,
        gradient: 'from-red-500/20 via-red-500/10 to-transparent',
        borderColor: 'border-red-500/30',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
    },
    {
        icon: Swords,
        title: local.equipmentUpgrade,
        description: local.equipmentUpgradeDesc,
        gradient: 'from-red-500/20 via-red-500/10 to-transparent',
        borderColor: 'border-red-500/30',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
    },
    {
        icon: Zap,
        title: local.fastGameplay,
        description: local.fastGameplayDesc,
        gradient: 'from-red-500/20 via-red-500/10 to-transparent',
        borderColor: 'border-red-500/30',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
    },
    {
        icon: Sparkles,
        title: local.channelBuffs,
        description: local.channelBuffsDesc,
        gradient: 'from-red-500/20 via-red-500/10 to-transparent',
        borderColor: 'border-red-400/30',
        iconBg: 'bg-red-400/20',
        iconColor: 'text-red-300',
    },
    {
        icon: Hammer,
        title: local.craftedEquipment,
        description: local.craftedEquipmentDesc,
        gradient: 'from-red-600/20 via-red-600/10 to-transparent',
        borderColor: 'border-red-400/30',
        iconBg: 'bg-red-400/20',
        iconColor: 'text-red-300',
    },
];

export function CoreFeaturesSection() {
    return (
        <section className="relative w-full py-24 md:py-32 px-4 overflow-hidden">
            {/* Section header */}
            <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-red-400 font-semibold text-sm uppercase tracking-[0.2em] mb-4"
                >
                    Why Play Here
                </motion.p>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
                >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-red-400 to-red-200">
                        {local.coreFeatures}
                    </span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-lg md:text-xl text-red-100/70 max-w-2xl mx-auto"
                >
                    Major features that set our server apart
                </motion.p>
            </div>

            {/* Feature cards - modern bento-style layout */}
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.08, duration: 0.5 }}
                            className={`group relative rounded-2xl p-8 md:p-10 bg-gradient-to-br ${feature.gradient} 
                                backdrop-blur-xl border ${feature.borderColor} 
                                hover:shadow-[0_0_50px_rgba(239,68,68,0.2)]
                                transition-all duration-500 hover:-translate-y-1
                                min-h-[280px] flex flex-col`}
                        >
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

                            {/* Subtle glow on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400/5 to-transparent 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg
                            bg-gradient-to-r from-red-500 to-red-600 text-white
                            shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.4)]
                            border-2 border-red-300/40 hover:border-red-200
                            transition-all duration-300 hover:scale-105"
                    >
                        {local.homeRegister}
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
