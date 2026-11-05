import { usePageData } from '@/lib/page-data';

export type CityHotline = {
    label: string;
    number: string;
    available: string;
};

/** One figure in the "city in figures" band. */
export type CityFigure = {
    value: string;
    label: string;
    note: string;
};

/**
 * A transparency obligation. `href` is null while the city has nothing
 * published behind it, which the section renders as a stated gap rather than
 * as a link that goes nowhere.
 */
export type TransparencyItem = {
    title: string;
    description: string;
    href: string | null;
    available: boolean;
    basis: string;
};

export type City = {
    name: string;
    legal_name: string;
    province: string;
    region: string;
    region_note?: string;
    republic: string;
    tagline: string;
    charter: string;
    office_hours: {
        weekdays: string;
        note: string;
    };
    contact: {
        address: string;
        trunkline: string;
        email: string;
        verified: boolean;
    };
    hotlines: CityHotline[];
    hotlines_verified: boolean;
    /** The national complaint line shown beside the city's own contact. */
    feedback?: {
        national?: { label: string; number: string; note: string };
    };
    figures: CityFigure[];
    figures_note: string;
    transparency: TransparencyItem[];
};

export type Shortcut = {
    icon: string;
    /** Names a cover in service-grid.tsx; absent means the icon alone. */
    cover?: string;
    title: string;
    description: string;
    href: string;
    cta: string;
};

/**
 * One entry in a menu or submenu. `href` is null for a page that is planned
 * but not built, which the header lists as "Soon" rather than as a link.
 * `note` is a short qualifier drawn under the label — the legal basis of a
 * transparency obligation, and whether it has been published yet.
 */
export type NavLeaf = {
    label: string;
    href: string | null;
    note: string | null;
};

/** An entry under a menu heading, which may open one submenu of its own. */
export type NavItem = NavLeaf & {
    items: NavLeaf[];
};

/**
 * A menu heading: a link of its own when `href` is set, a group that opens
 * when it carries `items`. Built server-side by App\Support\SiteNavigation.
 */
export type NavEntry = {
    label: string;
    href: string | null;
    items: NavItem[];
};

/**
 * The primary navigation, built by App\Support\SiteNavigation and sent with
 * the page's payload. The fallback is the one entry that is true on any page,
 * for the same reason `useCity` has one.
 */
export function useNavigation(): NavEntry[] {
    const navigation = usePageData()?.navigation;

    return navigation ?? [{ label: 'Home', href: '/', items: [] }];
}

/**
 * City identity arrives with the page's payload (see HomeController), so the
 * masthead and footer never have to be told who they belong to.
 *
 * The fallback keeps the chrome renderable in isolation — in a component test
 * that mounts the header on its own, and now also in the window before the
 * fetch answers, which is why `usePageData` is nullable rather than throwing.
 * These are the few facts about the city that do not change between
 * administrations, so standing in for the published record for a moment is
 * safe here in a way that a hotline number or an office's address would not
 * be.
 */
export function useCity(): City {
    const city = usePageData()?.city;

    return (
        city ?? {
            name: 'City of Tanjay',
            legal_name: 'City Government of Tanjay',
            province: 'Province of Negros Oriental',
            region: 'Negros Island Region',
            republic: 'Republic of the Philippines',
            tagline: 'Official website of the City Government of Tanjay',
            charter: '',
            office_hours: { weekdays: '', note: '' },
            contact: {
                address: '',
                trunkline: '',
                email: '',
                verified: false,
            },
            hotlines: [],
            hotlines_verified: false,
            figures: [],
            figures_note: '',
            transparency: [],
        }
    );
}
