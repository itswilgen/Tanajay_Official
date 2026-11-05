import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCityDate } from '@/lib/city-time';
import { Poster } from './poster';

/**
 * One recent development in the city, as the band needs it. `body` is here
 * because the band discloses it in place: there is no detail page to send a
 * reader to yet, and a "Read more" that goes nowhere is worse than none.
 */
export type CityUpdate = {
    id: number;
    category: string;
    title: string;
    standfirst: string;
    body: string;
    cover: string | null;
    published_at?: string | null;
};

/* A cover is 3:4. The numbers are the generated artwork's own
   (tools/covers/render_covers.py), so the browser reserves the right box
   before the file lands and the band never shifts under the reader. */
const COVER_W = 1200;
const COVER_H = 1600;

/**
 * What the city has been doing lately — the band directly under the banner.
 *
 * It replaced the hero brief, and it is built around the cover rather than
 * around the headline, which is the one real difference between this band and
 * the notices listing further down the page. An office that publishes a
 * magazine issue or reports on a project has artwork for it, residents
 * recognise that artwork from the city's own pages, and a cover at 3:4 is a
 * thing you look at in a way that a 16:9 banner cropped into a row is not.
 *
 * So the covers are the navigation. One update is featured in full; the rest
 * stand on a shelf beneath it, and picking one up features it. That is a
 * tablist — the covers are the tabs and the feature is the panel — so it is
 * built as one, with arrow-key movement and selection following focus, rather
 * than as a row of divs with click handlers.
 *
 * Nothing here rotates on its own. The banner above it already advances by
 * itself and already carries the pause control that WCAG 2.2.2 requires for
 * it; a second thing moving on its own in the same screenful would be two
 * things competing for the same glance, and this one is a reader's to drive.
 */
