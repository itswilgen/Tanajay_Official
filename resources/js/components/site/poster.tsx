import { useState } from 'react';

type Props = {
    /**
     * A path under the site root as the queries send it (`storage/…`), a
     * bundled asset URL that already starts with `/`, or null.
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
};

/**
 * An office's poster for a notice, event or programme, in a 16:9 frame.
 *
 * The frame holds its shape before the image arrives, so a poster loading
 * late never shifts the text under it. A poster whose file has gone takes
 * its frame with it rather than leaving a grey box standing in for artwork
 * that is not there — the record still reads in full without it.
 */
export function Poster({ src, alt, className, onMissing }: Props) {
    const [missing, setMissing] = useState(false);

    if (!src || missing) return null;

    return (
        <figure className={`poster-frame${className ? ` ${className}` : ''}`}>
            <img
                // Prefixing a bundled URL as well would make it `//build/…`,
                // which the browser reads as a host name, not a path.
                src={src.startsWith('/') ? src : `/${src}`}
                alt={alt}
                width={1600}
                height={900}
                loading="lazy"
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
