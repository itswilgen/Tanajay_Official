import { ArrowDown, TriangleAlert } from 'lucide-react';
import { formatCityDate } from '@/lib/city-time';

/** The notice an office has flagged for the alert band. */
export type UrgentNotice = {
    id: number;
    category: string;
    title: string;
    published_at: string | null;
};

/**
 * The alert band: a class or work suspension, a typhoon signal, a water
 * interruption — whatever an office has flagged as urgent.
 *
 * It sits directly under the header, above the banner, rather than below it.
 * The reference sites put their tickers under the slider, and that is the
 * wrong trade for this content: on a phone the banner alone fills the first
 * screen, and the one notice that cannot wait would be the one a resident has
 * to scroll to find.
 *
 * A labelled region, not `role="alert"`. It is on the page when it loads, not
 * something that appeared while the reader was busy, and an alert role would
 * have a screen reader interrupt itself to read the same line twice.
 */
export function UrgentAdvisory({ notice }: { notice: UrgentNotice | null }) {
    if (!notice) return null;

    const date = formatCityDate(notice.published_at);

    return (
        <section className="urgent-band" aria-label="Urgent advisory">
            <div className="wrap urgent-band-inner">
                <p className="urgent-band-tag">
                    <TriangleAlert size={16} aria-hidden="true" />
                    Urgent advisory
                </p>
                <p className="urgent-band-copy">
                    <strong>{notice.title}</strong>
                    {date && (
                        <time dateTime={notice.published_at ?? undefined}>
                            {date}
                        </time>
                    )}
                </p>
                {/* The full notice is in the listing further down; there is
                    no detail page to link to yet. */}
                <a className="urgent-band-link" href="#information">
                    Read the notice
                    <ArrowDown size={15} aria-hidden="true" />
                </a>
            </div>
        </section>
    );
}

export default UrgentAdvisory;
