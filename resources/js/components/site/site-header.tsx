import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Menu,
    Phone,
    ShieldCheck,
    X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useCity, useNavigation } from './city';
import type { NavEntry, NavItem, NavLeaf } from './city';
import { Seal } from './seal';
import { SiteSearch } from './site-search';

/**
 * One entry in a menu or submenu.
 *
 * With an `href` it is a link, under the same promotion rule as everywhere
 * else in the header: a `#` target is a section of this page and stays a plain
 * anchor, so the browser does its own scrolling and history; anything else is
 * a page and goes through Inertia.
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

    const body = (
        <>
            <span className="nav-panel-label">{item.label}</span>
            {item.note && <span className="nav-panel-note">{item.note}</span>}
        </>
    );

    return item.href.startsWith('#') ? (
        <a className="nav-panel-link" href={item.href} onClick={onNavigate}>
            {body}
        </a>
    ) : (
        <Link className="nav-panel-link" href={item.href} onClick={onNavigate}>
            {body}
        </Link>
    );
}

/**
 * The list inside an open group. It owns which submenu is open, so the state
 * goes when the panel does: reopening a group starts it closed again rather
 * than with a flyout left hanging from the last visit.
 *
 * A submenu is the same disclosure as its heading — a button with
 * `aria-expanded` — opening to the side on a wide screen and in place inside
 * the collapsed menu.
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

                const open = sub === item.label;
                const id = `${idPrefix}-sub-${index}`;

                return (
                    <li
                        key={`${item.label}-${index}`}
                        className={`nav-sub${open ? ' is-open' : ''}`}
                    >
                        <button
                            type="button"
                            className="nav-panel-link nav-sub-toggle"
                            aria-expanded={open}
                            aria-controls={id}
                            onClick={() =>
                                setSub((current) =>
                                    current === item.label ? null : item.label,
                                )
                            }
                        >
                            <span className="nav-panel-label">
                                {item.label}
                            </span>
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
 * It opens on a click or a tap, never on hover alone: a hover menu that opens
 * as the pointer crosses the bar on its way to the search field is the most
 * common complaint about government site navigation, and on a touch screen
 * there is no hover to open it with.
 */
function NavGroup({
    entry,
    id,
    open,
    onToggle,
    onDismiss,
    onNavigate,
}: {
    entry: NavEntry;
    id: string;
    open: boolean;
    onToggle: () => void;
    onDismiss: () => void;
    onNavigate: () => void;
}) {
    const reduced = useReducedMotion();

    return (
        <div
            className={`nav-group${open ? ' is-open' : ''}`}
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
                onClick={onToggle}
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
    const path = usePage().url.split(/[?#]/)[0];
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
                    <Link
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
                    </Link>

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
                                    onToggle={() =>
                                        setGroup((current) =>
                                            current === entry.label
                                                ? null
                                                : entry.label,
                                        )
                                    }
                                    onDismiss={() => setGroup(null)}
                                    onNavigate={close}
                                />
                            ) : entry.href ? (
                                <Link
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
                                </Link>
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
