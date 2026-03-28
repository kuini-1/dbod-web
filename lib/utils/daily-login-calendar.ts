/**
 * Calendar day for daily login (one claim per calendar day, not a rolling 24h window).
 * Uses a single IANA timezone so "Sat 23:00 → Sun 01:00" counts as a new day.
 *
 * All "current month / day of month / month bounds" use this TZ — not the Node process default,
 * so a UTC server still matches players in Korea (or whatever TZ you set).
 *
 * Set DAILY_LOGIN_CALENDAR_TZ (e.g. Asia/Seoul) or TZ on the host. Defaults to Asia/Seoul.
 */
export function getDailyLoginCalendarTimeZone(): string {
    return (
        process.env.DAILY_LOGIN_CALENDAR_TZ?.trim() ||
        process.env.TZ?.trim() ||
        'Asia/Seoul'
    );
}

/** YYYY-MM-DD for `date` in `timeZone`. */
export function getCalendarDayKey(date: Date, timeZone: string = getDailyLoginCalendarTimeZone()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/** Gregorian calendar { year, month 1–12, day } for `instant` in `timeZone`. */
export function getZonedCalendarParts(
    instant: Date,
    timeZone: string = getDailyLoginCalendarTimeZone()
): { year: number; month: number; day: number } {
    const key = getCalendarDayKey(instant, timeZone);
    const [y, m, d] = key.split('-').map((x) => Number(x));
    return { year: y, month: m, day: d };
}

function compareZonedCalendarDay(
    instant: Date,
    year: number,
    month: number,
    day: number,
    timeZone: string
): number {
    const p = getZonedCalendarParts(instant, timeZone);
    if (p.year !== year) return p.year - year;
    if (p.month !== month) return p.month - month;
    return p.day - day;
}

/** First UTC instant where the wall date in `timeZone` is (year, month, day). */
function findStartOfZonedCalendarDayUtc(
    year: number,
    month: number,
    day: number,
    timeZone: string
): Date {
    let lo = Date.UTC(year, month - 1, day) - 14 * 24 * 60 * 60 * 1000;
    let hi = Date.UTC(year, month - 1, day) + 14 * 24 * 60 * 60 * 1000;
    while (compareZonedCalendarDay(new Date(lo), year, month, day, timeZone) >= 0) {
        lo -= 24 * 60 * 60 * 1000;
    }
    while (compareZonedCalendarDay(new Date(hi), year, month, day, timeZone) < 0) {
        hi += 24 * 60 * 60 * 1000;
    }
    while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (compareZonedCalendarDay(new Date(mid), year, month, day, timeZone) < 0) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    return new Date(hi);
}

/** UTC range [start, end) covering the full calendar month (month 1–12) in `timeZone`. */
export function getZonedMonthUtcRange(
    year: number,
    month1to12: number,
    timeZone: string = getDailyLoginCalendarTimeZone()
): { start: Date; end: Date } {
    const start = findStartOfZonedCalendarDayUtc(year, month1to12, 1, timeZone);
    const next = month1to12 === 12 ? { y: year + 1, m: 1 } : { y: year, m: month1to12 + 1 };
    const end = findStartOfZonedCalendarDayUtc(next.y, next.m, 1, timeZone);
    return { start, end };
}

/** Days in month (month 1–12), Gregorian. */
export function daysInZonedMonth(year: number, month1to12: number): number {
    return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

/** DATEONLY string for "today" in the login calendar (store on claims). */
export function getZonedDateOnlyString(
    now: Date = new Date(),
    timeZone: string = getDailyLoginCalendarTimeZone()
): string {
    return getCalendarDayKey(now, timeZone);
}

/** True if `instant` falls on the same calendar day as `now` in the login calendar TZ. */
export function isSameCalendarDayAsNow(
    instant: Date,
    now: Date = new Date(),
    timeZone: string = getDailyLoginCalendarTimeZone()
): boolean {
    return getCalendarDayKey(instant, timeZone) === getCalendarDayKey(now, timeZone);
}

type ClaimLike = { claimedAt?: unknown; claimDate?: unknown };

/**
 * Wall-calendar key for a claim row: prefer DATEONLY `claimDate` (avoids `claimedAt` TZ drift),
 * else `claimedAt` in `timeZone`.
 */
export function getClaimWallDayKey(
    c: ClaimLike,
    timeZone: string = getDailyLoginCalendarTimeZone()
): string | null {
    if (c.claimDate != null && c.claimDate !== '') {
        const cd = c.claimDate;
        if (typeof cd === 'string') {
            const m = /^(\d{4}-\d{2}-\d{2})/.exec(cd.trim());
            if (m) return m[1];
        }
        const d = new Date(cd as string | Date);
        if (!Number.isNaN(d.getTime())) return getCalendarDayKey(d, timeZone);
    }
    if (c.claimedAt != null && c.claimedAt !== '') {
        const d = new Date(c.claimedAt as string | Date);
        if (!Number.isNaN(d.getTime())) return getCalendarDayKey(d, timeZone);
    }
    return null;
}

/** True if any row has a claim on the same calendar day as `now` (one claim per calendar day). */
export function hasClaimOnCurrentCalendarDay(
    claims: ClaimLike[],
    now: Date = new Date(),
    timeZone: string = getDailyLoginCalendarTimeZone()
): boolean {
    const todayKey = getCalendarDayKey(now, timeZone);
    return claims.some((c) => {
        const key = getClaimWallDayKey(c, timeZone);
        return key !== null && key === todayKey;
    });
}
