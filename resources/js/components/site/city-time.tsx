import { useEffect, useState } from 'react';
import {
    cityClock,
    officeStatus,
    type CityClock,
    type OfficeSchedule,
} from '@/lib/city-time';

/**
 * The city's own clock.
 *
 * Two facts a resident arrives to check, and they are the same fact: what time
 * it is in Tanjay, and whether City Hall is open. They are rendered together
 * and computed from a single tick, so the clock and the status cannot disagree
 * — which they could when the status kept its own interval and the two drifted
 * apart across a minute boundary.
 *
 * The seconds are shown, de-emphasised. A government clock that ticks reads as
 * live rather than as a timestamp baked into the page, and that is the whole
 * point of putting it here: it tells an overseas reader that the open/closed
 * state beneath it is being worked out right now, in city time, rather than
 * guessed from their own.
 */
export function CityTime({ schedule }: { schedule?: OfficeSchedule | null }) {
    /* Seeded during render rather than after mount, so the first paint already
       carries the right time and nothing shifts underneath the reader. There is
       no SSR entry in this app, so this only ever runs in the browser;
       `suppressHydrationWarning` on the readout is there in case one is added,
       since a clock is the one thing that legitimately cannot match the
       server's render. */
    const [clock, setClock] = useState<CityClock | null>(() => cityClock());

    useEffect(() => {
        const id = window.setInterval(() => setClock(cityClock()), 1000);

        return () => window.clearInterval(id);
    }, []);

    // The environment could not resolve Asia/Manila. Showing the reader's own
    // clock under a "Philippine Standard Time" label would be worse than
    // showing nothing, so the block goes.
    if (!clock) return null;

    const status = officeStatus(clock, schedule);

    return (
        <div className="city-time">
            <p className="city-time-label">
                Philippine Standard Time
                <span className="city-time-zone">UTC+8</span>
            </p>

            <p className="city-time-now">
                <time dateTime={clock.iso} suppressHydrationWarning>
                    <span className="city-time-hhmm">{clock.hhmm}</span>
                    <span className="city-time-seconds">:{clock.seconds}</span>
                    <span className="city-time-period">{clock.period}</span>
                </time>
            </p>

            <p className="city-time-date">{clock.date}</p>

            {status && (
                <p
                    className={`city-time-status${status.open ? ' is-open' : ''}`}
                >
                    <span className="city-time-dot" aria-hidden="true" />
                    <strong>
                        {status.open
                            ? 'City Hall is open'
                            : 'City Hall is closed'}
                    </strong>
                    <span className="city-time-detail">{status.detail}</span>
                </p>
            )}
        </div>
    );
}

export default CityTime;
