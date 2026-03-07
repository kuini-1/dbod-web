import { NextRequest, NextResponse } from 'next/server';

const bridgeUrl = process.env.WEB_BRIDGE_URL || 'http://127.0.0.1:8080';
const apiKey = process.env.WEB_BRIDGE_API_KEY || '';

function bridgeHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
}

/** Default status when bridge is unavailable (matches landing page initial state) */
function defaultStatus() {
    return {
        player_count: 0,
        auth: 1,
        chat: 1,
        char: 1,
        channels: {
            ch0: 1, ch1: 1, ch2: 1, ch3: 1, ch4: 1,
            ch5: 1, ch6: 1, ch7: 1, ch8: 1, ch9: 1
        },
        bonuses: null,
        channelBonuses: [] as any[]
    };
}

export async function GET(request: NextRequest) {
    try {
        const [playerRes, channelRes, bonusRes] = await Promise.all([
            fetch(`${bridgeUrl}/api/player-count`, { headers: bridgeHeaders(), cache: 'no-store' }),
            fetch(`${bridgeUrl}/api/channel-status`, { headers: bridgeHeaders(), cache: 'no-store' }),
            fetch(`${bridgeUrl}/api/bonus-state`, {
                method: 'POST',
                headers: bridgeHeaders(),
                body: JSON.stringify({}),
                cache: 'no-store'
            })
        ]);

        const fallback = defaultStatus();

        const playerData = playerRes.ok ? await playerRes.json().catch(() => null) : null;
        const channelData = channelRes.ok ? await channelRes.json().catch(() => null) : null;
        const bonusData = bonusRes.ok ? await bonusRes.json().catch(() => null) : null;

        const player_count = playerData?.player_count ?? playerData?.playerCount ?? fallback.player_count;
        // Bridge sends 1=up/online, 0=down/offline; landing expects 0=online, 1=offline — invert here
        const flip = (v: number | undefined, def: number) => (v === 0 || v === 1 ? 1 - v : def);
        const auth = channelData ? flip(channelData.auth, fallback.auth) : fallback.auth;
        const chat = channelData ? flip(channelData.chat, fallback.chat) : fallback.chat;
        const char = channelData ? flip(channelData.char, fallback.char) : fallback.char;

        const channels = {
            ch0: channelData ? flip(channelData.ch0, fallback.channels.ch0) : fallback.channels.ch0,
            ch1: channelData ? flip(channelData.ch1, fallback.channels.ch1) : fallback.channels.ch1,
            ch2: channelData ? flip(channelData.ch2, fallback.channels.ch2) : fallback.channels.ch2,
            ch3: channelData ? flip(channelData.ch3, fallback.channels.ch3) : fallback.channels.ch3,
            ch4: channelData ? flip(channelData.ch4, fallback.channels.ch4) : fallback.channels.ch4,
            ch5: channelData ? flip(channelData.ch5, fallback.channels.ch5) : fallback.channels.ch5,
            ch6: channelData ? flip(channelData.ch6, fallback.channels.ch6) : fallback.channels.ch6,
            ch7: channelData ? flip(channelData.ch7, fallback.channels.ch7) : fallback.channels.ch7,
            ch8: channelData ? flip(channelData.ch8, fallback.channels.ch8) : fallback.channels.ch8,
            ch9: channelData ? flip(channelData.ch9, fallback.channels.ch9) : fallback.channels.ch9
        };

        const bonuses = bonusData ? {
            soloExpBonus: bonusData.soloExpBonus ?? 0,
            partyExpBonus: bonusData.partyExpBonus ?? 0,
            questExpBonus: bonusData.questExpBonus ?? 0,
            craftExpBonus: bonusData.craftExpBonus ?? 0,
            zeniDropBonus: bonusData.zeniDropBonus ?? 0,
            questMoneyBonus: bonusData.questMoneyBonus ?? 0,
            upgradeRateBonus: bonusData.upgradeRateBonus ?? 0
        } : null;

        const channelBonuses = Array.isArray(bonusData?.channelBonuses) ? bonusData.channelBonuses : [];

        return NextResponse.json({
            player_count,
            auth,
            chat,
            char,
            channels,
            bonuses,
            channelBonuses
        }, { status: 200 });
    } catch (error) {
        console.error('Server status (bridge) error:', error);
        return NextResponse.json(defaultStatus(), { status: 200 });
    }
}
