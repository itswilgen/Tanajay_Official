import { MapPin } from 'lucide-react';
import { formatCityEvent } from '@/lib/city-time';
import { Poster } from './poster';
import { Reveal } from './reveal';

/** One public event, as the landing page needs it. */
export type CityEvent = {
    id: number;
    title: string;
    description: string | null;
    venue: string;
    starts_at: string;
    ends_at: string | null;
    poster: string | null;
};

/**
 * What's on: the next few events, soonest first, as a column beside the
 * notices.
 *
 * Each is led by a date block — the day large, the month small — because the
 * date is what a reader scans this column for; the title comes second. Times
 * are city time, like every time on the site.
 *
 * The soonest event shows its poster across the head of the column, when it
 * has one: it is the one a reader can still act on this week. Later events
 * keep to the date list, or the column would outrun the notices beside it.
 */
export function UpcomingEvents({ events }: { events: CityEvent[] }) {
    if (!events.length) return null;

    return (
        /* `cascade`, matching the notices beside it: both columns of the
           information section are dated lists, and they should arrive as one
           section rather than as two different ideas. */
        <Reveal as="div" index={1} className="events" effect="cascade">
            <h3 className="events-title" id="events-title">
                What’s on
            </h3>
            <ol className="event-list" aria-labelledby="events-title">
                {events.map((event, index) => {
                    const when = formatCityEvent(
                        event.starts_at,
                        event.ends_at,
                    );

                    return (
                        <li className="event" key={event.id}>
                            {index === 0 && (
                                <Poster
                                    src={event.poster}
                                    alt={`Poster for ${event.title}`}
                                    className="event-poster"
                                />
                            )}
                            {when && (
                                <time
                                    className="event-date"
                                    dateTime={event.starts_at}
                                >
                                    <span className="event-day">
                                        {when.day}
                                    </span>
                                    <span className="event-month">
                                        {when.month}
                                    </span>
                                </time>
                            )}
                            <span className="event-copy">
                                <strong>{event.title}</strong>
                                {when && (
                                    <span className="event-when">
                                        {when.detail}
                                    </span>
                                )}
                                <span className="event-venue">
                                    <MapPin size={13} aria-hidden="true" />
                                    {event.venue}
                                </span>
                                {event.description && (
                                    <span className="event-description">
                                        {event.description}
                                    </span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </Reveal>
    );
}

export default UpcomingEvents;
