import { Image as ImageIcon, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useThriftyConnection } from '@/lib/connection';
import { useMediaQuery } from '@/lib/viewport';
import { useCity } from './city';

export type HeroPhoto = {
    path: string;
    alt: string;
};

const INTERVAL = 7000;
const CROSSFADE = 700;

/* --- The banner plate ----------------------------------------------------
   The City Information Office issues the banner as one flattened artwork with
   a transparent wedge cut out of its right-hand side: the gold field, the
   ghosted government centre, the Mayor's cutout, the office's own "Basta
   Tanjay / PP / Panerbisyo Pinangay" lettering, its red sweep, and four
   national and city emblems along the foot. It is an official plate, so it
   goes in as issued rather than being taken apart and re-typed here.

   The numbers are the artwork's own, measured off the file, and they are the
   contract between it and the box it sits in. The transparent wedge runs from
   x 1270 at the top of the canvas to x 1451 at the foot — 79.8% to 91.2% of
   the width — so the artwork covers almost the whole frame and the photograph
   shows through a narrowing diagonal reveal down its right edge.

   Nothing is drawn over the plate. The seam that used to be — a gold ribbon
   laid along the old plate's diagonal at 38% to 49% of the width — was
   measured for a different artwork, and on this one it fell straight across
   the Mayor and the lettering instead of along any edge. The emblems that
   used to be laid over it are in the artwork too, so the pair this component
   drew were duplicates of the office's own.
   ------------------------------------------------------------------------- */

const PLATE = { w: 1591, h: 798 };

/* --- The phone banner ----------------------------------------------------
   The same artwork, flattened.

   The office issues the plate with a transparent wedge down its right-hand
   side, which on the wide layout is what the photograph shows through. A phone
   has no room for that composition: stacked, the wedge opened onto nothing and
   the stylesheet was painting a green gradient into it to stand in for the
   photograph that was no longer behind it — a colour invented here, for a hole
   in official artwork, on the one layout where the artwork is the entire
   banner.

   So the phone gets the plate as a complete rectangle instead. It is not new
   artwork: `design/source-art/image/newTemplate.png` is the issued file before
   the wedge was cut, and these two WebPs are reductions of it — the same
   pixels, the same ratio, nothing cropped and nothing drawn on top.

   Two widths, both sized for a phone rather than for a desktop that will never
   ask for them: 800 covers a 390px screen at 2x, 1400 covers 390 at 3x and the
   700px top of the mobile layout at 2x.
   ------------------------------------------------------------------------- */

const SOLID_SRC = '/image/mayor-plate-solid.webp';
const SOLID_SRCSET =
    '/image/mayor-plate-solid-800.webp 800w, /image/mayor-plate-solid.webp 1400w';

/* The breakpoint this component branches on. It is the width at which the
   header gives up its row of menu cells for the hamburger, so it is already
   the line between "the desktop composition" and "a phone", and the hero rules
   in site.css are written against the same number — grep `--- The phone
   banner` there. See lib/viewport.ts for why this one decision is made in
   TypeScript rather than in the stylesheet. */
const PHONE = '(max-width: 700px)';

/* The artwork is an image of text, so its alt text has to carry that text — a
   reader on a screen reader should get the office's slogan, not "banner". The
   figure is described by office rather than by name: the plate prints no name,
   and alt text is not the place to assert one. */
const PLATE_ALT =
    'Banner of the City Government of Tanjay: the City Mayor beside the ' +
    'city’s slogan — “Basta Tanjay”, PP, “Panerbisyo Pinangay” — with the ' +
    'Tanjay city seal, the Philippine Transparency Seal, Bagong Pilipinas ' +
    'and the Republika ng Pilipinas emblems along the foot.';

/**
 * Home hero.
 *
 * The banner is a two-layer composition rather than a column split. The
 * photograph runs the full width underneath; the Mayor's plate sits over it,
 * and the transparent wedge in that plate is what lets the photograph through.
 * The diagonal a reader sees is the artwork's own edge, so the composition
 * holds together at any width without a clip-path guessing at it.
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
 *
 * No name is set here either, on the artwork or in a band beneath it. One was
 * tried: a deep-green nameplate under the banner, which the city's move to an
 * orange identity left as the one green band on the page and directly below
 * the orange bar. The Mayor is named where he is also pictured and quoted, in
 * "From the Mayor's Desk".
 */
