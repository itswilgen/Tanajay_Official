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
 * every one of them within a minute of the page opening. On the desktop
 * layout that is a banner 1425px wide; on a phone it is 390px, and the whole
 * 2.9MB is spent redrawing a strip a fifth of that size.
 *
 * The real fix is derivatives: the API should offer each photograph at a few
 * widths and the banner should name them in `srcset`, so a phone is sent a
 * 390px copy of one. Until there is something to resize them, this is the
 * part that can be done honestly — a reader who has turned on Data Saver, or
 * is on 2G, is shown the first photograph and no more. They lose a slideshow.
 * They keep the banner, the plate, the advisory and every service on the
 * page, which is what they came for.
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
