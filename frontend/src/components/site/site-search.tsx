import {
    FileText,
    HandHeart,
    ListChecks,
    Megaphone,
    Phone,
    Scale,
    Search,
    X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePageData } from '@/lib/page-data';
import { useCity } from './city';
import type { Shortcut } from './city';

/**
 * Header search.
 *
 * It searches the content that is actually on the page — the service
 * shortcuts, the "How do I…" guides, the emergency hotlines, the published
 * notices, the city's programmes and the transparency obligations — and
 * nothing else. There is no search route and no
 * detail page to send a reader to, so a field that posted a query to the
 * server would return a 404, and one with an index of invented keywords would
 * promise pages the rebuild has not reached. What is indexed here is the real
 * copy of each item, and every result lands on a section that exists.
 *
 * That also means the index arrives with the page rather than from a search
 * endpoint: a few dozen short records, already in the one payload the page
 * fetches, so matching is instant and a keystroke costs a resident on mobile
 * data nothing. Give this a route of its own when there is a corpus it cannot
 * hold — a notice archive, a directory — and keep the same keyboard contract.
 */

type NoticeSummary = {
    id: number;
    category: string;
    title: string;
    description: string;
};

type GuideSummary = {
    id: number;
    title: string;
    summary: string;
    office: string;
};

type ProgramSummary = {
    id: number;
    title: string;
    summary: string;
    audience: string;
    office: string;
};

/**
 * What an entry is filed under in the panel. The panel orders the groups by
 * their best match rather than in a fixed sequence — see `groups` below.
 */
type Group =
    | 'Services'
    | 'How do I…'
    | 'Emergency hotlines'
    | 'Public information'
    | 'Programmes'
    | 'Transparency';

type Kind =
    | 'service'
    | 'guide'
    | 'hotline'
    | 'notice'
    | 'program'
    | 'transparency';

type Entry = {
    id: string;
    group: Group;
    kind: Kind;
    label: string;
    /** The second line: what the result is, and where it goes. */
    meta: string;
    href: string;
    /** Lowercased haystack — every word the entry can be found by. */
    terms: string;
};

/** Eight. Past that the panel is taller than a phone and stops being a glance. */
const MAX_RESULTS = 8;

const ICONS: Record<Kind, typeof Search> = {
    service: FileText,
    guide: ListChecks,
    hotline: Phone,
    notice: Megaphone,
    program: HandHeart,
    transparency: Scale,
};

/**
 * The index, built from what this page was sent.
 *
 * Read defensively, for the same reason `useCity` has a fallback: the header
 * has to stay renderable before the payload arrives and on a page that does
 * not carry these, and in both cases the search simply has less to find. The
 * casts are gone with Inertia's untyped prop bag — `usePageData` is the typed
 * contract in api.ts, so these four are now checked against what the backend
 * actually sends. The local summary types stay because they are the narrow
 * view this file needs, and the payload's fuller types satisfy them.
 */