export function CityHero({ photos }: { photos: HeroPhoto[] }) {
    const city = useCity();
    const reduced = useReducedMotion();
    /* Data Saver, or 2G. Each photograph the office has published is a
       2048px file and the eight of them come to 2.9MB; rotating through all
       of them is a cost a metered connection should not be made to pay
       without asking. See the note in lib/connection.ts — the proper answer
       is resized derivatives from the API, and this is what can be done
       until there are some. */
    const thrifty = useThriftyConnection();
    /* Asked in React rather than in CSS because the answer decides what is
       mounted, not how it looks: a carousel hidden with `display: none` still
       fetches eight 2048px photographs and still runs its timer behind the
       hidden box. See lib/viewport.ts. */
    const phone = useMediaQuery(PHONE);
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

    const advancing = count > 1 && !paused && !engaged && !reduced && !thrifty;

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

    /* A phone: the banner, and nothing else.

       This is an early return rather than a stylesheet rule because of what it
       does not do. The photographs are never requested, so a resident on
       mobile data pays ~30KB for the banner instead of 2.9MB for eight
       2048px files; the rotation never starts, so there is no moving content
       to pause and WCAG 2.2.2 has nothing to ask for; and `useThriftyConnection`
       stops being the only thing standing between a metered connection and
       that payload, because on a phone the payload is gone.

       No entrance animation. On this layout the banner is the largest thing on
       the first screen and therefore the element the browser measures as the
       largest contentful paint — starting it at `opacity: 0` would delay the
       moment the page is readable in order to decorate it. The wide layout
       keeps its entrance, where the photograph underneath paints first.

       If the artwork fails to load, the section collapses to its heading and
       the page simply begins with the first band of content. There is nothing
       honest to put in its place: the banner is identity, the header directly
       above it already carries the seal, the legal name and the province, and
       a grey 2:1 box or an apology where the city's banner should be tells a
       resident less than no banner at all. */
    if (phone) {
        return (
            <section
                /* Its own block, deliberately not `hero hero--…`. The wide
                   hero declares an aspect ratio, a height ceiling and
                   `overflow: hidden`, and a modifier here would have to undo
                   all three — the ratio most of all, since the whole point of
                   this arrangement is that the artwork sets its own. */
                className={`hero-solid${plateBroken ? ' is-missing' : ''}`}
            >
                <h1 className="sr-only">{city.legal_name}</h1>
                {!plateBroken && (
                    <img
                        className="hero-solid-art"
                        src={SOLID_SRC}
                        srcSet={SOLID_SRCSET}
                        sizes="100vw"
                        width={PLATE.w}
                        height={PLATE.h}
                        alt={PLATE_ALT}
                        fetchPriority="high"
                        decoding="async"
                        onError={() => setPlateBroken(true)}
                    />
                )}
            </section>
        );
    }

    const slide = photos[active];

    /* The Mayor's plate, on its own.

       Its entrance is a stylesheet animation rather than a scripted one. This
       is the banner of a government homepage: it should not need JavaScript
       to become visible, and an animation that begins at `opacity: 0` makes
       the artwork's appearing conditional on that script arriving and running.
       CSS also picks up the global reduced-motion reset in base.css for free.

       Two widths are served. The plate is at most 880px wide on the desktop
       layout — the height cap times the artwork's ratio — and the full file is
       for that, at twice the density; the 900px variant is what a phone gets,
       where the plate runs the whole viewport. `sizes` names the 880px turn so
       a phone is never sent a 1591px banner over mobile data. */
    const plate = plateBroken ? null : (
        <div className="hero-plate">
            <img
                className="hero-plate-art"
                src="/image/mayor-plate.webp"
                srcSet="/image/mayor-plate-900.webp 900w, /image/mayor-plate.webp 1591w"
                sizes="(max-width: 880px) 100vw, 880px"
                width={PLATE.w}
                height={PLATE.h}
                alt={PLATE_ALT}
                fetchPriority="high"
                decoding="async"
                onError={() => setPlateBroken(true)}
            />
        </div>
    );

    // No slides published yet. This is the default state on a fresh install,
    // so it is designed rather than left blank: the plate still carries the
    // city's identity and the first task is still one click away.
    if (!slide) {
        return (
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
        );
    }

    /* The section opens with the site's h1. The header bar immediately above
       already carries the seal and the full legal name, and the plate sets the
       city's name again inside the artwork, so the banner does not draw the
       same lockup a third time; the heading stays in the document for
       assistive technology and for search, and the bar does the showing. */
    return (
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
                                // Used as given — see the note on the
                                // current photograph below.
                                src={outgoing.path}
                                alt=""
                            />
                        )}
                        <img
                            key={`${slide.path}-${active}`}
                            className="hero-photo hero-photo-current"
                            // Used as given. `resolveUploads` in api.ts has
                            // already turned the office's `storage/…` path
                            // into an absolute URL on the API's own origin,
                            // because the API cannot know what address this
                            // bundle was served from. Prefixing a slash
                            // here made `/https://…`, which resolves
                            // against this origin, falls through the SPA
                            // rewrite to index.html, and decodes to
                            // nothing — so every published photograph
                            // silently failed and the whole banner fell
                            // back to the plate alone.
                            src={slide.path}
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
                    rotate on its own: under reduced motion, or on a metered
                    connection, the banner already holds still, and a pause
                    button for a carousel that is not moving is a control that
                    does nothing. */}
            {count > 1 && !reduced && !thrifty && (
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
    );
}

export default CityHero;
