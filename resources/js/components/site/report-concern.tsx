import { Mail, MessageSquareWarning, Phone, TriangleAlert } from 'lucide-react';
import { useCity } from './city';
import { Reveal } from './reveal';

/** Digits and a leading plus only — what a `tel:` link can dial. */
const dialable = (number: string) => number.replace(/[^\d+]/g, '');

/**
 * Report a concern: where a resident takes a complaint or a suggestion about
 * a city service.
 *
 * Two channels, side by side and in this order: the city's own, because most
 * problems are fixed fastest by the office that caused them, and the national
 * 8888 hotline, because a resident whose complaint is about that office needs
 * somewhere above it to go. Both are links that act — `mailto:` and `tel:` —
 * rather than text to copy.
 *
 * The city's details are the same contact block the footer uses, and they
 * carry its "awaiting confirmation" label until the City Information Office
 * has verified them.
 */
export function ReportConcern() {
    const city = useCity();
    const national = city.feedback?.national;
    const { email, trunkline, verified } = city.contact;

    if (!national && !email && !trunkline) return null;

    return (
        <section className="site-section" id="report">
            <div className="wrap report-inner">
                <Reveal className="report-intro">
                    <p className="eyebrow">Feedback</p>
                    <h2>Report a concern</h2>
                    <p>
                        A delayed request, a service that fell short, or an idea
                        for doing it better — tell the City Government. Every
                        office is required by law to act on feedback and answer
                        it.
                    </p>
                </Reveal>

                <div className="report-channels">
                    {(email || trunkline) && (
                        <Reveal className="report-channel" index={1}>
                            <MessageSquareWarning
                                className="report-channel-icon"
                                size={22}
                                aria-hidden="true"
                            />
                            <h3>{city.legal_name}</h3>
                            <p>
                                Start here. Name the office, the date and what
                                happened, and keep any receipt or reference
                                number.
                            </p>
                            <ul className="report-actions">
                                {email && (
                                    <li>
                                        <a href={`mailto:${email}`}>
                                            <Mail
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            {email}
                                        </a>
                                    </li>
                                )}
                                {trunkline && (
                                    <li>
                                        <a href={`tel:${dialable(trunkline)}`}>
                                            <Phone
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            {trunkline}
                                        </a>
                                    </li>
                                )}
                            </ul>
                            {!verified && (
                                <p className="demo-text">
                                    <TriangleAlert
                                        size={13}
                                        aria-hidden="true"
                                    />
                                    Contact details awaiting confirmation
                                </p>
                            )}
                        </Reveal>
                    )}

                    {national && (
                        <Reveal
                            className="report-channel report-channel--national"
                            index={2}
                        >
                            <span className="report-channel-number">
                                {national.number}
                            </span>
                            <h3>{national.label}</h3>
                            <p>{national.note}</p>
                            <ul className="report-actions">
                                <li>
                                    <a
                                        href={`tel:${dialable(national.number)}`}
                                    >
                                        <Phone size={16} aria-hidden="true" />
                                        Call {national.number}
                                    </a>
                                </li>
                            </ul>
                        </Reveal>
                    )}
                </div>
            </div>
        </section>
    );
}

export default ReportConcern;