function useSearchIndex(): Entry[] {
    const city = useCity();
    const data = usePageData();
    const shortcuts: Shortcut[] = data?.shortcuts ?? [];
    const notices: NoticeSummary[] = data?.notices ?? [];
    const guides: GuideSummary[] = data?.guides ?? [];
    const programs: ProgramSummary[] = data?.programs ?? [];

    return useMemo(() => {
        const entries: Entry[] = [];

        shortcuts.forEach((shortcut, at) => {
            entries.push({
                id: `service-${at}`,
                group: 'Services',
                kind: 'service',
                label: shortcut.title,
                meta: shortcut.description,
                href: shortcut.href,
                terms: `${shortcut.title} ${shortcut.description}`,
            });
        });

        // A guide answers the question most searches are — "how do I get a
        // cedula" — so it is indexed by what it covers as well as its title.
        guides.forEach((guide) => {
            entries.push({
                id: `guide-${guide.id}`,
                group: 'How do I…',
                kind: 'guide',
                label: guide.title,
                meta: `${guide.office} · opens the guides`,
                href: '#guides',
                terms: `${guide.title} ${guide.summary} ${guide.office}`,
            });
        });

        // Positional ids, not ids built from titles: these are written into
        // `id` and read back by `aria-activedescendant`, and an office name
        // with a space in it is not a valid identifier in either.
        city.hotlines.forEach((hotline, at) => {
            entries.push({
                id: `hotline-${at}`,
                group: 'Emergency hotlines',
                kind: 'hotline',
                label: hotline.label,
                meta: `${hotline.number} · available ${hotline.available}`,
                // The number dials straight from the result. In an emergency the
                // worst thing search can do is make someone scroll to a section
                // to find the thing they searched for by name.
                href: `tel:${hotline.number.replace(/[^\d+]/g, '')}`,
                terms: `${hotline.label} ${hotline.number} emergency`,
            });
        });

        notices.forEach((notice) => {
            entries.push({
                id: `notice-${notice.id}`,
                group: 'Public information',
                kind: 'notice',
                label: notice.title,
                // Named as the section, not as the notice, because that is
                // where the link goes. There is no detail page, and a result
                // that reads like one would be a promise it cannot keep.
                meta: `${notice.category} · opens the notices section`,
                href: '#information',
                terms: `${notice.title} ${notice.category} ${notice.description}`,
            });
        });

        programs.forEach((program) => {
            entries.push({
                id: `program-${program.id}`,
                group: 'Programmes',
                kind: 'program',
                label: program.title,
                meta: `For ${program.audience.toLowerCase()} · ${program.office}`,
                href: '#programs',
                terms: `${program.title} ${program.summary} ${program.audience} ${program.office}`,
            });
        });

        city.transparency.forEach((item, at) => {
            entries.push({
                id: `transparency-${at}`,
                group: 'Transparency',
                kind: 'transparency',
                label: item.title,
                // An obligation with nothing published behind it is still worth
                // finding: a resident searching for it learns that the city owes
                // it and has not posted it, which is the honest answer and the
                // one the section itself gives.
                meta: item.available
                    ? item.basis
                    : `${item.basis} · not yet published`,
                href: item.href && item.available ? item.href : '#transparency',
                terms: `${item.title} ${item.description} ${item.basis}`,
            });
        });

        return entries.map((entry) => ({
            ...entry,
            terms: entry.terms.toLowerCase(),
        }));
    }, [city, shortcuts, guides, notices, programs]);
}

/**
 * Rank the index against a query. Every word in the query has to appear
 * somewhere in an entry, so a second word narrows rather than widens.
 */
function rank(entries: Entry[], query: string): Entry[] {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    const hits: { entry: Entry; score: number; at: number }[] = [];

    entries.forEach((entry, at) => {
        const label = entry.label.toLowerCase();
        let score = 0;

        for (const word of words) {
            const found = entry.terms.indexOf(word);
            if (found < 0) return;

            // A word in the title the reader can see is worth more than one
            // buried in the description, and the start of a word is worth more
            // than the middle of one: "cert" should find "Certificates"
            // before it finds "uncertified".
            score += label.includes(word) ? 4 : 1;
            if (found === 0 || !/[a-z0-9]/.test(entry.terms[found - 1])) {
                score += 2;
            }
        }

        hits.push({ entry, score, at });
    });

    return hits
        .sort((a, b) => b.score - a.score || a.at - b.at)
        .slice(0, MAX_RESULTS)
        .map((hit) => hit.entry);
}

type Props = {
    /**
     * Whether the field is showing on a narrow viewport, where it opens as a
     * panel under the bar rather than sitting in it. Held by the header so that
     * the search and the menu cannot both be open over the same content.
     */
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
};

