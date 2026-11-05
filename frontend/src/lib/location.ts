import { useSyncExternalStore } from 'react';

/**
 * The path the reader is on, without query or fragment.
 *
 * This replaces Inertia's `usePage().url`, which the header reads to mark the
 * navigation cell a reader is currently in. There is no router here — the site
 * is one page — so today this is always `/` and the Home cell is the one
 * marked, which is correct.
 *
 * It is a subscription rather than a bare read of `window.location` because
 * the alternative is a value React has no way of knowing changed. Nothing in
 * this bundle pushes history yet, so the store is quiet; the day a second
 * route lands, the header updates instead of showing the cell for the page the
 * reader left. `popstate` is the one event that covers both the back button
 * and a future `history.pushState` paired with it.
 */
function subscribe(onChange: () => void): () => void {
    window.addEventListener('popstate', onChange);

    return () => window.removeEventListener('popstate', onChange);
}

export function useLocationPath(): string {
    return useSyncExternalStore(
        subscribe,
        () => window.location.pathname,
        // There is no server render, but `useSyncExternalStore` asks for this
        // snapshot and `/` is the honest answer for a single-page site.
        () => '/',
    );
}
