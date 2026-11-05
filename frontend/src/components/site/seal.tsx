import { Landmark } from 'lucide-react';
import { useState } from 'react';

/**
 * The city seal. Falls back to a civic glyph if the image is missing so the
 * masthead never collapses — a government masthead without its seal still
 * has to read as official.
 *
 * Two WebP sizes, 6.5KB and 17KB, for a slot that is 54px (44px small) and
 * 72px on the failed-to-load screen. 96px covers every one of those at 1x and
 * 192px at 2x, which is as much as any of them can show.
 *
 * Both are derived from the 1254x1254 PNG the Information Office issued — at
 * 1.5MB the single heaviest thing on the page, and downscaled 23x by the
 * browser, so it belongs in the source-art folder rather than in the masthead
 * of a page read on mobile data. The 256px and 512px files this used to serve
 * were a smaller version of the same mistake: 29KB and 73KB of detail that no
 * 54px slot can draw. Rendered side by side at the real slot size, 96px and
 * 256px are indistinguishable.
 *
 * `width`/`height` are the intrinsic pixels of the 1x file; CSS sizes the slot,
 * and they are here so the ratio is known before the file lands.
 */
export function Seal({
    small = false,
    label = 'Official seal of the City of Tanjay',
}: {
    small?: boolean;
    label?: string;
}) {
    const [failed, setFailed] = useState(false);

    return (
        <span
            className={`seal-slot${small ? ' seal-slot--small' : ''}`}
            role="img"
            aria-label={label}
        >
            {failed ? (
                <Landmark aria-hidden="true" />
            ) : (
                <img
                    src="/image/seal-96.webp"
                    srcSet="/image/seal-96.webp 1x, /image/seal-192.webp 2x"
                    alt=""
                    width={96}
                    height={96}
                    onError={() => setFailed(true)}
                />
            )}
        </span>
    );
}

export default Seal;
