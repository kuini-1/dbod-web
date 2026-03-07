'use client';

import { useEffect, useState } from 'react';
import { API } from '@/lib/api/client';
import { LandingHero } from '@/components/landing/LandingHero';
import { CoreFeaturesSection } from '@/components/landing/CoreFeaturesSection';
import { ServerStatusSection } from '@/components/landing/ServerStatusSection';

export default function HomePage() {
    const [status, setStatus] = useState({
        player_count: 0, 
        auth: 1, 
        chat: 1,
        char: 1,
        channels: {
            ch0: 1, ch1: 1, ch2: 1, ch3: 1, ch4: 1,
            ch5: 1, ch6: 1, ch7: 1, ch8: 1, ch9: 1
        },
        bonuses: null as {
            soloExpBonus?: number;
            partyExpBonus?: number;
            questExpBonus?: number;
            craftExpBonus?: number;
            zeniDropBonus?: number;
            questMoneyBonus?: number;
            upgradeRateBonus?: number;
        } | null,
        channelBonuses: [] as Array<{
            channelId: number;
            maxLpPercent?: number;
            maxEpPercent?: number;
            physicalOffencePercent?: number;
            energyOffencePercent?: number;
            physicalDefencePercent?: number;
            energyDefencePercent?: number;
            attackRatePercent?: number;
            dodgeRatePercent?: number;
        }>
    });

    useEffect(() => {
        (async () => {
            try {
                const server_status = await API.get("/status");
                if (server_status.status === 200) {
                    const data = server_status.data;
                    if (data.channels) {
                        setStatus(data);
                    } else {
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

    return (
        <div className="text-white min-h-screen overflow-x-hidden relative bg-[#0c0a09]">
            {/* MMORPG-style gradient: dark world with subtle energy tint */}
            <div className="fixed inset-0 bg-gradient-to-b from-[#0c0a09] via-[#1c1917] to-[#0c0a09] -z-10" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.03)_0%,_transparent_50%)] -z-10" />
            
            <LandingHero />
            <CoreFeaturesSection />
            <ServerStatusSection status={status} />
        </div>
    );
}
