import { useSyncExternalStore } from 'react';

/**
 * The Network Information API, which TypeScript's DOM library does not declare
 * because it is not in any standard. Chromium ships it, which on this site is
 * most of the audience; Safari and Firefox do not, and there `navigator
 * .connection` is simply absent and every reader is treated as unmetered —
 * the same behaviour the site had before this existed.
 */
type NetworkInformation = {
    readonly saveData?: boolean;
    readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    addEventListener?: (type: 'change', listener: () => void) => void;
    removeEventListener?: (type: 'change', listener: () => void) => void;
};

function connection(): NetworkInformation | undefined {
    return (navigator as Navigator & { connection?: NetworkInformation })
        .connection;
}

function subscribe(onChange: () => void): () => void {
    const link = connection();
    link?.addEventListener?.('change', onChange);

    return () => link?.removeEventListener?.('change', onChange);
}

/**
 * Whether this reader has asked to be sent less, or is on a connection too
 * slow to be sent much.
 *
 * It exists for the banner. The City Information Office has published eight
 * photographs at 2048px — 2.9MB in total — and the banner rotates through
 * every one of them within a minute of the page opening.
 *
 * The phone is no longer the case this protects. Below 700px the banner is a
 * single flattened plate and the carousel is not mounted at all, so no phone
 * asks for any of those eight files; what is left for this hook is the
 * tethered laptop, the desktop on a metered hotspot, and the 2G connection on
 * a wide screen — where the slideshow is still 2.9MB and still optional.
 *
 * The real fix is derivatives: the API should offer each photograph at a few
 * widths and the banner should name them in `srcset`, so a narrow window is
 * sent a narrow copy. Until there is something to resize them, this is the
 * part that can be done honestly — a reader who has turned on Data Saver, or
 * is on 2G, is shown the first photograph and no more. They lose a slideshow.
 * They keep the banner, the plate and every service on the page, which is
 * what they came for.
 *
 * `saveData` is an explicit request and is honoured on its own.
 * `effectiveType` is a measurement, and only its bottom two rungs count:
 * `3g` covers a great deal of ordinary mobile use where the slideshow is
 * still reasonable.
 */
export function useThriftyConnection(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => {
            const link = connection();
            if (!link) return false;

            return (
                link.saveData === true ||
                link.effectiveType === 'slow-2g' ||
                link.effectiveType === '2g'
            );
        },
        // No server render; an unmetered connection is the assumption the site
        // made before this hook existed.
        () => false,
    );
}