export function SiteSearch({ expanded, onExpandedChange }: Props) {
    const index = useSearchIndex();
    const reduced = useReducedMotion();

    const [query, setQuery] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [active, setActive] = useState(0);

    const root = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);

    const trimmed = query.trim();
    const results = useMemo(() => rank(index, trimmed), [index, trimmed]);

    // Grouped for the eye, flat for the keyboard: the two orders are the same
    // list, so the highlight moves down the panel exactly as it is drawn.
    //
    // Groups appear in the order of their best match, not in a fixed one. With
    // a fixed order, "health" listed the Emergency hotlines *service* (the word
    // is in its description) above the City Health Unit (the word is its
    // name), and Enter — which takes the first row — went to the weaker
    // result. Ordering by first appearance in the ranked list keeps the rows
    // grouped and still puts the best match first.
    const groups = useMemo(() => {
        const order: Group[] = [];
        for (const entry of results) {
            if (!order.includes(entry.group)) order.push(entry.group);
        }

        return order.map((name) => ({
            name,
            items: results.filter((entry) => entry.group === name),
        }));
    }, [results]);
    const flat = useMemo(
        () => groups.flatMap((group) => group.items),
        [groups],
    );

    const open = panelOpen && trimmed.length > 0;
    const current = flat[active];

    const dismiss = () => {
        setPanelOpen(false);
        setQuery('');
        setActive(0);
        onExpandedChange(false);
    };

    /** Follow a result. Used by Enter; a click follows the anchor itself. */
    const go = (entry: Entry) => {
        dismiss();

        if (!entry.href.startsWith('#')) {
            window.location.href = entry.href;
            return;
        }

        // Assigning the hash is what makes the browser do its own anchor work —
        // `scroll-padding-top` for the sticky bar, and a back button that
        // returns to where the reader was. It is a no-op when the hash is
        // already set, so that case scrolls directly.
        if (window.location.hash === entry.href) {
            document
                .getElementById(entry.href.slice(1))
                ?.scrollIntoView({ block: 'start' });
        } else {
            window.location.hash = entry.href;
        }
    };

    // "/" and ⌘K reach the field from anywhere on the page. "/" is only safe
    // because it is given up the moment the reader is typing in something else.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const slash = event.key === '/' && !event.metaKey && !event.ctrlKey;
            const command =
                event.key.toLowerCase() === 'k' &&
                (event.metaKey || event.ctrlKey);
            if (!slash && !command) return;

            const target = event.target as HTMLElement | null;
            if (target?.isContentEditable) return;
            if (target && /^(input|textarea|select)$/i.test(target.tagName)) {
                return;
            }

            event.preventDefault();
            onExpandedChange(true);
            // After the class lands: on a narrow viewport the field is in a
            // panel that is not displayed until then, and a hidden input
            // cannot take focus.
            requestAnimationFrame(() => input.current?.focus());
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onExpandedChange]);

    useEffect(() => {
        if (expanded) requestAnimationFrame(() => input.current?.focus());
    }, [expanded]);

    // A pointer landing anywhere else closes the panel but keeps the query, so
    // clicking back into the field resumes rather than restarts.
    useEffect(() => {
        if (!open) return;

        const onDown = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) {
                setPanelOpen(false);
            }
        };

        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [open]);

    // Eight results can outrun the panel's height, and a highlight that has
    // moved somewhere the reader cannot see is worse than no highlight.
    // `nearest` so a row already in view is left where it is.
    useEffect(() => {
        if (!open || !current) return;
        document
            .getElementById(current.id)
            ?.scrollIntoView({ block: 'nearest' });
    }, [open, current]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            // One step at a time: clear the query, then leave the field. A
            // single Escape that did both would throw away a long query on the
            // way to closing a panel.
            if (trimmed) {
                setQuery('');
                setPanelOpen(false);
            } else {
                onExpandedChange(false);
                input.current?.blur();
            }
            return;
        }

        if (!open || !flat.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((at) => (at + 1) % flat.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((at) => (at - 1 + flat.length) % flat.length);
        }
    };

    const listId = 'site-search-results';

    return (
        <div
            className={`site-search${expanded ? ' is-expanded' : ''}`}
            ref={root}
        >
            {/* Narrow viewports only. The bar there holds the seal, the city's
                name and the menu, and has no room left for a field — so the
                field becomes a panel and this is what opens it. */}
            <button
                type="button"
                className="search-toggle"
                aria-label={expanded ? 'Close search' : 'Search this site'}
                aria-expanded={expanded}
                onClick={() => (expanded ? dismiss() : onExpandedChange(true))}
            >
                {expanded ? (
                    <X size={20} aria-hidden="true" />
                ) : (
                    <Search size={20} aria-hidden="true" />
                )}
            </button>

            {/* Field and results in one wrapper. On the bar it is
                `display: contents` and the field sits in the row with the
                results hanging below it; in the collapsed layout the wrapper
                becomes the panel itself, so the field and its results arrive as
                one sheet under the bar rather than as two stacked overlays
                whose offsets have to be kept in step by hand. */}
            <div className="search-sheet">
                <form
                    className="search-form"
                    role="search"
                    onSubmit={(event) => {
                        event.preventDefault();
                        // Enter takes the highlighted result, which with nothing
                        // moved yet is the best match. There is nowhere else for a
                        // submit to go.
                        if (current) go(current);
                    }}
                >
                    <span className="search-field">
                        <Search
                            className="search-field-icon"
                            size={17}
                            aria-hidden="true"
                        />
                        <input
                            ref={input}
                            type="search"
                            className="search-input"
                            placeholder="Search services, notices, hotlines"
                            aria-label="Search this site"
                            autoComplete="off"
                            role="combobox"
                            aria-expanded={open}
                            aria-controls={listId}
                            aria-autocomplete="list"
                            aria-activedescendant={
                                open && current ? current.id : undefined
                            }
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPanelOpen(true);
                                setActive(0);
                            }}
                            onFocus={() => setPanelOpen(true)}
                            onKeyDown={onKeyDown}
                        />
                        {trimmed ? (
                            <button
                                type="button"
                                className="search-clear"
                                aria-label="Clear search"
                                onClick={() => {
                                    setQuery('');
                                    setActive(0);
                                    input.current?.focus();
                                }}
                            >
                                <X size={15} aria-hidden="true" />
                            </button>
                        ) : (
                            <kbd className="search-hint" aria-hidden="true">
                                /
                            </kbd>
                        )}
                    </span>
                </form>

                {/* Counted out loud, because the panel appearing is a visual event
                and the number of results is the part a screen reader needs. */}
                <p className="sr-only" role="status" aria-live="polite">
                    {open
                        ? `${flat.length} ${flat.length === 1 ? 'result' : 'results'} for ${trimmed}`
                        : ''}
                </p>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            className="search-panel"
                            initial={
                                reduced ? { opacity: 0 } : { opacity: 0, y: -6 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                                reduced ? { opacity: 0 } : { opacity: 0, y: -4 }
                            }
                            transition={{
                                duration: 0.16,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            {/* The listbox is only ever wrapped around actual
                                options: a paragraph is not a valid child of
                                one, so the empty state sits outside it rather
                                than being announced as a result. */}
                            {flat.length ? (
                                <div
                                    id={listId}
                                    role="listbox"
                                    aria-label="Search results"
                                >
                                    {groups.map((group) => (
                                        <div
                                            className="search-group"
                                            key={group.name}
                                            role="group"
                                            aria-label={group.name}
                                        >
                                            {/* The group is already named for
                                            assistive technology by its
                                            `aria-label`; this is the same name
                                            drawn for the eye. */}
                                            <p
                                                className="search-group-name"
                                                aria-hidden="true"
                                            >
                                                {group.name}
                                            </p>
                                            {group.items.map((entry) => {
                                                const Icon = ICONS[entry.kind];
                                                const at = flat.indexOf(entry);
                                                const body = (
                                                    <>
                                                        <Icon
                                                            size={16}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="search-result-copy">
                                                            <strong>
                                                                {entry.label}
                                                            </strong>
                                                            <small>
                                                                {entry.meta}
                                                            </small>
                                                        </span>
                                                    </>
                                                );
                                                const className = `search-result${
                                                    at === active
                                                        ? ' is-active'
                                                        : ''
                                                }`;

                                                // Real links, so a result can be
                                                // middle-clicked or copied like
                                                // anything else on the page.
                                                //
                                                // One element for every kind of
                                                // target. This used to branch — an
                                                // anchor or `tel:` as a plain <a>,
                                                // everything else as Inertia's <Link>
                                                // — because <Link> intercepted the
                                                // click and tried to fetch the target
                                                // as a page, which is not a thing you
                                                // can do to a telephone number. With
                                                // no router left there is nothing to
                                                // keep away from anything, and the
                                                // browser handles all three.
                                                return (
                                                    <a
                                                        key={entry.id}
                                                        id={entry.id}
                                                        className={className}
                                                        href={entry.href}
                                                        role="option"
                                                        aria-selected={
                                                            at === active
                                                        }
                                                        onMouseEnter={() =>
                                                            setActive(at)
                                                        }
                                                        onClick={dismiss}
                                                    >
                                                        {body}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Says why, not just that. The index is small
                                // because the site is one page, and a reader who
                                // knows that will not keep rephrasing.
                                <p className="search-empty">
                                    Nothing on this page matches
                                    <strong>“{trimmed}”</strong>
                                    <span>
                                        The site is being rebuilt section by
                                        section. Search covers the services,
                                        notices, hotlines and records published
                                        here so far.
                                    </span>
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SiteSearch;
