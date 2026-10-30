import { ChevronRight, Image as ImageIcon, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatCityDate } from '@/lib/city-time';
import { useCity } from './city';
import { CityTime } from './city-time';

export type HeroPhoto = {
    path: string;
    alt: string;
};

/**
 * The most recent announcement, when the city has one to show. It carries no
 * link of its own while there is no detail page to carry one to: the strip
 * points at the listing further down this page, where the notice is set in
 * full.
 */
export type HeroAdvisory = {
    title: string;
    published_at?: string | null;
};

const INTERVAL = 7000;
const CROSSFADE = 700;

/* --- The banner plate ----------------------------------------------------
   The City Information Office supplies the left half of the banner as one
   flattened artwork: the green wedge, the ghosted government-centre drawing,
   the Mayor's cutout, and his name set in the office's own lettering. It is
   an official portrait plate, so it is placed as issued rather than taken
   apart and re-typed here.

   The numbers below are measured from that file and are the contract between
   the artwork and everything drawn over it. PLATE_EDGE is where the diagonal
   crosses the top and bottom of the canvas, as a fraction of its width; the
   seam rule is drawn from it, so a re-issued plate only needs these three
   values updated.
   ------------------------------------------------------------------------- */

const PLATE_W = 1774;
const PLATE_H = 787;
const PLATE_EDGE = { top: 681, bottom: 877 };

/**
 * The seam: a hairline gold rule laid exactly along the artwork's diagonal,
 * where the institution's half of the banner meets the city's. It is drawn
 * from the same measurements as the plate and stretches with it, so the two
 * never drift apart.
 *
 * `preserveAspectRatio="none"` is deliberate and pairs with `object-fit: fill`
 * on the plate image: both then map the artwork's coordinate space onto the
 * element box the same way, whatever rounding does to that box. The stroke is
 * held at a constant width so the rule stays a hairline rather than scaling
 * into a wedge of its own.
 *
 * `pathLength={1}` restates the line's length as 1 unit, which is what lets
 * the stylesheet draw it on with a dash offset of 1 → 0 without knowing how
 * long the line actually is at this size.
 */
