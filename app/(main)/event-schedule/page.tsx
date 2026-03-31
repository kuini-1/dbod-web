'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';

type WeeklyEvent = {
    title: string;
    startTime: string;
    endTime?: string;
};

type DaySchedule = {
    dayKey: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    events: WeeklyEvent[];
};

const WEEKLY_SCHEDULE: DaySchedule[] = [
    {
        dayKey: 'monday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
            { title: 'Scramble', startTime: '12:00', endTime: '14:00' },
        ],
    },
    {
        dayKey: 'tuesday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
        ],
    },
    {
        dayKey: 'wednesday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
            { title: 'Scramble', startTime: '00:00', endTime: '02:00' },
        ],
    },
    {
        dayKey: 'thursday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
        ],
    },
    {
        dayKey: 'friday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
            { title: 'Dragon Ball Hunt', startTime: '18:00', endTime: '22:00' },
            { title: 'Scramble', startTime: '20:00', endTime: '22:00' },
        ],
    },
    {
        dayKey: 'saturday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
            { title: 'Dragon Ball Hunt', startTime: '13:00', endTime: '23:00' },
            { title: 'EXP +200%', startTime: '00:00', endTime: '23:00' },
        ],
    },
    {
        dayKey: 'sunday',
        events: [
            { title: 'Budokai (Adult)', startTime: '04:00', endTime: '05:00' },
            { title: 'Budokai (Child)', startTime: '06:00', endTime: '07:00' },
            { title: 'Budokai Party (Adult)', startTime: '08:00', endTime: '09:00' },
            { title: 'Budokai Party (Child)', startTime: '10:00', endTime: '11:00' },
            { title: 'Dragon Ball Hunt', startTime: '13:00', endTime: '23:00' },
            { title: 'EXP +200%', startTime: '00:00', endTime: '23:00' },
        ],
    },
];

