import { OfficialPortrait } from './official-portrait';
import { Reveal } from './reveal';

/** One elected official, as the landing page needs them. */
export type PublicServant = {
    id: number;
    branch: 'executive' | 'legislative';
    position: string;
    name: string | null;
    photo: string | null;
    committee: string | null;
    is_principal: boolean;
};

const BRANCH_LABEL: Record<PublicServant['branch'], string> = {
    executive: 'Executive branch',
    legislative: 'Legislative branch',
};

function ServantName({ name }: { name: string | null }) {
    return name ? (
        <strong className="servant-name">{name}</strong>
    ) : (
        <strong className="servant-name is-pending">
            Name to be confirmed
        </strong>
    );
}

/**
 * Your public servants: the Mayor and the Vice Mayor drawn larger, then the
 * members of the Sangguniang Panlungsod in the order the council lists them.
 *
 * A seat whose holder is not yet confirmed is still listed, by its position,
 * and says so — the council has that seat whether or not the page has caught
 * up with who sits in it.
 */
export function PublicServants({ servants }: { servants: PublicServant[] }) {
    if (!servants.length) return null;

    const principals = servants.filter((servant) => servant.is_principal);
    const council = servants.filter((servant) => !servant.is_principal);

    return (
        <section className="site-section site-section--civic" id="officials">
            <div className="wrap">
                {/* `settle` is this section's gesture: a spring that brings
                    each portrait up to its final size, like a board of framed
                    photographs being hung. It is the one spring on the page,
                    and it belongs to the one section made of faces. */}
                <Reveal className="section-heading" effect="settle">
                    <div>
                        <p className="eyebrow">Your public servants</p>
                        <h2>Elected officials of Tanjay</h2>
                        <p>
                            The City Mayor heads the executive branch. The Vice
                            Mayor presides over the Sangguniang Panlungsod, the
                            city council that passes its ordinances.
                        </p>
                    </div>
                </Reveal>

                {principals.length > 0 && (
                    <ul className="servant-principals">
                        {principals.map((servant, index) => (
                            <Reveal
                                as="li"
                                key={servant.id}
                                index={index}
                                className="servant-principal"
                                effect="settle"
                            >
                                <OfficialPortrait
                                    name={servant.name}
                                    photo={servant.photo}
                                    className="servant-portrait--principal"
                                />
                                <span className="servant-copy">
                                    <span className="servant-branch">
                                        {BRANCH_LABEL[servant.branch]}
                                    </span>
                                    <span className="servant-position">
                                        {servant.position}
                                    </span>
                                    <ServantName name={servant.name} />
                                    {servant.committee && (
                                        <span className="servant-committee">
                                            {servant.committee}
                                        </span>
                                    )}
                                </span>
                            </Reveal>
                        ))}
                    </ul>
                )}

                {council.length > 0 && (
                    <div className="servant-council">
                        <h3 className="servant-council-title">
                            Sangguniang Panlungsod
                            <span>
                                {council.length}{' '}
                                {council.length === 1 ? 'member' : 'members'}
                            </span>
                        </h3>
                        <ul className="servant-grid">
                            {council.map((servant, index) => (
                                <Reveal
                                    as="li"
                                    key={servant.id}
                                    index={index}
                                    className="servant-card"
                                    effect="settle"
                                >
                                    <OfficialPortrait
                                        name={servant.name}
                                        photo={servant.photo}
                                        className="servant-portrait"
                                    />
                                    <span className="servant-copy">
                                        <span className="servant-position">
                                            {servant.position}
                                        </span>
                                        <ServantName name={servant.name} />
                                        {servant.committee && (
                                            <span className="servant-committee">
                                                {servant.committee}
                                            </span>
                                        )}
                                    </span>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

export default PublicServants;
