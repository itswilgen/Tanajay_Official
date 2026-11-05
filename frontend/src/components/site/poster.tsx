import { useState } from 'react';

type Props = {
    /**
     * A URL ready to use: an absolute one on the API's origin for an office's
     * upload, a root-relative one for a bundled asset, or null.
     */
    src: string | null;
    /**
     * Empty when the poster sits beside its own title and would only repeat
     * it to a screen reader.
     */
    alt: string;
    /** The placement's own class, added to the shared `poster-frame`. */
    className?: string;
    /** Called once if the file cannot be loaded. */
    onMissing?: () => void;
    /**
     * The artwork's intrinsic size, so the browser reserves the right box
     * before the file arrives. Defaults to the 16:9 poster an office uploads
     * for a notice, event or programme; the updates band passes the 3:4 of a
     * magazine cover. The frame's own ratio is set in CSS by `className` —
     * these two numbers only have to agree with the file.
     */
    width?: number;
    height?: number;
    /**
     * Fetched at once, and given priority. Every poster on the page is below
     * the fold, where lazy is right; the updates band's featured cover is the
     * exception — it sits directly under the banner, and leaving the largest
     * piece of artwork in the first screenful at lazy priority is the delay
     * lazy loading exists to avoid, not one to introduce.
     */
    eager?: boolean;
};

/**
 * An office's poster for a notice, event or programme, in a 16:9 frame.
 *
 * The frame holds its shape before the image arrives, so a poster loading
 * late never shifts the text under it. A poster whose file has gone takes
 * its frame with it rather than leaving a grey box standing in for artwork
 * that is not there — the record still reads in full without it.
 */
export function Poster({
    src,
    alt,
    className,
    onMissing,
    width = 1600,
    height = 900,
    eager = false,
}: Props) {
    const [missing, setMissing] = useState(false);

    if (!src || missing) return null;

    return (
        <figure className={`poster-frame${className ? ` ${className}` : ''}`}>
            <img
                // Used as given. An office's upload arrives from the API
                // already resolved to an absolute URL on the API's own origin
                // (see `resolveUploads` in api.ts), and a bundled asset arrives
                // as a root-relative path from Vite. The `storage/…` paths this
                // used to have to prefix no longer reach here, and prefixing
                // now would turn `https://…` into `/https://…`.
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={eager ? 'eager' : 'lazy'}
                fetchPriority={eager ? 'high' : undefined}
                decoding="async"
                onError={() => {
                    setMissing(true);
                    onMissing?.();
                }}
            />
        </figure>
    );
}

export default Poster;
