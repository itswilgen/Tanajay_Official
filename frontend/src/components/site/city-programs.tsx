import { Poster } from './poster';
import { Reveal } from './reveal';

/** One city programme, as the landing page needs it. */
export type CityProgram = {
    id: number;
    title: string;
    summary: string;
    audience: string;
    office: string;
    how_to_apply: string;
    poster: string | null;
};

/**
 * City programmes, each headed by who it is for.
 *
 * A resident reads this list looking for themselves — a senior citizen, a
 * farmer, a parent of a student — so the audience is the first line of text
 * on every card, in a band of its own, ahead of the programme's name. The
 * office's poster, when there is one, sits above it: it is the artwork the
 * resident has already seen on the city's page, and recognising it is the
 * quickest way to find the card. The two facts that turn interest into a
 * visit, the office and how to apply, close each card in the same place, so
 * they can be compared across the row.
 */
export function CityPrograms({ programs }: { programs: CityProgram[] }) {
    if (!programs.length) return null;

    return (
        <section className="site-section site-section--clay" id="programs">
            <div className="wrap">
                {/* `tilt` is this section's gesture: the cards come up off
                    their bottom edge, the way a leaflet held at the counter
                    tips upright to be read. The rotation is small (7°) and the
                    perspective long, so it reads as weight rather than as a
                    card flipping over. */}
                <Reveal className="section-heading" effect="tilt">
                    <div>
                        <p className="eyebrow">City programmes</p>
                        <h2>Assistance and programmes</h2>
                        <p>
                            Help the City Government gives directly — who
                            qualifies, which office runs it, and how to apply.
                        </p>
                    </div>
                </Reveal>

                <ul className="program-list">
                    {programs.map((program, index) => (
                        <Reveal
                            as="li"
                            key={program.id}
                            index={index}
                            className="program"
                            effect="tilt"
                        >
                            <Poster
                                src={program.poster}
                                alt={`Poster for ${program.title}`}
                                className="program-poster"
                            />
                            <p className="program-audience">
                                <span>For</span> {program.audience}
                            </p>
                            <div className="program-body">
                                <h3>{program.title}</h3>
                                <p>{program.summary}</p>
                            </div>
                            <dl className="program-facts">
                                <div>
                                    <dt>Office</dt>
                                    <dd>{program.office}</dd>
                                </div>
                                <div>
                                    <dt>How to apply</dt>
                                    <dd>{program.how_to_apply}</dd>
                                </div>
                            </dl>
                        </Reveal>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default CityPrograms;
