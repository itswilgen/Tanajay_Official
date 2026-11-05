import type { City, NavEntry, Shortcut } from '@/components/site/city';
import type { CitizenGuide } from '@/components/site/citizen-guides';
import type { HeroPhoto } from '@/components/site/city-hero';
import type { CityProgram } from '@/components/site/city-programs';
import type { CityUpdate } from '@/components/site/city-updates';
import type { MayorsDeskData } from '@/components/site/mayors-desk';
import type { PublicServant } from '@/components/site/public-servants';
import type { Recognition } from '@/components/site/recognitions-strip';
import type { CityEvent } from '@/components/site/upcoming-events';

/**
 * A published notice, as the landing page needs it. There is no detail page
 * yet, so the listing states each notice rather than linking to one — a title
 * that looks like a link and goes nowhere is worse than a title that does not.
 */
export type Notice = {
    id: number;
    category: string;
    title: string;
    description: string;
    poster: string | null;
    published_at?: string | null;
};

/**
 * Everything the site is sent, in one document.
 *
 * This is the contract with App\Http\Controllers\HomeController, and the
 * backend asserts the exact key set in HomePageTest — so a field added there
 * and not here is a type error here rather than a section that silently
 * renders nothing. Keep the two in step.
 *
 * `name`, `city` and `navigation` were Inertia shared props before the split
 * and are ordinary keys now; nothing that reads them had to change, because
 * they were always reached through `useCity` and `useNavigation`.
 */
export type HomePayload = {
    name: string;
    city: City;
    navigation: NavEntry[];
    heroPhotos: HeroPhoto[];
    cityUpdates: CityUpdate[];
    shortcuts: Shortcut[];
    guides: CitizenGuide[];
    mayorsDesk: MayorsDeskData;
    notices: Notice[];
    events: CityEvent[];
    programs: CityProgram[];
    publicServants: PublicServant[];
    recognitions: Recognition[];
};

/**
 * A demonstration build: no API at all.
 *
 * With VITE_DEMO=1 the site reads one committed snapshot of `/api/home`
 * instead of calling a server. The front end deploys on its own — a static
 * host is one command, a Laravel app with Postgres and a storage disk is
 * not — and in between the two a portal that can only draw its own error
 * screen is not worth putting in front of anyone.
 *
 * It is a declared flag and not a fallback after a failed request. The
 * fallback is the more convenient design and the wrong one: the first time
 * the real API went down, the site would quietly serve a months-old snapshot
 * as though it were current, and no reader would be told. A build either
 * talks to the City Government's API or it is a demonstration of the pages,
 * and it has to say which of the two it is.
 *
 * What the snapshot holds is the sample set DemoContentSeeder writes, every
 * record of which says in its own copy that it is a sample — so this cannot
 * put invented notices in front of a reader as the city's own.
 */
const DEMO = import.meta.env.VITE_DEMO === '1';

/** Where that snapshot sits, served by the static host out of `public/`. */
const DEMO_SOURCE = '/demo/home.json';

/**
 * Where the City Government's API answers.
 *
 * One variable, set at build time, because a static bundle has no server to
 * ask. On Vercel it is a project environment variable; locally it is in
 * .env.local. The fallback is the address `php artisan serve` uses, so a
 * fresh clone runs against a local backend without being configured first.
 *
 * Trailing slashes are stripped here rather than guarded against at every
 * call site: `https://api.example/` and `https://api.example` are the same
 * host, and only one of them produces a usable URL when something is appended.
 *
 * Empty in a demonstration build, and that is what makes the snapshot work
 * unchanged: `resolveUploads` below prefixes this to every `storage/` path it
 * finds, so an empty base resolves each one against the site's own origin,
 * where the copies under `public/storage` are. Nothing else has to know.
 */
export const API_URL = DEMO
    ? ''
    : (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(
          /\/+$/,
          '',
      );

/**
 * Why a request for the city's information failed, in the terms the reader
 * needs rather than the ones the browser uses.
 *
 * The four are genuinely different situations and the page says something
 * different about each: `offline` is almost always the reader's own
 * connection and is worth retrying immediately; `unreachable` means the
 * address answered nothing, which is a deployment problem and the one case
 * where the API URL is worth printing; `http` means the server answered and
 * refused, and the status is the only useful thing anyone can act on;
 * `malformed` means it answered with something that is not this document,
 * which in practice is a half-finished release.
 *
 * `detail` is written for the person who gets telephoned about it, not for the
 * reader — the screen in App.tsx sets it apart as the technical aside it is.
 */
export type ApiFailure = {
    kind: 'offline' | 'unreachable' | 'http' | 'malformed';
    status?: number;
    detail: string;
};

export class ApiError extends Error {
    constructor(readonly failure: ApiFailure) {
        super(failure.detail);
        this.name = 'ApiError';
    }
}

/**
 * Rewrite the office's uploads to absolute URLs.
 *
 * The queries send media as a path relative to the backend's own root —
 * `storage/posters/water-interruption.webp` — because the one thing the API
 * cannot know is the address this bundle was served from. Resolved against
 * the page instead, every one of them would 404 on the front end's origin.
 *
 * This walks the whole document and rewrites any string beginning
 * `storage/`, rather than naming the fields that hold one. There are eight
 * such fields today across posters, covers and portraits, and a list of them
 * is a list that goes out of date silently: the day an office gains a second
 * image on some record, the field would be missed and the picture would
 * simply not appear. The rule is the backend's own and is stated in
 * HomeController — uploads live under `storage/`, and nothing else does.
 */
function resolveUploads<T>(value: T): T {
    if (typeof value === 'string') {
        return (
            value.startsWith('storage/') ? `${API_URL}/${value}` : value
        ) as T;
    }

    if (Array.isArray(value)) {
        return value.map(resolveUploads) as T;
    }

    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                resolveUploads(item),
            ]),
        ) as T;
    }

    return value;
}

/**
 * Fetch the whole site.
 *
 * `signal` is not optional by accident: React runs effects twice in
 * development's strict mode and a reader can retry faster than a slow
 * connection answers, so every caller has to be able to abandon a request
 * that is no longer wanted. An abort is re-thrown untouched — it is not a
 * failure and must not be drawn as one.
 */
export async function fetchHome(signal: AbortSignal): Promise<HomePayload> {
    /* Named once. All three failures below print it, and an address the
       reader's own browser was refused is the only useful thing anyone
       telephoned about this page can act on. */
    const source = DEMO ? DEMO_SOURCE : `${API_URL}/api/home`;
    let response: Response;

    try {
        response = await fetch(source, {
            signal,
            headers: { Accept: 'application/json' },
        });
    } catch (error) {
        if (signal.aborted) throw error;

        const reason =
            error instanceof Error ? error.message : 'The request failed.';

        // `fetch` rejects identically for a wrong address, a stopped server, a
        // refused CORS preflight and a dropped connection, so the address is
        // named here: on a static bundle a misconfigured VITE_API_URL is the
        // likeliest cause by far, and it is invisible from the outside.
        throw new ApiError(
            navigator.onLine
                ? {
                      kind: 'unreachable',
                      detail: `${source} did not answer (${reason}).`,
                  }
                : { kind: 'offline', detail: reason },
        );
    }

    if (!response.ok) {
        throw new ApiError({
            kind: 'http',
            status: response.status,
            detail: `${source} answered ${response.status}.`,
        });
    }

    try {
        return resolveUploads((await response.json()) as HomePayload);
    } catch {
        throw new ApiError({
            kind: 'malformed',
            detail: 'The response was not the JSON document this page reads.',
        });
    }
}
