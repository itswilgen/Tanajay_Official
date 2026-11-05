/**
 * City time — Philippine Standard Time.
 *
 * Tanjay runs on PST and a real share of the audience does not: overseas
 * workers from the city are a stated part of it. So every date and time this
 * site shows is computed in the city's zone rather than the reader's. A
 * resident in Dubai reading an event's start time against their own clock
 * would be actively misled by it.
 *
 * This module formats dates that are already known — a notice's publication,
 * an event's start. It no longer models the current moment or City Hall's
 * open/closed state: the banner that showed a live clock and that status was
 * replaced by the latest-updates band, and the running clock still on the page
 * is the header strip's own (see site-header.tsx), which needs none of this.
 *
 * Month and weekday names are spelled out here rather than taken from the
 * locale. The site is English-only, and asking Intl for `month: 'long'` makes
 * the rendered string depend on which locale data the browser shipped — a
 * needless variable in a line that has to be identical for every reader.
 */

const CITY_TZ = 'Asia/Manila';

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

/* Built once at module scope: constructing an Intl.DateTimeFormat is the
   expensive part of formatting a date, and the formatting itself is cheap by
   comparison. Every field is numeric so the parts are parsed, never displayed;
   the display strings are assembled below from the name tables. */
const CITY_PARTS = new Intl.DateTimeFormat('en-US', {
    timeZone: CITY_TZ,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

type CityMoment = {
    /** Hour and minute, 12-hour and unpadded: "2:34". */
    hhmm: string;
    /** "AM" or "PM". */
    period: string;
    /** "Thursday, 30 October 2026". */
    date: string;
};

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * A moment read in the city's zone, or null if the environment cannot resolve
 * that zone. Null is a real outcome, not a defensive flourish: `timeZone` on a
 * stripped-down ICU build throws, and a time that cannot prove it is city time
 * should not be shown rather than quietly shown as the reader's own.
 */
function cityMoment(at: Date): CityMoment | null {
    try {
        const parts = CITY_PARTS.formatToParts(at);
        const read = (type: Intl.DateTimeFormatPartTypes): string =>
            parts.find((part) => part.type === type)?.value ?? '';

        const weekday = WEEKDAY_INDEX[read('weekday')];
        // Some engines render midnight as "24" under hour12: false.
        const hour = Number(read('hour')) % 24;
        const minute = Number(read('minute'));
        const year = Number(read('year'));
        const month = Number(read('month'));
        const date = Number(read('day'));

        if (
            !weekday ||
            [hour, minute, year, month, date].some(Number.isNaN) ||
            !MONTH_NAMES[month - 1]
        ) {
            return null;
        }

        return {
            hhmm: `${hour % 12 === 0 ? 12 : hour % 12}:${pad(minute)}`,
            period: hour < 12 ? 'AM' : 'PM',
            date: `${WEEKDAY_NAMES[weekday]}, ${date} ${MONTH_NAMES[month - 1]} ${year}`,
        };
    } catch {
        return null;
    }
}

/** A published date as the city prints it: "30 October 2026". */
export function formatCityDate(value?: string | null): string | null {
    if (!value) return null;

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return null;

    const moment = cityMoment(parsed);

    if (!moment) return null;

    // The weekday prefix belongs on "today", not on an archive date.
    return moment.date.slice(moment.date.indexOf(', ') + 2);
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
    const starts = cityMoment(new Date(startsAt));

    if (!starts) return null;

    // "Sunday, 2 November 2026" → weekday, day, month name.
    const split = (date: string) => {
        const [weekday, rest] = date.split(', ');
        const [day, month] = rest.split(' ');

        return { weekday, day, month };
    };

    const start = split(starts.date);
    const time = `${starts.hhmm} ${starts.period}`;
    const ends = endsAt ? cityMoment(new Date(endsAt)) : null;

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
