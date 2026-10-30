import { usePage } from '@inertiajs/react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useCity } from './city';
import { Seal } from './seal';

/* Where a reader goes when this site cannot answer them. These are the
   national bodies a city government is obliged to sit under, not a link
   exchange, and each one is a live site rather than a placeholder — which is
   why the column is three entries rather than padded out to match the one
   beside it. */
const NATIONAL_LINKS = [
    { href: 'https://www.gov.ph', label: 'Republic of the Philippines' },
    { href: 'https://www.officialgazette.gov.ph', label: 'Official Gazette' },
    {
        href: 'https://www.dilg.gov.ph',
        label: 'Interior and Local Government',
    },
];

/* The page's own sections, in page order. While the site is a single page
   this replaces the columns of listing links that used to stand here; add a
   column back when there are pages for it to point at.

   The guides, the Mayor's Desk, the programmes and the officials render
   nothing until the office has published records for them, and a link to an
   anchor that is not on the page does nothing at all — so those four are
   listed only when the page they would land on was sent their records. */
type SectionProps = {
    guides?: unknown[];
    mayorsDesk?: { message: unknown; agenda: unknown[] };
    programs?: unknown[];
    publicServants?: unknown[];
};

const SECTIONS: {
    href: string;
    label: string;
    shown?: (props: SectionProps) => boolean;
}[] = [
    { href: '#services', label: 'City services' },
    {
        href: '#guides',
        label: 'How do I…',
        shown: (props) => Boolean(props.guides?.length),
    },
    {
        href: '#mayor',
        label: 'From the Mayor',
        shown: (props) =>
            Boolean(
                props.mayorsDesk?.message || props.mayorsDesk?.agenda.length,
            ),
    },
    { href: '#information', label: 'Public information' },
    {
        href: '#programs',
        label: 'Programmes',
        shown: (props) => Boolean(props.programs?.length),
    },
    {
        href: '#officials',
        label: 'Elected officials',
        shown: (props) => Boolean(props.publicServants?.length),
    },
    { href: '#transparency', label: 'Transparency' },
    { href: '#report', label: 'Report a concern' },
    { href: '#hotlines', label: 'Emergency hotlines' },
];

export function SiteFooter() {
    const city = useCity();
    const props = usePage().props as SectionProps;
    const sections = SECTIONS.filter(
        (section) => !section.shown || section.shown(props),
    );

    return (
        <footer className="site-footer">
            <div className="republic-rule" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>

            <div className="wrap site-footer-main">
                {/* `#contact` — the menu's "Visit City Hall" and "Reach City
                    Hall" entries land here, on the address and hours. */}
                <div className="footer-brand" id="contact">
                    <div className="footer-brand-top">
                        <Seal small />
                        <span className="footer-brand-copy">
                            <strong>{city.legal_name}</strong>
                            <span>
                                {city.province} · {city.region}
                            </span>
                        </span>
                    </div>

                    <div className="footer-contact">
                        {city.contact.address && (
                            <div>
                                <MapPin size={15} aria-hidden="true" />
                                <span>{city.contact.address}</span>
                            </div>
                        )}
                        {city.office_hours.weekdays && (
                            <div>
                                <Clock size={15} aria-hidden="true" />
                                <span>
                                    {city.office_hours.weekdays}
                                    <br />
                                    {city.office_hours.note}
                                </span>
                            </div>
                        )}
                        {city.contact.trunkline && (
                            <div>
                                <Phone size={15} aria-hidden="true" />
                                <a
                                    href={`tel:${city.contact.trunkline.replace(/[^\d+]/g, '')}`}
                                >
                                    {city.contact.trunkline}
                                </a>
                            </div>
                        )}
                        {city.contact.email && (
                            <div>
                                <Mail size={15} aria-hidden="true" />
                                <a href={`mailto:${city.contact.email}`}>
                                    {city.contact.email}
                                </a>
                            </div>
                        )}
                        {!city.contact.verified && (
                            <span className="demo-text">
                                Contact details awaiting confirmation by the
                                City Information Office
                            </span>
                        )}
                    </div>
                </div>

                <nav
                    className="footer-sections"
                    aria-label="Sections of this page"
                >
                    <strong>On this page</strong>
                    {sections.map((section) => (
                        <a key={section.href} href={section.href}>
                            {section.label}
                        </a>
                    ))}
                </nav>

                <nav aria-label="Government of the Philippines">
                    <strong>Government of the Philippines</strong>
                    {NATIONAL_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {link.label}
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    ))}
                </nav>
            </div>

            <div className="footer-bottom">
                <div className="wrap footer-bottom-inner">
                    <p>
                        © {new Date().getFullYear()} {city.legal_name}. All
                        rights reserved.
                    </p>
                    <p>{city.charter}</p>
                </div>
            </div>
        </footer>
    );
}

export default SiteFooter;
