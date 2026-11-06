import {
    ChevronDown,
    ChevronRight,
    Menu,
    Phone,
    ShieldCheck,
    X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type {
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocationPath } from '@/lib/location';
import { useCity, useNavigation } from './city';
import type { NavEntry, NavItem, NavLeaf } from './city';
import { Seal } from './seal';
import { SiteSearch } from './site-search';

/**
 * Hover intent, in milliseconds.
 *
 * `OPEN` is the answer to the one real objection to a hover menu: a pointer
 * crossing the bar on its way to the search field must not open anything. A
 * casual mouse travels 500–1500px a second, so a 110px cell is crossed in
 * 70–220ms — 120 catches most of that crossing while still feeling immediate
 * to someone who has arrived and stopped.
 *
 * `SWITCH` is 0 on purpose. Once a panel is open the reader has already said
 * they are reading the menu, so moving along the row should change panels at
 * the speed of the pointer; a delay there reads as lag, not as care.
 *
 * `CLOSE` is the grace on the way out. It covers the 9px of panel the pointer
 * crosses between a submenu's entry and its flyout, and a diagonal move that
 * clips the edge of the sheet.
 */
const HOVER_OPEN = 120;
const HOVER_SWITCH = 0;
const HOVER_CLOSE = 180;

/**
 * Whether the menu is drawn as the wide bar rather than the collapsed panel.
 *
 * The breakpoint is deliberately not repeated here. `site.css` publishes the
 * answer as `--nav-mode` on `.primary-nav`, which inherits to every cell, so
 * this reads the layout the stylesheet actually chose. A number copied into
 * TypeScript would go stale the day someone moves the media query, and the
 * symptom would be dropdowns opening on hover inside the hamburger panel on a
 * tablet — the exact behaviour this guard exists to prevent.
 *
 * One synchronous style read per pointer entry, not per move.
 */
function inBarMode(node: Element) {
    return (
        getComputedStyle(node).getPropertyValue('--nav-mode').trim() === 'bar'
    );
}

/**
 * A click on a disclosure that also opens on hover.
 *
 * The focus call is the point of this: macOS Safari does not focus a `<button>`
 * when it is clicked, which is a platform convention and not a bug, but
 * `useHoverOpen` reads focus to tell a pinned panel from a hovered one. Left
 * to the browser, "a click pins it" would be true in Chrome and false in
 * Safari — the kind of difference nobody finds until a resident reports that
 * the menu will not stay open. Focusing it explicitly costs nothing visible,
 * because `:focus-visible` does not match a pointer click, and it also means
 * the reader's next Tab continues from the heading they just used.
 */
function pinOnClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.currentTarget.focus();
}

/**
 * Pointer handlers for a disclosure that opens on hover as well as on a click.
 *
 * The rule is: **hover opens and closes, a click pins.** A panel the pointer
 * opened closes when the pointer leaves it, which is what a mouse user
 * expects. A panel whose trigger was clicked — or reached with a keyboard —
 * holds focus inside the group, and this will not close it: otherwise a
 * pointer drifting across the bar would shut a menu out from under a reader
 * who is tabbing through it, and the only sign would be that their next Tab
 * landed somewhere else entirely. See `pinOnClick` for why the click side of
 * that cannot be left to the browser.
 *
 * Both callbacks must be written as conditional state updates by the caller
 * (`current === mine ? … : current`), because the leave timer of the cell
 * being left outlives the instant open of the cell being entered.
 */
function useHoverOpen({
    open,
    immediate,
    onOpen,
    onClose,
}: {
    open: boolean;
    immediate: boolean;
    onOpen: () => void;
    onClose: () => void;
}) {
    const timer = useRef<number | null>(null);

    const stop = () => {
        if (timer.current !== null) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
    };

    useEffect(() => stop, []);

    return {
        onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
            // A tap fires this too, and on a touch screen the tap is already
            // the click that opens the panel: without the guard it would open
            // and close in the same gesture.
            if (event.pointerType !== 'mouse') return;
            if (!inBarMode(event.currentTarget)) return;

            stop();
            if (open) return;
            timer.current = window.setTimeout(
                onOpen,
                immediate ? HOVER_SWITCH : HOVER_OPEN,
            );
        },
        onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
            if (event.pointerType !== 'mouse') return;
            // Guarded on the way out as well as in, or a mouse user on a
            // narrow desktop window would see an accordion row they had just
            // tapped open close again the moment the pointer wandered off it.
            if (!inBarMode(event.currentTarget)) return;

            stop();
            if (!open) return;
            // Pinned by a click or by the keyboard — see above.
            if (event.currentTarget.contains(document.activeElement)) return;
            timer.current = window.setTimeout(onClose, HOVER_CLOSE);
        },
    };
}

