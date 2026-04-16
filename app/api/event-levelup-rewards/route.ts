import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import { getUserFromRequest } from '@/lib/auth/utils';
import { characters } from '@/lib/models/characters';
import {
    event_levelup_events,
    event_levelup_rewards,
    event_levelup_claims,
} from '@/lib/models/event_levelup';
import { getCalendarDayKey, getDailyLoginCalendarTimeZone } from '@/lib/utils/daily-login-calendar';
import { getEventWindowAndDayIndex, parseDateOnlyKey } from '@/lib/utils/event-daily-login';
import { loadCashshopItemMetaByIds } from '@/lib/utils/load-cashshop-item-meta';

type EventCharacter = {
    CharID: number;
    CharName: string;
    Level: number;
    Class: number | null;
};

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const userId = user?.AccountID;
        if (!userId) {
            return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
        }

        const tz = getDailyLoginCalendarTimeZone();
        const searchParams = request.nextUrl.searchParams;
        const eventIdRaw = searchParams.get('eventId');
        const slug = searchParams.get('slug')?.trim();
        const selectedCharacterRaw = searchParams.get('characterId');

        let event: Awaited<ReturnType<typeof event_levelup_events.findOne>> = null;

        if (eventIdRaw) {
            const id = Number(eventIdRaw);
            if (!Number.isFinite(id) || id < 1) {
                return NextResponse.json({ success: false, message: 'Invalid eventId' }, { status: 400 });
            }
            event = await event_levelup_events.findOne({
                where: { id, isActive: true },
            });
            if (!event) {
                return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
            }
        } else if (slug) {
            event = await event_levelup_events.findOne({
                where: { slug, isActive: true },
            });
            if (!event) {
                return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
            }
        } else {
            const todayKey = getCalendarDayKey(new Date(), tz);
            // Include upcoming events (start in the future): UI shows "not started yet".
            // Old query required startDate <= today, which hid every upcoming campaign as "no event".
            event = await event_levelup_events.findOne({
                where: {
                    isActive: true,
                    endDate: { [Op.gte]: todayKey },
                },
                order: [['id', 'DESC']],
            });
            if (!event) {
                return NextResponse.json({ success: true, hasActiveEvent: false }, { status: 200 });
            }
        }

        const ev = event as unknown as {
            id: number;
            title: string | null;
            slug: string | null;
            startDate: unknown;
            endDate: unknown;
        };

        const accountCharacters = (await characters.findAll({
            where: { AccountID: userId },
            attributes: ['CharID', 'CharName', 'Level', 'Class'],
            order: [['Level', 'DESC'], ['CharName', 'ASC']],
            raw: true,
        })) as EventCharacter[];

        if (accountCharacters.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No character found for this account', hasActiveEvent: true },
                { status: 400 }
            );
        }

        const requestedCharacterId = selectedCharacterRaw ? Number(selectedCharacterRaw) : NaN;
        const selectedCharacter =
            Number.isFinite(requestedCharacterId) && requestedCharacterId > 0
                ? accountCharacters.find((c) => Number(c.CharID) === requestedCharacterId) ?? accountCharacters[0]
                : accountCharacters[0];

        const now = new Date();
        const startKey = parseDateOnlyKey(ev.startDate);
        const endKey = parseDateOnlyKey(ev.endDate);
        if (!startKey || !endKey) {
            return NextResponse.json({ success: false, message: 'Invalid event dates' }, { status: 500 });
        }

        const { status } = getEventWindowAndDayIndex(startKey, endKey, now, tz);

        const rewardRows = await event_levelup_rewards.findAll({
            where: { eventId: ev.id },
            order: [['requiredLevel', 'ASC']],
        });

        const claims = await event_levelup_claims.findAll({
            where: {
                eventId: ev.id,
                AccountID: userId,
                characterId: selectedCharacter.CharID,
            },
        });

        const claimedLevels = new Set<number>();
        for (const claim of claims) {
            const lv = Number(claim.requiredLevel);
            if (Number.isFinite(lv) && lv > 0) claimedLevels.add(lv);
        }

        const itemMetaById = await loadCashshopItemMetaByIds(rewardRows.map((r) => Number(r.itemId)));
        const selectedLevel = Number(selectedCharacter.Level ?? 1);

        const data = rewardRows.map((row) => {
            const requiredLevel = Number(row.requiredLevel);
            const claimed = claimedLevels.has(requiredLevel);
            const configuredItemId = Number(row.itemId);
            const isConfigured = configuredItemId > 0;
            return {
                requiredLevel,
                itemId: configuredItemId,
                amount: Number(row.amount),
                name: itemMetaById.get(configuredItemId)?.name ?? (isConfigured ? `Item ${row.itemId}` : 'Not configured'),
                iconUrl: itemMetaById.get(configuredItemId)?.iconUrl ?? '/event icons/i_hls_aoto_lp_s.png',
                claimed,
                available: status === 'active' && !claimed && isConfigured && selectedLevel >= requiredLevel,
            };
        });

        return NextResponse.json(
            {
                success: true,
                hasActiveEvent: true,
                status,
                event: {
                    id: ev.id,
                    title: ev.title,
                    slug: ev.slug,
                    startDate: startKey,
                    endDate: endKey,
                },
                selectedCharacterId: Number(selectedCharacter.CharID),
                selectedCharacter: {
                    charId: Number(selectedCharacter.CharID),
                    charName: selectedCharacter.CharName,
                    level: selectedLevel,
                    class: selectedCharacter.Class ?? null,
                },
                characters: accountCharacters.map((char) => ({
                    charId: Number(char.CharID),
                    charName: char.CharName,
                    level: Number(char.Level ?? 1),
                    class: char.Class ?? null,
                })),
                data,
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('Error fetching level-up event rewards:', e);
        return NextResponse.json({ success: false, message: 'Failed to fetch level-up event rewards' }, { status: 500 });
    }
}
