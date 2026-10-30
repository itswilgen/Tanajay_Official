import { Landmark } from 'lucide-react';
import { useState } from 'react';

/**
 * The city seal. Falls back to a civic glyph if the image is missing so the
 * masthead never collapses — a government masthead without its seal still
 * has to read as official.
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
                    src="/image/OfficialLogo.png"
                    alt=""
                    onError={() => setFailed(true)}
                />
            )}
        </span>
    );
}

export default Seal;
