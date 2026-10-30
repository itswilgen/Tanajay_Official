import { Award } from 'lucide-react';

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
        <div className="recognitions">
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
                                    src={`/${recognition.badge}`}
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
        </div>
    );
}

export default RecognitionsStrip;