/**
 * One entry in a menu or submenu.
 *
 * With an `href` it is a plain anchor, whether that is a section of this page
 * or a page of its own. It used to branch on `#` to keep Inertia's <Link> away
 * from in-page targets it would have tried to fetch; with no router left the
 * browser does its own scrolling, history and navigation for both.
 *
 * Without one it is a page the city has planned and not built, and it is
 * drawn as text with a "Soon" tag — not as a link, not disabled-looking
 * enough to be mistaken for broken, and not focusable, because there is
 * nothing for a keyboard reader to do there. Giving the entry its `href` in
 * config is all it takes to turn it into a link.
 */
function NavPanelLink({
    item,
    onNavigate,
}: {
    item: NavLeaf;
    onNavigate: () => void;
}) {
    if (item.href === null) {
        return (
            <span className="nav-panel-link is-pending">
                <span className="nav-panel-label">{item.label}</span>
                <span className="nav-panel-soon">Soon</span>
            </span>
        );
    }

    return (
        <a className="nav-panel-link" href={item.href} onClick={onNavigate}>
            <span className="nav-panel-label">{item.label}</span>
            {item.note && <span className="nav-panel-note">{item.note}</span>}
        </a>
    );
}

/**
 * One entry that opens a flyout of its own.
 *
 * Its own component rather than a branch inside the list, because the hover
 * handlers are a hook and a hook cannot live inside a `map` callback. The
 * handlers go on the `<li>`, which contains both the entry and its flyout, so
 * the pointer moving from one into the other never leaves the element it is
 * being tracked on — and the 9px of panel between them is covered by the
 * closing grace rather than by a transparent bridge element, which is the
 * other way this is usually done and leaves a dead strip over the page.
 */
