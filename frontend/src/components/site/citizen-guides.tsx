import { Building2, ChevronDown, Clock, Wallet } from 'lucide-react';
import { Reveal } from './reveal';

/** One "How do I…" guide, as the landing page needs it. */
export type CitizenGuide = {
    id: number;
    title: string;
    summary: string;
    steps: string[];
    requirements: string[];
    fee: string | null;
    processing_time: string | null;
    office: string;
};

/**
 * "How do I…" — the tasks residents most often come to City Hall for, each
 * written as steps, requirements, fee, time and office.
 *
 * Each guide opens in place, as a native `<details>`. There is no guide page
 * to link to yet, and a disclosure is the honest shape for that: the whole
 * answer is here, it costs no JavaScript to open, and it works with the
 * keyboard and a screen reader with nothing added. The first guide is closed
 * like the rest — opening one by default would make it look more important
 * than the others, which the order already says.
 */
export function CitizenGuides({ guides }: { guides: CitizenGuide[] }) {
    if (!guides.length) return null;

    return (
        <section className="site-section site-section--sage" id="guides">
            {/* Intro on the left, one column of guides on the right. A grid of
                disclosures leaves a hole beside whichever one is opened; a
                single column grows straight down, and the intro holds its
                place beside it while the reader works through the list. */}
            <div className="wrap guides-inner">
                {/* `drift` throughout: the intro holds the left and the guides
                    run down the right, so the section's gesture comes in from
                    the left in the direction the pair is read. */}
                <Reveal className="section-heading guides-intro" effect="drift">
                    <div>
                        <p className="eyebrow">Step by step</p>
                        <h2>How do I…</h2>
                        <p>
                            What to bring, what it costs, how long it takes and
                            where to go — for the things residents most often
                            come to City Hall to do.
                        </p>
                    </div>
                </Reveal>

                <ul className="guide-list">
                    {guides.map((guide, index) => (
                        <Reveal
                            as="li"
                            key={guide.id}
                            index={index}
                            effect="drift"
                        >
                            <details className="guide">
                                <summary className="guide-summary">
                                    <span className="guide-summary-copy">
                                        <strong>{guide.title}</strong>
                                        <span>{guide.summary}</span>
                                    </span>
                                    <ChevronDown
                                        className="guide-caret"
                                        size={18}
                                        aria-hidden="true"
                                    />
                                </summary>

                                <div className="guide-body">
                                    {guide.steps.length > 0 && (
                                        <div>
                                            <h3 className="guide-label">
                                                Steps
                                            </h3>
                                            <ol className="guide-steps">
                                                {guide.steps.map((step) => (
                                                    <li key={step}>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {guide.requirements.length > 0 && (
                                        <div>
                                            <h3 className="guide-label">
                                                What to bring
                                            </h3>
                                            <ul className="guide-requirements">
                                                {guide.requirements.map(
                                                    (requirement) => (
                                                        <li key={requirement}>
                                                            {requirement}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <dl className="guide-facts">
                                        <div>
                                            <dt>
                                                <Building2
                                                    size={15}
                                                    aria-hidden="true"
                                                />
                                                Office
                                            </dt>
                                            <dd>{guide.office}</dd>
                                        </div>
                                        {guide.fee && (
                                            <div>
                                                <dt>
                                                    <Wallet
                                                        size={15}
                                                        aria-hidden="true"
                                                    />
                                                    Fee
                                                </dt>
                                                <dd>{guide.fee}</dd>
                                            </div>
                                        )}
                                        {guide.processing_time && (
                                            <div>
                                                <dt>
                                                    <Clock
                                                        size={15}
                                                        aria-hidden="true"
                                                    />
                                                    Processing time
                                                </dt>
                                                <dd>{guide.processing_time}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            </details>
                        </Reveal>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default CitizenGuides;
