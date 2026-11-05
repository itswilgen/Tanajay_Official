import { OfficialPortrait } from './official-portrait';
import { Reveal } from './reveal';

/** One numbered point of the Mayor's priority agenda. */
type AgendaPoint = {
    id: number;
    title: string;
    summary: string;
};

/** The Mayor's signed message and priority agenda, as the page needs them. */
export type MayorsDeskData = {
    message: {
        name: string;
        position: string;
        photo: string | null;
        text: string;
    } | null;
    agenda: AgendaPoint[];
};

/**
 * "From the Mayor's Desk": a signed message, then the priority agenda.
 *
 * The message is set as a quotation with its attribution beneath it, in a
 * `<figure>` so the signature belongs to the words above it. The agenda is a
 * numbered, ruled list rather than a row of icon cards: the Mayor's office
 * numbers its points, residents and the press cite them by number ("point
 * four"), and the numerals are the one thing on it worth setting large.
 *
 * Either half stands alone. An agenda published before the message is written
 * gets the section heading itself.
 */
export function MayorsDesk({ desk }: { desk: MayorsDeskData }) {
    const { message, agenda } = desk;

    if (!message && !agenda.length) return null;

    return (
        <section className="site-section site-section--ivory" id="mayor">
            <div className="wrap">
                {/* `lift` is this section's gesture, and it is spent here
                    rather than spread over the section: the letter is one
                    large block with a portrait in it, which is exactly what
                    a rise out of a shallow blur suits, and it is the only
                    blur on the page. The agenda beneath keeps the house rise,
                    because eight numbered points each coming out of their own
                    blur would be the same effect eight times over. */}
                {message ? (
                    <Reveal as="div" className="mayor-letter" effect="lift">
                        <OfficialPortrait
                            name={message.name}
                            photo={message.photo}
                            className="mayor-portrait"
                        />

                        <div className="mayor-letter-body">
                            <p className="eyebrow">Leadership</p>
                            <h2>From the Mayor’s Desk</h2>

                            <figure className="mayor-quote">
                                <blockquote>
                                    <p>{message.text}</p>
                                </blockquote>
                                <figcaption className="mayor-signature">
                                    <strong>{message.name}</strong>
                                    <span>{message.position}</span>
                                </figcaption>
                            </figure>
                        </div>
                    </Reveal>
                ) : (
                    <Reveal className="section-heading" effect="lift">
                        <div>
                            <p className="eyebrow">Leadership</p>
                            <h2>The Mayor’s priority agenda</h2>
                        </div>
                    </Reveal>
                )}

                {agenda.length > 0 && (
                    <div
                        className={`mayor-agenda${
                            message ? '' : ' mayor-agenda--alone'
                        }`}
                    >
                        {message && (
                            <Reveal className="mayor-agenda-heading">
                                <h3>Priority agenda</h3>
                                <p>
                                    {agenda.length}{' '}
                                    {agenda.length === 1 ? 'point' : 'points'},
                                    numbered by the Mayor’s office
                                </p>
                            </Reveal>
                        )}

                        <ol className="agenda-list">
                            {agenda.map((point, index) => (
                                <Reveal
                                    as="li"
                                    key={point.id}
                                    index={index}
                                    className="agenda-point"
                                >
                                    <span
                                        className="agenda-number"
                                        aria-hidden="true"
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="agenda-copy">
                                        <strong>{point.title}</strong>
                                        <span>{point.summary}</span>
                                    </span>
                                </Reveal>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </section>
    );
}

export default MayorsDesk;
