import {
    ArrowRight,
    Briefcase,
    FileText,
    GraduationCap,
    Megaphone,
    Phone,
    Scale,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import announcements from '../../../images/services/announcements.webp';
import hotlines from '../../../images/services/hotlines.webp';
import jobs from '../../../images/services/jobs.webp';
import requirements from '../../../images/services/requirements.webp';
import scholarships from '../../../images/services/scholarships.webp';
import transparency from '../../../images/services/transparency.webp';
import type { Shortcut } from './city';
import { Poster } from './poster';
import { Reveal } from './reveal';

/** Config supplies an icon name; the mapping stays in the UI layer. */
const ICONS: Record<string, LucideIcon> = {
    'file-text': FileText,
    briefcase: Briefcase,
    'graduation-cap': GraduationCap,
    megaphone: Megaphone,
    phone: Phone,
    scale: Scale,
};

/**
 * Cover artwork, named the same way. These are the portal's own category
 * art — the card's title and line set as a poster — not an office's
 * announcement, so they ship in the bundle with hashed names rather than
 * sitting on the uploads disk.
 */
const COVERS: Record<string, string> = {
    announcements,
    hotlines,
    jobs,
    requirements,
    scholarships,
    transparency,
};

export function ServiceGrid({ shortcuts }: { shortcuts: Shortcut[] }) {
    if (!shortcuts.length) return null;

    return (
        <div className="service-grid">
            {shortcuts.map((shortcut, index) => {
                const Icon = ICONS[shortcut.icon] ?? FileText;

                return (
                    /* Keyed on the title, not the href: several shortcuts point
                       at the same section of this page while their own listings
                       are being rebuilt, so the href is no longer unique. */
                    <Reveal
                        as="article"
                        key={shortcut.title}
                        index={index}
                        className="service-card"
                    >
                        {/* The cover restates the title beside it, so it is
                            silent to a screen reader. */}
                        <Poster
                            src={
                                shortcut.cover
                                    ? (COVERS[shortcut.cover] ?? null)
                                    : null
                            }
                            alt=""
                            className="service-cover"
                        />
                        <div className="service-card-top">
                            <span className="service-card-icon">
                                <Icon size={21} aria-hidden="true" />
                            </span>
                            <span className="service-card-number">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </div>
                        <h3>
                            <a href={shortcut.href}>{shortcut.title}</a>
                        </h3>
                        <p>{shortcut.description}</p>
                        <span className="service-card-link">
                            {shortcut.cta}
                            <ArrowRight size={15} aria-hidden="true" />
                        </span>
                    </Reveal>
                );
            })}
        </div>
    );
}

export default ServiceGrid;