function NavSub({
    item,
    id,
    open,
    anyOpen,
    onOpen,
    onClose,
    onToggle,
    onNavigate,
}: {
    item: NavItem;
    id: string;
    open: boolean;
    anyOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
    onNavigate: () => void;
}) {
    const hover = useHoverOpen({ open, immediate: anyOpen, onOpen, onClose });

    return (
        <li className={`nav-sub${open ? ' is-open' : ''}`} {...hover}>
            <button
                type="button"
                className="nav-panel-link nav-sub-toggle"
                aria-expanded={open}
                aria-controls={id}
                onClick={(event) => {
                    pinOnClick(event);
                    onToggle();
                }}
            >
                <span className="nav-panel-label">{item.label}</span>
                <ChevronRight
                    className="nav-sub-caret"
                    size={15}
                    aria-hidden="true"
                />
            </button>
            {open && (
                <ul className="nav-sub-list" id={id}>
                    {item.items.map((child, childIndex) => (
                        <li key={`${child.label}-${childIndex}`}>
                            <NavPanelLink
                                item={child}
                                onNavigate={onNavigate}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

/**
 * The list inside an open group. It owns which submenu is open, so the state
 * goes when the panel does: reopening a group starts it closed again rather
 * than with a flyout left hanging from the last visit.
 *
 * A submenu is the same disclosure as its heading — a button with
 * `aria-expanded` — opening to the side on a wide screen and in place inside
 * the collapsed menu. It takes hover with it: a reader who has just learned
 * that the row above opens on hover will try the same thing one level in, and
 * a submenu that then needed a click would read as a dead entry.
 */
function NavPanel({
    items,
    idPrefix,
    onNavigate,
}: {
    items: NavItem[];
    idPrefix: string;
    onNavigate: () => void;
}) {
    const [sub, setSub] = useState<string | null>(null);

    return (
        <ul className="nav-panel-list">
            {items.map((item, index) => {
                if (!item.items.length) {
                    return (
                        <li key={`${item.label}-${index}`}>
                            <NavPanelLink item={item} onNavigate={onNavigate} />
                        </li>
                    );
                }

                return (
                    <NavSub
                        key={`${item.label}-${index}`}
                        item={item}
                        id={`${idPrefix}-sub-${index}`}
                        open={sub === item.label}
                        anyOpen={sub !== null}
                        onOpen={() => setSub(item.label)}
                        // Conditional, so the grace timer of the entry being
                        // left cannot close the flyout that was opened in the
                        // meantime by the entry being moved to.
                        onClose={() =>
                            setSub((current) =>
                                current === item.label ? null : current,
                            )
                        }
                        onToggle={() =>
                            setSub((current) =>
                                current === item.label ? null : item.label,
                            )
                        }
                        onNavigate={onNavigate}
                    />
                );
            })}
        </ul>
    );
}

/**
 * A menu heading that opens a group.
 *
 * The disclosure pattern — a real button with `aria-expanded` controlling a
 * list of ordinary links — rather than an ARIA menu. A site menu is
 * navigation, and the menu role would take away the Tab key a reader expects
 * and replace it with arrow-key behaviour they have to discover.
 *
 * **It opens on hover as well as on a click**, and the click is still the
 * thing that has to work: hover alone would leave out every reader on a touch
 * screen, every reader on a keyboard, and anyone whose pointing is not steady
 * enough to hold a cell. So hover is an addition with three guards, each
 * answering a specific way hover menus go wrong:
 *
 * - the 120ms in `HOVER_OPEN`, so a pointer crossing the bar on its way to the
 *   search field opens nothing — the common complaint, and the reason this
 *   component used to refuse hover outright;
 * - `pointerType === 'mouse'`, so a tap is a click and nothing else;
 * - `inBarMode`, so nothing opens on hover inside the collapsed hamburger
 *   panel, where the entries are stacked accordion rows a pointer must travel
 *   through to reach the ones below.
 *
 * What a hovering pointer gets is exactly what a click gets — the same panel,
 * the same animation, the same `aria-expanded` on the same button. There is no
 * second code path and so no second set of behaviour to keep in step.
 */
function NavGroup({
    entry,
    id,
    open,
    anyOpen,
    onToggle,
    onOpen,
    onDismiss,
    onNavigate,
}: {
    entry: NavEntry;
    id: string;
    open: boolean;
    anyOpen: boolean;
    onToggle: () => void;
    onOpen: () => void;
    onDismiss: () => void;
    onNavigate: () => void;
}) {
    const reduced = useReducedMotion();
    const hover = useHoverOpen({
        open,
        immediate: anyOpen,
        onOpen,
        onClose: onDismiss,
    });

    return (
        <div
            className={`nav-group${open ? ' is-open' : ''}`}
            {...hover}
            // Focus leaving the group closes it, so a keyboard reader tabbing
            // on through the bar does not leave a sheet hanging open over the
            // page behind them.
            onBlur={(event) => {
                if (
                    open &&
                    !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                    )
                ) {
                    onDismiss();
                }
            }}
        >
            <button
                type="button"
                className="nav-item"
                aria-expanded={open}
                aria-controls={id}
                onClick={(event) => {
                    pinOnClick(event);
                    onToggle();
                }}
            >
                {entry.label}
                <ChevronDown
                    className="nav-caret"
                    size={15}
                    aria-hidden="true"
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={id}
                        className="nav-panel"
                        initial={
                            reduced ? { opacity: 0 } : { opacity: 0, y: -6 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{
                            duration: 0.16,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <NavPanel
                            items={entry.items}
                            idPrefix={id}
                            onNavigate={onNavigate}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Philippine Standard Time, the convention on official national and local
 * government sites. Pinned to Asia/Manila so it reads the same whatever the
 * visitor's device is set to, and rendered only after mount so the server and
 * the client never disagree about the second.
 *
 * The three parts are separate elements because the clock gives them up one at
 * a time as the strip narrows — first the date, then the label — rather than
 * disappearing wholesale on a phone, which is where a resident is most likely
 * to be checking whether an office is open.
 */
function PhilippineStandardTime() {
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
        const tick = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(tick);
    }, []);

    if (!now) return null;

    const date = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'long',
    }).format(now);
    const time = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).format(now);

    return (
        <p className="pst-clock">
            <span className="pst-label">Philippine Standard Time</span>
            <time dateTime={now.toISOString()}>
                <span className="pst-date">{date}</span>
                <span className="pst-time">{time}</span>
            </time>
        </p>
    );
}

/**
 * True once the identity strip has scrolled up behind the bar. The bar then
 * lifts off the page — the one signal that the chrome is now floating over the
 * content rather than sitting at the top of it.
 */
function usePinned(barHeight: number) {
    const sentinel = useRef<HTMLDivElement>(null);
    const [pinned, setPinned] = useState(false);

    useEffect(() => {
        const node = sentinel.current;
        if (!node || typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            ([entry]) => setPinned(!entry.isIntersecting),
            { rootMargin: `-${barHeight}px 0px 0px 0px`, threshold: 0 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [barHeight]);

    return { sentinel, pinned };
}

/**
 * Site header: a national identity strip, then one bar carrying the city's
 * seal, its legal name, the navigation, and the search field.
 *
 * The seal and the menu share a row on purpose. They were stacked before —
 * menu above, branding below — which cost a third of the first screen in
 * chrome, set the city's name twice, and left the sticky bar showing GOVPH
 * with no sign of Tanjay once a reader had scrolled. The national wordmark now
 * sits in the strip, which is the register it belongs to, and the bar that
 * follows a resident down the page is the city's own.
 */
export function SiteHeader() {
    const city = useCity();
    const navigation = useNavigation();
    const path = useLocationPath();
    const { sentinel, pinned } = usePinned(71);
    const nav = useRef<HTMLElement>(null);

    /**
     * Which overlay the bar is showing on a narrow viewport. One value rather
     * than two booleans, because the menu and the search both hang off the
     * bottom edge of the bar over the same content: as separate flags they
     * could open on top of each other, and there is no arrangement of two
     * stacked panels that is better than opening the one that was asked for.
     */
    const [panel, setPanelState] = useState<'none' | 'menu' | 'search'>('none');
    const navOpen = panel === 'menu';

    /**
     * The menu group that is open, by its label. One at a time, for the same
     * reason as above: two dropdowns open at once is two sheets over the same
     * strip of page.
     */
    const [group, setGroup] = useState<string | null>(null);

    // Any change of overlay closes the open group with it, so opening the
    // search never leaves a dropdown hanging behind its sheet.
    const setPanel = (
        next: typeof panel | ((p: typeof panel) => typeof panel),
    ) => {
        setGroup(null);
        setPanelState(next);
    };

    const close = () => setPanel('none');

    useEffect(() => {
        if (!group) return;

        // Escape closes the group and hands focus back to its heading — the
        // reader is put back where they opened it, not dropped at the top of
        // the document.
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            nav.current
                ?.querySelector<HTMLButtonElement>(
                    '.nav-group.is-open > .nav-item',
                )
                ?.focus();
            setGroup(null);
        };

        // A pointer landing anywhere outside the menu closes it — including on
        // the search field, which is the next thing along the bar.
        const onDown = (event: PointerEvent) => {
            if (!nav.current?.contains(event.target as Node)) setGroup(null);
        };

        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onDown);
        };
    }, [group]);

    return (
        <>
            <a className="skip-link" href="#main">
                Skip to main content
            </a>

            {/* National identity strip — the convention that marks a page as
                an official government site, and the register the link to the
                national portal belongs to. */}
            <div className="site-identity">
                <div className="wrap site-identity-inner">
                    <p className="site-identity-official">
                        <ShieldCheck size={13} aria-hidden="true" />
                        {/* The Republic now names itself in the seal lockup
                            below, so the strip keeps the assurance the shield
                            badges without saying the same words twice 30px
                            apart. */}
                        <span>Official government website</span>
                        <a
                            className="govph-mark"
                            href="https://www.gov.ph"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GOVPH
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    </p>
                    <div className="site-identity-links">
                        <PhilippineStandardTime />
                        <a className="identity-link" href="#hotlines">
                            <Phone size={13} aria-hidden="true" />
                            Emergency hotlines
                        </a>
                    </div>
                </div>
            </div>

            {/* The bar: seal, legal name, and the menu on one row. It is the
                only part of the chrome that sticks, so a resident who has
                scrolled into a notice still has the city's identity in view
                and can change section from where they are. */}
            <header className={`site-navbar${pinned ? ' is-pinned' : ''}`}>
                <div className="wrap site-navbar-inner">
                    <a
                        href="/"
                        className="site-brand"
                        onClick={close}
                        aria-label={`${city.legal_name} — home`}
                    >
                        <Seal />
                        {/* The official lockup order: the Republic above the
                            city, divided by a rule, the province beneath. The
                            rule is what makes the three lines read as one
                            lockup belonging to the seal rather than three
                            stacked labels. */}
                        <span className="site-brand-copy">
                            <span className="site-brand-republic">
                                {city.republic}
                            </span>
                            <strong className="site-brand-name">
                                {city.legal_name}
                            </strong>
                            {/* The short form, for the narrowest bar, where
                                the legal name and two 44px controls do not fit
                                on one row. One of the two is always
                                `display: none`, so only one reaches the
                                accessibility tree. */}
                            <strong className="site-brand-name--short">
                                {city.name}
                            </strong>
                            <span className="site-brand-province">
                                {city.province}
                            </span>
                        </span>
                    </a>

                    {/* The headings follow the national government website
                        convention — Home, The City, Invest, Government,
                        Transparency, Services — and what each one opens comes
                        from config/portal.php, so the menu can only offer what
                        the site actually serves. */}
                    <nav
                        ref={nav}
                        id="primary-nav"
                        className={`primary-nav${navOpen ? ' is-open' : ''}`}
                        aria-label="Primary"
                    >
                        {navigation.map((entry, index) =>
                            entry.items.length ? (
                                <NavGroup
                                    key={entry.label}
                                    entry={entry}
                                    id={`nav-group-${index}`}
                                    open={group === entry.label}
                                    // A menu is already open, so moving along
                                    // the row switches panels at the speed of
                                    // the pointer rather than waiting out the
                                    // hover delay again at every cell.
                                    anyOpen={group !== null}
                                    onToggle={() =>
                                        setGroup((current) =>
                                            current === entry.label
                                                ? null
                                                : entry.label,
                                        )
                                    }
                                    onOpen={() => setGroup(entry.label)}
                                    // Conditional rather than `setGroup(null)`:
                                    // the leave grace of the cell being left
                                    // outlives the instant open of the cell
                                    // being entered, and would otherwise close
                                    // the panel that had just taken its place.
                                    onDismiss={() =>
                                        setGroup((current) =>
                                            current === entry.label
                                                ? null
                                                : current,
                                        )
                                    }
                                    onNavigate={close}
                                />
                            ) : entry.href ? (
                                <a
                                    key={entry.label}
                                    href={entry.href}
                                    className={`nav-item${
                                        entry.href === path ? ' is-active' : ''
                                    }`}
                                    aria-current={
                                        entry.href === path ? 'page' : undefined
                                    }
                                    onClick={close}
                                >
                                    {entry.label}
                                </a>
                            ) : null,
                        )}
                    </nav>

                    {/* After the menu in the document as well as on the row, so
                        the order a reader tabs through the bar is the order they
                        read it at every width. */}
                    <SiteSearch
                        expanded={panel === 'search'}
                        onExpandedChange={(open) =>
                            setPanel(open ? 'search' : 'none')
                        }
                    />

                    <button
                        type="button"
                        className="menu-toggle"
                        aria-label={navOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={navOpen}
                        aria-controls="primary-nav"
                        onClick={() =>
                            setPanel((open) =>
                                open === 'menu' ? 'none' : 'menu',
                            )
                        }
                    >
                        {navOpen ? (
                            <X size={20} aria-hidden="true" />
                        ) : (
                            <Menu size={20} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </header>
            <div ref={sentinel} aria-hidden="true" />
        </>
    );
}

export default SiteHeader;
