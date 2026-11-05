import { UserRound } from 'lucide-react';
import { useState } from 'react';

/**
 * Initials from a name as it is printed on a plate: honorifics ("Hon.",
 * "Atty.") and middle initials ("T.") are skipped, so "Hon. Jose T. Orlino"
 * becomes "JO" rather than "HO".
 */
function initials(name: string): string {
    const words = name
        .split(/\s+/)
        .filter((word) => word.length > 1 && !word.endsWith('.'));

    if (!words.length) return '';

    const first = words[0];
    const last = words[words.length - 1];

    return (first[0] + (words.length > 1 ? last[0] : '')).toUpperCase();
}

type Props = {
    name: string | null;
    photo: string | null;
    className: string;
};

/**
 * An official's portrait: the photograph when the office has supplied one,
 * otherwise the initials set on the city green, and — for a seat whose holder
 * is not confirmed — a neutral figure, because initials invented from a
 * placeholder would be a claim about who holds it.
 *
 * Decorative in every form: the name is always printed next to it, so a screen
 * reader hearing it twice gains nothing. A photograph whose file has gone falls
 * back to the initials rather than leaving a broken image in the frame.
 */
export function OfficialPortrait({ name, photo, className }: Props) {
    const [photoFailed, setPhotoFailed] = useState(false);

    if (photo && !photoFailed) {
        return (
            <span className={`official-portrait ${className}`}>
                <img
                    // Used as given. `resolveUploads` in api.ts has already
                    // made the office's `storage/…` path absolute on the API's
                    // origin; a slash in front of that produced
                    // `/https://…`, which this origin's SPA rewrite answers
                    // with index.html — so the Mayor's photograph decoded to
                    // nothing and every official fell back to initials.
                    src={photo}
                    alt=""
                    // No width/height, deliberately. Every frame this renders
                    // into is sized by CSS — 5:6 at the Mayor's Desk, a 52px
                    // or 88px disc in the officials grid — and the image fills
                    // it with `object-fit: cover`, so the box is already
                    // reserved and nothing shifts when the file lands. The
                    // attributes would only state an intrinsic size that
                    // varies with whatever each office uploaded.
                    loading="lazy"
                    decoding="async"
                    onError={() => setPhotoFailed(true)}
                />
            </span>
        );
    }

    const letters = name ? initials(name) : '';

    return (
        <span
            className={`official-portrait official-portrait--blank ${className}`}
            aria-hidden="true"
        >
            {letters ? (
                <span className="official-portrait-initials">{letters}</span>
            ) : (
                <UserRound className="official-portrait-figure" />
            )}
        </span>
    );
}

export default OfficialPortrait;
