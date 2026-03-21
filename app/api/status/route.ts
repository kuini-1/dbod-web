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

        // Bridge may return camelCase or snake_case; values may be 0-100 (percent) or 0-1 (decimal)
        const toPercent = (v: number | undefined, snake?: number | undefined) => {
            const val = v ?? snake ?? 0;
            if (val > 0 && val <= 1) return Math.round(val * 100); // decimal format
            return val;
        };
        const bonuses = bonusData ? {
            soloExpBonus: toPercent(bonusData.soloExpBonus, (bonusData as Record<string, unknown>).solo_exp_bonus as number),
            partyExpBonus: toPercent(bonusData.partyExpBonus, (bonusData as Record<string, unknown>).party_exp_bonus as number),
            questExpBonus: toPercent(bonusData.questExpBonus, (bonusData as Record<string, unknown>).quest_exp_bonus as number),
            craftExpBonus: toPercent(bonusData.craftExpBonus, (bonusData as Record<string, unknown>).craft_exp_bonus as number),
            zeniDropBonus: toPercent(bonusData.zeniDropBonus, (bonusData as Record<string, unknown>).zeni_drop_bonus as number),
            questMoneyBonus: toPercent(bonusData.questMoneyBonus, (bonusData as Record<string, unknown>).quest_money_bonus as number),
            upgradeRateBonus: toPercent(bonusData.upgradeRateBonus, (bonusData as Record<string, unknown>).upgrade_rate_bonus as number)
        } : null;

        const rawChannelBonuses = Array.isArray(bonusData?.channelBonuses)
            ? bonusData.channelBonuses
            : Array.isArray((bonusData as Record<string, unknown>)?.channel_bonuses)
                ? (bonusData as Record<string, unknown>).channel_bonuses as unknown[]
                : [];
        const channelBonuses = rawChannelBonuses.map((b: Record<string, unknown>) => ({
            channelId: b.channelId ?? b.channel_id ?? 0,
            maxLpPercent: toPercent(b.maxLpPercent as number, b.max_lp_percent as number),
            maxEpPercent: toPercent(b.maxEpPercent as number, b.max_ep_percent as number),
            physicalOffencePercent: toPercent(b.physicalOffencePercent as number, b.physical_offence_percent as number),
            energyOffencePercent: toPercent(b.energyOffencePercent as number, b.energy_offence_percent as number),
            physicalDefencePercent: toPercent(b.physicalDefencePercent as number, b.physical_defence_percent as number),
            energyDefencePercent: toPercent(b.energyDefencePercent as number, b.energy_defence_percent as number),
            attackRatePercent: toPercent(b.attackRatePercent as number, b.attack_rate_percent as number),
            dodgeRatePercent: toPercent(b.dodgeRatePercent as number, b.dodge_rate_percent as number)
        }));

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
