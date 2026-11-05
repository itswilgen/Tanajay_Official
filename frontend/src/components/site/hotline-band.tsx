import { Phone, TriangleAlert } from 'lucide-react';
import { useCity } from './city';

/**
 * Emergency numbers. The highest-consequence block on the site, so it gets a
 * danger-tinted band of its own above the footer, every number is a tel:
 * link, and each row is a full-height tap target. It appears on every public
 * page at the same anchor (#hotlines) so the identity strip can always
 * reach it.
 */
export function HotlineBand() {
    const city = useCity();

    if (!city.hotlines.length) return null;

    return (
        <section className="hotline-band" id="hotlines">
            <div className="wrap hotline-band-inner">
                <div className="hotline-intro">
                    <p className="eyebrow eyebrow--danger">In an emergency</p>
                    <h2>Call for help</h2>
                    <p>
                        Lines are answered around the clock. If you are not sure
                        which office to reach, call 911 and the operator will
                        route you.
                    </p>
                    {!city.hotlines_verified && (
                        <p className="demo-text">
                            <TriangleAlert size={13} aria-hidden="true" />
                            Numbers pending confirmation
                        </p>
                    )}
                </div>

                <ul className="hotline-list">
                    {city.hotlines.map((hotline) => (
                        <li className="hotline-item" key={hotline.label}>
                            <a
                                className="hotline-link"
                                href={`tel:${hotline.number.replace(/[^\d+]/g, '')}`}
                            >
                                <span className="hotline-copy">
                                    <strong>{hotline.label}</strong>
                                    <small>Available {hotline.available}</small>
                                </span>
                                <span className="hotline-number">
                                    <Phone size={15} aria-hidden="true" />
                                    {hotline.number}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default HotlineBand;