export function CityUpdates({ updates }: { updates: CityUpdate[] }) {
    const reduced = useReducedMotion();
    const [active, setActive] = useState(0);
    const [expanded, setExpanded] = useState(false);
    /* The tab the reader just moved to with a key, so focus can follow the
       selection. Null on a click, where the browser has already moved it. */
    const pending = useRef<number | null>(null);
    const tabs = useRef<Array<HTMLButtonElement | null>>([]);

    const count = updates.length;

    const select = useCallback(
        (next: number, byKeyboard = false) => {
            if (next < 0 || next >= count) return;
            pending.current = byKeyboard ? next : null;
            setActive(next);
            // A different update's body is a different disclosure, so the open
            // one closes rather than silently becoming the new update's.
            setExpanded(false);
        },
        [count],
    );

    useEffect(() => {
        if (pending.current === null) return;
        tabs.current[pending.current]?.focus();
        pending.current = null;
    }, [active]);

    if (!count) return null;

    const update = updates[active];
    const date = formatCityDate(update.published_at);
    const panelId = 'city-update-panel';

    /* Movement within the shelf. Home and End are part of the pattern and are
       cheap to support; a reader on a keyboard should not have to press the
       arrow four times to reach the far cover. */
    const onKeyDown = (event: React.KeyboardEvent) => {
        const moves: Record<string, number> = {
            ArrowRight: active + 1,
            ArrowDown: active + 1,
            ArrowLeft: active - 1,
            ArrowUp: active - 1,
            Home: 0,
            End: count - 1,
        };
        const next = moves[event.key];

        if (next === undefined) return;

        event.preventDefault();
        // Wraps, so the shelf has no dead ends.
        select((next + count) % count, true);
    };

    return (
        <section className="city-updates" aria-labelledby="city-updates-title">
            <div className="wrap city-updates-inner">
                {/* Not a Reveal. The band opens the page: it is already in
                    view when the page loads, so an entrance tied to scrolling
                    into view would either fire at once or never fire at all.
                    The movement in this band belongs to switching covers. */}
                <div className="city-updates-head">
                    <p className="eyebrow">Latest updates</p>
                    <h2 id="city-updates-title">
                        New developments in Tanjay City
                    </h2>
                    <p>
                        What the City Government has been doing lately —
                        published with the cover artwork each office issued for
                        it.
                    </p>
                </div>

                {/* The feature. Keyed on the update, so switching covers
                    replaces the panel rather than mutating it: the outgoing
                    cover leaves and the incoming one arrives, which is what
                    makes picking a cover off the shelf read as picking
                    something up. `mode="wait"` keeps the two from overlapping
                    in a band this tight. */}
                <div
                    className="city-update"
                    id={panelId}
                    role="tabpanel"
                    aria-labelledby={`city-update-tab-${update.id}`}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={update.id}
                            className="city-update-sheet"
                            initial={
                                reduced
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: 24, rotateY: -5 }
                            }
                            animate={
                                reduced
                                    ? { opacity: 1 }
                                    : { opacity: 1, x: 0, rotateY: 0 }
                            }
                            exit={
                                reduced
                                    ? { opacity: 0 }
                                    : { opacity: 0, x: -16, rotateY: 4 }
                            }
                            transition={{
                                duration: reduced ? 0 : 0.34,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ transformPerspective: 1200 }}
                        >
                            <Poster
                                src={update.cover}
                                alt={`Cover for ${update.title}`}
                                className="city-update-cover"
                                width={COVER_W}
                                height={COVER_H}
                                eager
                            />

                            <div className="city-update-body">
                                <p className="city-update-kicker">
                                    <span className="city-update-category">
                                        {update.category}
                                    </span>
                                    {date && (
                                        <time
                                            dateTime={
                                                update.published_at ?? undefined
                                            }
                                        >
                                            {date}
                                        </time>
                                    )}
                                </p>

                                <h3>{update.title}</h3>
                                <p className="city-update-standfirst">
                                    {update.standfirst}
                                </p>

                                {/* A disclosure, not a link. It opens the text
                                    the office wrote, in place, and says so
                                    through aria-expanded. */}
                                <button
                                    type="button"
                                    className="button button-primary city-update-more"
                                    aria-expanded={expanded}
                                    aria-controls={`city-update-text-${update.id}`}
                                    onClick={() => setExpanded((on) => !on)}
                                >
                                    {expanded ? 'Show less' : 'Read more'}
                                    <ChevronDown
                                        size={17}
                                        aria-hidden="true"
                                        className="city-update-chevron"
                                        data-open={expanded ? '' : undefined}
                                    />
                                </button>

                                <AnimatePresence initial={false}>
                                    {expanded && (
                                        <motion.div
                                            id={`city-update-text-${update.id}`}
                                            className="city-update-text"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: 'auto',
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{
                                                duration: reduced ? 0 : 0.28,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                        >
                                            <p>{update.body}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* The shelf. Only with something to switch between: one cover
                    on a shelf of one is a control that does nothing. */}
                {count > 1 && (
                    <div
                        className="city-update-shelf"
                        role="tablist"
                        aria-label="City updates"
                        onKeyDown={onKeyDown}
                    >
                        {updates.map((item, index) => {
                            const current = index === active;

                            return (
                                <button
                                    key={item.id}
                                    ref={(node) => {
                                        tabs.current[index] = node;
                                    }}
                                    type="button"
                                    id={`city-update-tab-${item.id}`}
                                    className="city-update-thumb"
                                    role="tab"
                                    aria-selected={current}
                                    aria-controls={panelId}
                                    // One stop for the whole shelf: the arrows
                                    // move within it, which is the pattern.
                                    tabIndex={current ? 0 : -1}
                                    onClick={() => select(index)}
                                >
                                    <Poster
                                        src={item.cover}
                                        alt=""
                                        className="city-update-thumb-cover"
                                        width={COVER_W}
                                        height={COVER_H}
                                    />
                                    <span className="city-update-thumb-copy">
                                        <span className="city-update-thumb-category">
                                            {item.category}
                                        </span>
                                        <span className="city-update-thumb-title">
                                            {item.title}
                                        </span>
                                    </span>

                                    {/* The gold rule travels to the cover a
                                        reader picks up, rather than switching
                                        off under one and on under the next. */}
                                    {current &&
                                        (reduced ? (
                                            <span className="city-update-marker" />
                                        ) : (
                                            <motion.span
                                                layoutId="city-update-marker"
                                                className="city-update-marker"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 420,
                                                    damping: 34,
                                                }}
                                            />
                                        ))}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

export default CityUpdates;
