'use client';

import { local } from '@/lib/utils/localize';
import { 
    Users, 
    Swords, 
    Zap, 
    Sparkles, 
    Hammer 
} from 'lucide-react';

const features = [
    {
        icon: Users,
        title: local.dualClass,
        description: local.dualClassDesc,
    },
    {
        icon: Swords,
        title: local.equipmentUpgrade,
        description: local.equipmentUpgradeDesc,
    },
    {
        icon: Zap,
        title: local.fastGameplay,
        description: local.fastGameplayDesc,
    },
    {
        icon: Sparkles,
        title: local.channelBuffs,
        description: local.channelBuffsDesc,
    },
    {
        icon: Hammer,
        title: local.craftedEquipment,
        description: local.craftedEquipmentDesc,
    },
];

export function LandingFeatures() {
    return (
        <section className="w-full px-4 py-16 mt-4 flex flex-col items-center bg-stone-800/30 backdrop-blur-sm space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                {local.coreFeatures}
            </h2>
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="bg-stone-800/50 rounded-xl p-6 backdrop-blur-sm border border-stone-700/50 hover:border-red-500/30 transition-colors duration-300 group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 group-hover:bg-red-500/30 transition-colors">
                                <feature.icon className="size-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-stone-100 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-stone-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