const DAY_ORDER: DaySchedule['dayKey'][] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function isTimeInRange(currentMinutes: number, startMinutes: number, endMinutes: number): boolean {
    if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    // Handles ranges that cross midnight, e.g. 23:00 -> 01:00.
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function getKstTimeParts(date: Date): { dayIndexMondayBased: number; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
    const weekdayMap: Record<string, number> = {
        Mon: 0,
        Tue: 1,
        Wed: 2,
        Thu: 3,
        Fri: 4,
        Sat: 5,
        Sun: 6,
    };

    return {
        dayIndexMondayBased: weekdayMap[weekday] ?? 0,
        minutes: hour * 60 + minute,
    };
}

export default function EventSchedulePage() {
    const { locale } = useLocale();
    const tx = useCallback((en: string, kr: string) => (locale === 'kr' ? kr : en), [locale]);
    const [now, setNow] = useState(() => new Date());
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const kstParts = useMemo(() => (now ? getKstTimeParts(now) : null), [now]);
    const dayIndexMondayBased = kstParts?.dayIndexMondayBased ?? -1;
    const currentMinutes = kstParts?.minutes ?? -1;

    const dayLabel = useMemo(
        () => ({
            monday: tx('Monday', '월요일'),
            tuesday: tx('Tuesday', '화요일'),
            wednesday: tx('Wednesday', '수요일'),
            thursday: tx('Thursday', '목요일'),
            friday: tx('Friday', '금요일'),
            saturday: tx('Saturday', '토요일'),
            sunday: tx('Sunday', '일요일'),
        }),
        [tx]
    );

    const schedule = useMemo(() => {
        return DAY_ORDER.map((dayKey, index) => {
            const day = WEEKLY_SCHEDULE.find((entry) => entry.dayKey === dayKey);
            const events = day?.events ?? [];
            const isToday = dayIndexMondayBased >= 0 && index === dayIndexMondayBased;

            const eventsWithStatus = events.map((event) => {
                const startMinutes = toMinutes(event.startTime);
                const endMinutes = event.endTime ? toMinutes(event.endTime) : null;
                const isActive = isToday
                    && (endMinutes === null
                        ? currentMinutes >= startMinutes
                        : isTimeInRange(currentMinutes, startMinutes, endMinutes));

                return {
                    ...event,
                    isActive,
                    timeLabel: event.endTime
                        ? `${event.startTime} - ${event.endTime} KST`
                        : `${event.startTime} KST (${tx('Until finished', '종료 시까지')})`,
                };
            });

            const hasCurrentEvent = eventsWithStatus.some((event) => event.isActive);
            return {
                dayKey,
                events: eventsWithStatus,
                hasCurrentEvent,
                isToday,
            };
        });
    }, [dayIndexMondayBased, currentMinutes, tx]);

    const currentKstText = useMemo(() => {
        return new Intl.DateTimeFormat(locale === 'kr' ? 'ko-KR' : 'en-US', {
            timeZone: 'Asia/Seoul',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(now);
    }, [locale, now]);

    return (
        <div className="text-white bg-stone-900 min-h-screen px-4 py-16">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event('open-event-daily-login-modal'))}
                        className="rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-500/20 transition-colors duration-200 cursor-pointer"
                    >
                        {tx('Open Event Daily Login', '이벤트 출석 열기')}
                    </button>
                </div>
                <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/15 to-stone-800/80 p-6 md:p-7 mb-8">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-red-300 mb-2">
                                {tx('Weekly Event Schedule', '주간 이벤트 일정')}
                            </h1>
                            <p className="text-stone-300">
                                {tx(
                                    '7-day event view with start/end times and live status (KST).',
                                    '7일 이벤트 보기: 시작/종료 시간 및 실시간 상태 (KST).'
                                )}
                            </p>
                        </div>
                        <div className="inline-flex flex-col items-start md:items-end gap-1 text-sm">
                            <span className="text-stone-400">{tx('Current KST', '현재 KST')}</span>
                            <span className="font-mono text-red-200 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-1.5">
                                {isMounted ? currentKstText : '--:--:--'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-5 text-xs">
                        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-300" />
                            {tx('Active', '활성')}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md border border-stone-600 bg-stone-700/70 px-2.5 py-1 text-stone-300">
                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                            {tx('Inactive', '비활성')}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {schedule.map((day) => (
                        <section
                            key={day.dayKey}
                            className={`rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 ${
                                day.isToday
                                    ? 'border-red-500/60 bg-gradient-to-b from-red-500/10 to-stone-800/85'
                                    : 'border-stone-700 bg-stone-800/70'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{dayLabel[day.dayKey]}</h2>
                                {day.isToday ? (
                                    <span className="text-xs uppercase tracking-wide text-red-300">
                                        {tx('Today', '오늘')}
                                    </span>
                                ) : null}
                            </div>

                            {day.events.length === 0 ? (
                                <p className="text-stone-400 text-sm rounded-lg border border-dashed border-stone-700/80 bg-stone-900/40 px-3 py-2">
                                    {tx('No events scheduled', '예정된 이벤트가 없습니다')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {day.events.map((event, idx) => (
                                        <div
                                            key={`${day.dayKey}-${idx}`}
                                            className={`rounded-lg border p-3 ${
                                                event.isActive
                                                    ? 'border-emerald-500/40 bg-emerald-500/10'
                                                    : 'border-stone-700 bg-stone-900/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-medium text-stone-100">{event.title}</p>
                                                <span
                                                    className={`text-xs font-semibold px-2 py-1 rounded ${
                                                        event.isActive
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                            : 'bg-stone-700 text-stone-300 border border-stone-600'
                                                    }`}
                                                >
                                                    {event.isActive ? tx('Active', '활성') : tx('Inactive', '비활성')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-stone-400 mt-1 font-mono">{event.timeLabel}</p>
                                        </div>
                                    ))}
                                    {!day.hasCurrentEvent ? (
                                        <p className="text-xs text-stone-400 pt-1">
                                            {tx('No current events', '현재 진행 중인 이벤트가 없습니다')}
                                        </p>
                                    ) : null}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
