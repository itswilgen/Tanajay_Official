import { Award } from 'lucide-react';
import { Reveal } from './reveal';

/** One award or seal conferred on the City Government. */
export type Recognition = {
    id: number;
    title: string;
    conferred_by: string;
    year: number;
    badge: string | null;
};

/**
 * Awards and seals, as a strip beneath the transparency records.
 *
 * Placed there rather than near the top of the page on purpose: a seal is
 * evidence about how the city is run, and it sits best beside the records
 * that are the rest of that evidence — not ahead of the services, where it
 * would read as self-promotion. Each states who conferred it and when,
 * because an award without either is not a claim anyone can check.
 */
export function RecognitionsStrip({
    recognitions,
}: {
    recognitions: Recognition[];
}) {
    if (!recognitions.length) return null;

    return (
        /* `ledger`, the gesture of the transparency section this strip closes:
           the content is wiped in from the left edge like a line being entered
           in a register. The strip shares it rather than taking a gesture of
           its own, because it is the end of that section and not a section. */
        <Reveal as="div" className="recognitions" index={2} effect="ledger">
            <h3 className="recognitions-title" id="recognitions-title">
                Awards and recognitions
            </h3>
            <ul
                className="recognition-list"
                aria-labelledby="recognitions-title"
            >
                {recognitions.map((recognition) => (
                    <li className="recognition" key={recognition.id}>
                        <span className="recognition-badge">
                            {recognition.badge ? (
                                <img
                                    // Already absolute on the API's origin;
                                    // see `resolveUploads` in api.ts. No
                                    // recognition carries a badge yet, so
                                    // prefixing here would have broken the
                                    // first one an office ever uploaded.
                                    src={recognition.badge}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <Award aria-hidden="true" />
                            )}
                        </span>
                        <span className="recognition-copy">
                            <span className="recognition-year">
                                {recognition.year}
                            </span>
                            <strong>{recognition.title}</strong>
                            <span>{recognition.conferred_by}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </Reveal>
    );
}

export default RecognitionsStrip;
