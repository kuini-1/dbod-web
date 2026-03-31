import {
    getCalendarDayKey,
    getDailyLoginCalendarTimeZone,
} from './daily-login-calendar';

export type EventWindowStatus = 'upcoming' | 'active' | 'ended';

/** Normalize DB / API date-only values to YYYY-MM-DD. */
export function parseDateOnlyKey(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value === 'string') {
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
        return m ? m[1] : null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const y = value.getUTCFullYear();
        const mo = String(value.getUTCMonth() + 1).padStart(2, '0');
        const d = String(value.getUTCDate()).padStart(2, '0');
        return `${y}-${mo}-${d}`;
    }
    return null;
}

/** Whole calendar days from startKey to endKey (inclusive endpoints yield non-negative when end >= start). */
export function diffCalendarDaysUtc(startKey: string, endKey: string): number {
    const [ys, ms, ds] = startKey.split('-').map((x) => Number(x));
    const [ye, me, de] = endKey.split('-').map((x) => Number(x));
    const s = Date.UTC(ys, ms - 1, ds);
    const e = Date.UTC(ye, me - 1, de);
    return Math.round((e - s) / 86400000);
}

export function getEventWindowStatus(
    startKey: string,
    endKey: string,
    todayKey: string
): EventWindowStatus {
    if (todayKey < startKey) return 'upcoming';
    if (todayKey > endKey) return 'ended';
    return 'active';
}

/**
 * Event day index: 1 on startDate, +1 each calendar day until endDate (inclusive window).
 * Returns null when outside [start, end] on the login calendar.
 */
export function getEventDayIndex(
    startKey: string,
    endKey: string,
    now: Date = new Date(),
    timeZone: string = getDailyLoginCalendarTimeZone()
): number | null {
    const todayKey = getCalendarDayKey(now, timeZone);
    const status = getEventWindowStatus(startKey, endKey, todayKey);
    if (status !== 'active') return null;
    return diffCalendarDaysUtc(startKey, todayKey) + 1;
}

export function getEventWindowAndDayIndex(
    startKey: string,
    endKey: string,
    now: Date = new Date(),
    timeZone: string = getDailyLoginCalendarTimeZone()
): { status: EventWindowStatus; todayKey: string; eventDayIndex: number | null } {
    const todayKey = getCalendarDayKey(now, timeZone);
    const status = getEventWindowStatus(startKey, endKey, todayKey);
    const eventDayIndex =
        status === 'active' ? diffCalendarDaysUtc(startKey, todayKey) + 1 : null;
    return { status, todayKey, eventDayIndex };
}
