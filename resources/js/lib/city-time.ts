/**
 * City time — Philippine Standard Time.
 *
 * Tanjay runs on PST and a real share of the audience does not: overseas
 * workers from the city are a stated part of it. So every time this site shows
 * is computed in the city's zone rather than the reader's, and labelled as
 * such. A resident in Dubai reading "City Hall is open" against their own
 * clock would be actively misled by it.
 *
 * Declared holidays are not modelled (see config/portal.php), which is why the
 * open/closed state is phrased against regular hours and the contact pages
 * carry the fuller caveat.
 *
 * Month and weekday names are spelled out here rather than taken from the
 * locale. The site is English-only, and asking Intl for `month: 'long'` makes
 * the rendered string depend on which locale data the browser shipped — a
 * needless variable in a line that has to be identical for every reader.
 */

export const CITY_TZ = 'Asia/Manila';

/** PST has no daylight saving, so the offset is a constant, not a lookup. */
export const CITY_UTC_OFFSET = '+08:00';

const WEEKDAY_INDEX: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
};

const WEEKDAY_NAMES = [
    '',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

/* Built once at module scope. `cityClock` runs every second while the page is
   open, and constructing an Intl.DateTimeFormat is the expensive part of it —
   the formatting itself is cheap by comparison. Every field is numeric so the
   parts are parsed, never displayed; the display strings are assembled below
   from the name tables. */
const CITY_PARTS = new Intl.DateTimeFormat('en-US', {
    timeZone: CITY_TZ,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
});

export type CityClock = {
    /** ISO weekday: 1 is Monday, 7 is Sunday. */
    day: number;
    /** Minutes since midnight in the city — what the schedule compares against. */
    minutes: number;
    /** Hour and minute, 12-hour and unpadded: "2:34". */
    hhmm: string;
    /** Seconds, zero-padded: "07". Set apart so it can be de-emphasised. */
    seconds: string;
    /** "AM" or "PM". */
    period: string;
    /** "Thursday, 30 October 2026". */
    date: string;
    /** Machine-readable, for a <time datetime> attribute. */
    iso: string;
};

export type OfficeSchedule = {
    /** ISO weekdays the office keeps regular hours on. */
    days: number[];
    /** "08:00" */
    opens: string;
    /** "17:00" */
    closes: string;
};

export type OfficeStatus = {
    open: boolean;
    /** The qualifier after the headline: "until 5:00 PM", "opens Monday, 8:00 AM". */
    detail: string;
};

const pad = (value: number): string => String(value).padStart(2, '0');

/** Minutes since midnight from a "HH:MM" schedule value. */
export function toMinutes(value: string): number {
    const [hour, minute] = value.split(':').map(Number);

    return hour * 60 + minute;
}

/** "17:00" as the city would print it: "5:00 PM". */
export function toClock(value: string): string {
    const [hour, minute] = value.split(':').map(Number);
    const period = hour < 12 ? 'AM' : 'PM';
    const display = hour % 12 === 0 ? 12 : hour % 12;

    return `${display}:${pad(minute)} ${period}`;
}

/**
 * The current moment in the city, or null if the environment cannot resolve
 * the zone. Null is a real outcome, not a defensive flourish: `timeZone` on a
 * stripped-down ICU build throws, and a clock that cannot prove it is showing
 * city time should show nothing rather than quietly show the reader's own.
 */
export function cityClock(at: Date = new Date()): CityClock | null {
    try {
        const parts = CITY_PARTS.formatToParts(at);
        const read = (type: Intl.DateTimeFormatPartTypes): string =>
            parts.find((part) => part.type === type)?.value ?? '';

        const day = WEEKDAY_INDEX[read('weekday')];
        // Some engines render midnight as "24" under hour12: false.
        const hour = Number(read('hour')) % 24;
        const minute = Number(read('minute'));
        const second = Number(read('second'));
        const year = Number(read('year'));
        const month = Number(read('month'));
        const date = Number(read('day'));

        if (
            !day ||
            [hour, minute, second, year, month, date].some(Number.isNaN) ||
            !MONTH_NAMES[month - 1]
        ) {
            return null;
        }

        return {
            day,
            minutes: hour * 60 + minute,
            hhmm: `${hour % 12 === 0 ? 12 : hour % 12}:${pad(minute)}`,
            seconds: pad(second),
            period: hour < 12 ? 'AM' : 'PM',
            date: `${WEEKDAY_NAMES[day]}, ${date} ${MONTH_NAMES[month - 1]} ${year}`,
            iso: `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:${pad(second)}${CITY_UTC_OFFSET}`,
        };
    } catch {
        return null;
    }
}

/**
 * Whether the office keeps regular hours at this moment, and the qualifier to
 * print beside it.
 *
 * Pure in the clock: it does not read the current time itself, so the status
 * and the clock a reader sees can never disagree by a tick, and the whole
 * thing is testable without mocking Date.
 */
export function officeStatus(
    clock: CityClock,
    schedule?: OfficeSchedule | null,
): OfficeStatus | null {
    if (!schedule?.days?.length) return null;

    const { days, opens, closes } = schedule;
    const opensAt = toMinutes(opens);
    const closesAt = toMinutes(closes);

    if (days.includes(clock.day)) {
        if (clock.minutes >= opensAt && clock.minutes < closesAt) {
            return { open: true, detail: `until ${toClock(closes)}` };
        }

        if (clock.minutes < opensAt) {
            return { open: false, detail: `opens today, ${toClock(opens)}` };
        }
    }

    // Past closing, or a day the office does not keep hours: walk forward to
    // the next day it does. Bounded at 7, so a schedule with no open days at
    // all returns null instead of spinning.
    for (let step = 1; step <= 7; step += 1) {
        const day = ((clock.day - 1 + step) % 7) + 1;

        if (days.includes(day)) {
            const when = step === 1 ? 'tomorrow' : WEEKDAY_NAMES[day];

            return { open: false, detail: `opens ${when}, ${toClock(opens)}` };
        }
    }

    return null;
}

/** A published date as the city prints it: "30 October 2026". */
export function formatCityDate(value?: string | null): string | null {
    if (!value) return null;

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return null;

    const clock = cityClock(parsed);

    if (!clock) return null;

    // The weekday prefix belongs on "today", not on an archive date.
    return clock.date.slice(clock.date.indexOf(', ') + 2);
}

/**
 * The same date abbreviated for a dense row: "30 Oct". The year is dropped
 * because the rows it labels are the most recent notices, where it would be
 * the current year on every line and carry no information.
 */
export function formatCityDayMonth(value?: string | null): string | null {
    const full = formatCityDate(value);

    if (!full) return null;

    const [day, month] = full.split(' ');

    return `${day} ${month.slice(0, 3)}`;
}

export type CityEventDate = {
    /** "2" — the day of the month, for the date block. */
    day: string;
    /** "Nov" */
    month: string;
    /** "Sunday · 8:00 AM", or "From 9:00 AM · until Thursday, 19 November". */
    detail: string;
};

/**
 * An event's date block and the line beneath it, in city time. An event that
 * ends on a later day says when it ends rather than when it starts on each
 * day, because "until Thursday" is what decides whether a reader can still go.
 */
export function formatCityEvent(
    startsAt: string,
    endsAt?: string | null,
): CityEventDate | null {
    const starts = cityClock(new Date(startsAt));

    if (!starts) return null;

    // "Sunday, 2 November 2026" → weekday, day, month name.
    const split = (date: string) => {
        const [weekday, rest] = date.split(', ');
        const [day, month] = rest.split(' ');

        return { weekday, day, month };
    };

    const start = split(starts.date);
    const time = `${starts.hhmm} ${starts.period}`;
    const ends = endsAt ? cityClock(new Date(endsAt)) : null;

    if (ends && ends.date !== starts.date) {
        const end = split(ends.date);

        return {
            day: start.day,
            month: start.month.slice(0, 3),
            detail: `From ${time} · until ${end.weekday}, ${end.day} ${end.month}`,
        };
    }

    return {
        day: start.day,
        month: start.month.slice(0, 3),
        detail: `${start.weekday} · ${time}`,
    };
}