function Seam() {
    return (
        <svg
            className="hero-seam"
            viewBox={`0 0 ${PLATE_W} ${PLATE_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d={`M ${PLATE_EDGE.top} 0 L ${PLATE_EDGE.bottom} ${PLATE_H}`}
                vectorEffect="non-scaling-stroke"
                pathLength={1}
            />
        </svg>
    );
}

/**
 * Home hero.
 *
 * The banner is a two-layer composition rather than a column split. The
 * photograph runs the full width underneath; the Mayor's plate sits over its
 * left, and the transparent half of that plate is what lets the photograph
 * through. The diagonal a reader sees is the artwork's own edge, so the
 * composition holds together at any width without a clip-path guessing at it.
 *
 * Nothing is laid over the photograph. A caption panel with a segment rail
 * used to sit in the corner the plate leaves free; it was taken out so the
 * photograph reads as a photograph, and what it shows now reaches assistive
 * technology through the office's alt text instead of through drawn copy.
 *
 * One control stays, and has to: the banner advances on its own for longer
 * than five seconds, and WCAG 2.2.2 requires that a reader be able to stop
 * it. The pause button is that mechanism, kept as small as a 44px target
 * allows so it is there to be found without becoming the panel again.
 */
export function CityHero({
    photos,
    advisory = null,
}: {
    photos: HeroPhoto[];
    advisory?: HeroAdvisory | null;
}) {
    const city = useCity();
    const reduced = useReducedMotion();
    const [active, setActive] = useState(0);
    const [outgoing, setOutgoing] = useState<HeroPhoto | null>(null);
    const [paused, setPaused] = useState(false);
    /* Pointer or keyboard attention anywhere in the banner — the rotation
       stops while someone is looking at a photograph or has focus on its
       pause button, which is the carousel behaviour the ARIA practices
       describe. */
    const [engaged, setEngaged] = useState(false);
    const [broken, setBroken] = useState(false);
    const [plateBroken, setPlateBroken] = useState(false);
    const timer = useRef<number | null>(null);

    const count = photos.length;

    const show = useCallback(
        (next: number) => {
            if (next === active || !photos[next]) return;
            setOutgoing(photos[active] ?? null);
            setActive(next);
            setBroken(false);
            if (timer.current !== null) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
                setOutgoing(null);
                timer.current = null;
            }, CROSSFADE);
        },
        [active, photos],
    );

    const advancing = count > 1 && !paused && !engaged && !reduced;

    useEffect(() => {
        if (!advancing) return;
        const id = window.setInterval(
            () => show((active + 1) % count),
            INTERVAL,
        );

        return () => window.clearInterval(id);
    }, [active, advancing, count, show]);

    useEffect(
        () => () => {
            if (timer.current !== null) window.clearTimeout(timer.current);
        },
        [],
    );

    const slide = photos[active];
    const advisoryDate = formatCityDate(advisory?.published_at);

    /* The two things residents most often arrive to check. They used to sit
       in the hero's copy column; the plate occupies that side now, so they
       move to a band directly beneath it where they still read above the
       fold. */
    const brief = (
        <div className="hero-brief">
            <div className="wrap hero-brief-inner">
                <div className="hero-brief-lead">
                    {/* The page's opening statement. A paragraph, not a
                        heading: the document's h1 is the city's legal name,
                        and this line is what the site is for. */}
                    <p className="hero-brief-title">
                        Services, notices and public records, straight from City
                        Hall.
                    </p>
                    <p>
                        Requirements, announcements, job postings, and
                        scholarship programmes — published by the offices that
                        administer them.
                    </p>
                    <div className="hero-actions">
                        <a className="button button-primary" href="#services">
                            Find a service
                            <ChevronRight size={17} aria-hidden="true" />
                        </a>
                        <a
                            className="button button-secondary"
                            href="#information"
                        >
                            Public information
                        </a>
                    </div>
                </div>

                <div className="hero-brief-aside">
                    <CityTime schedule={city.office_hours?.schedule} />

                    {advisory && (
                        <a className="hero-advisory" href="#information">
                            <span className="hero-advisory-body">
                                <span className="hero-advisory-meta">
                                    <span className="hero-advisory-tag">
                                        Latest advisory
                                    </span>
                                    {advisoryDate && (
                                        <time
                                            className="hero-advisory-date"
                                            dateTime={
                                                advisory.published_at ??
                                                undefined
                                            }
                                        >
                                            {advisoryDate}
                                        </time>
                                    )}
                                </span>
                                <span className="hero-advisory-title">
                                    {advisory.title}
                                </span>
                            </span>
                            <ChevronRight size={16} aria-hidden="true" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );

    /* The Mayor's plate, the seam, and the two national emblems. The emblems
       are positioned against the plate rather than the section so they keep
       their place in the artwork's composition as it scales.

       Its entrance is a stylesheet animation rather than a scripted one. This
       is the banner of a government homepage: it should not need JavaScript
       to become visible, and an animation that begins at `opacity: 0` makes
       the artwork's appearing conditional on that script arriving and running.
       CSS also picks up the global reduced-motion reset in base.css for free. */
    const plate = plateBroken ? null : (
        <div className="hero-plate">
            <img
                className="hero-plate-art"
                src="/image/mayor-plate.webp"
                alt={`${city.legal_name} — Hon. Jose T. Orlino, Tanjay City Mayor`}
                fetchPriority="high"
                decoding="async"
                onError={() => setPlateBroken(true)}
            />

            <Seam />

            <p className="hero-emblems">
                <img
                    src="/image/Supreme_Court_of_the_Philippines.svg"
                    alt="Supreme Court of the Philippines"
                    loading="lazy"
                    decoding="async"
                />
                <img
                    src="/image/bagong-pilipinas.webp"
                    alt="Bagong Pilipinas"
                    loading="lazy"
                    decoding="async"
                />
            </p>
        </div>
    );

    // No slides published yet. This is the default state on a fresh install,
    // so it is designed rather than left blank: the plate still carries the
    // city's identity and the first task is still one click away.
    if (!slide) {
        return (
            <>
                <section className="hero hero--plate-only">
                    <h1 className="sr-only">{city.legal_name}</h1>
                    {plate}
                    <div className="hero-plate-fallback" aria-hidden="true">
                        <ImageIcon aria-hidden="true" />
                        <span>
                            Featured photographs appear here once the City
                            Information Office publishes them.
                        </span>
                    </div>
                </section>
                {brief}
            </>
        );
    }

    /* The section opens with the site's h1. The header bar immediately above
       already carries the seal and the full legal name, and the plate sets the
       city's name again inside the artwork, so the banner does not draw the
       same lockup a third time; the heading stays in the document for
       assistive technology and for search, and the bar does the showing. */
    return (
        <>
            <section
                className="hero"
                onMouseEnter={() => setEngaged(true)}
                onMouseLeave={() => setEngaged(false)}
                onFocus={() => setEngaged(true)}
                onBlur={() => setEngaged(false)}
            >
                <h1 className="sr-only">{city.legal_name}</h1>

                {/* The current photograph carries the office's alt text now
                    that no caption is drawn to say what it shows. The outgoing
                    one is only a fading copy for the length of the crossfade,
                    so it stays silent rather than being read twice. No live
                    region: an announcement every seven seconds would talk over
                    whatever the reader is actually doing. */}
                <div className="hero-photo-frame">
                    {broken ? null : (
                        <>
                            {outgoing && (
                                <img
                                    key={`out-${outgoing.path}`}
                                    className="hero-photo hero-photo-outgoing"
                                    src={`/${outgoing.path}`}
                                    alt=""
                                />
                            )}
                            <img
                                key={`${slide.path}-${active}`}
                                className="hero-photo hero-photo-current"
                                src={`/${slide.path}`}
                                alt={slide.alt}
                                fetchPriority={active === 0 ? 'high' : 'auto'}
                                loading={active === 0 ? 'eager' : 'lazy'}
                                onError={() => setBroken(true)}
                            />
                        </>
                    )}
                </div>

                {plate}

                {/* Only with something to rotate, and only while it would
                    rotate on its own: under reduced motion the banner already
                    holds still, and a pause button for a carousel that is not
                    moving is a control that does nothing. */}
                {count > 1 && !reduced && (
                    <button
                        type="button"
                        className="hero-pause"
                        aria-label={
                            paused
                                ? 'Resume automatic slides'
                                : 'Pause automatic slides'
                        }
                        aria-pressed={paused}
                        onClick={() => setPaused((value) => !value)}
                    >
                        {paused ? (
                            <Play size={16} aria-hidden="true" />
                        ) : (
                            <Pause size={16} aria-hidden="true" />
                        )}
                    </button>
                )}
            </section>

            {brief}
        </>
    );
}

export default CityHero;
