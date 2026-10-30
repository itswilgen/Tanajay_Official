import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Landmark, Lock } from 'lucide-react';
import { useState } from 'react';
import { useCity } from '@/components/site/city';
import type { Shortcut } from '@/components/site/city';
import { CitizenGuides } from '@/components/site/citizen-guides';
import type { CitizenGuide } from '@/components/site/citizen-guides';
import { CityHero } from '@/components/site/city-hero';
import { CityPrograms } from '@/components/site/city-programs';
import type { CityProgram } from '@/components/site/city-programs';
import type { HeroPhoto } from '@/components/site/city-hero';
import { HotlineBand } from '@/components/site/hotline-band';
import { MayorsDesk } from '@/components/site/mayors-desk';
import type { MayorsDeskData } from '@/components/site/mayors-desk';
import { PublicServants } from '@/components/site/public-servants';
import { Poster } from '@/components/site/poster';
import type { PublicServant } from '@/components/site/public-servants';
import { RecognitionsStrip } from '@/components/site/recognitions-strip';
import type { Recognition } from '@/components/site/recognitions-strip';
import { ReportConcern } from '@/components/site/report-concern';
import { Reveal } from '@/components/site/reveal';
import { ServiceGrid } from '@/components/site/service-grid';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { UpcomingEvents } from '@/components/site/upcoming-events';
import type { CityEvent } from '@/components/site/upcoming-events';
import { UrgentAdvisory } from '@/components/site/urgent-advisory';
import type { UrgentNotice } from '@/components/site/urgent-advisory';
import { formatCityDate, formatCityDayMonth } from '@/lib/city-time';

/**
 * A published notice, as the landing page needs it. There is no detail page
 * yet, so the listing states each notice rather than linking to one — a title
 * that looks like a link and goes nowhere is worse than a title that does not.
 */
type Notice = {
    id: number;
    category: string;
    title: string;
    description: string;
    poster: string | null;
    published_at?: string | null;
};

type Props = {
    heroPhotos: HeroPhoto[];
    urgentAdvisory: UrgentNotice | null;
    shortcuts: Shortcut[];
    guides: CitizenGuide[];
    mayorsDesk: MayorsDeskData;
    notices: Notice[];
    events: CityEvent[];
    programs: CityProgram[];
    publicServants: PublicServant[];
    recognitions: Recognition[];
};

export default function Home({
    heroPhotos,
    urgentAdvisory,
    shortcuts,
    guides,
    mayorsDesk,
    notices,
    events,
    programs,
    publicServants,
    recognitions,
}: Props) {
    const city = useCity();
    const [leadPosterFailed, setLeadPosterFailed] = useState(false);

    // The hero's advisory strip reuses the listing already on the page rather
    // than asking for a second query.
    // It skips the notice already in the alert band above the banner, so the
    // same line is not set twice on one screen.
    const advisory =
        notices.find(
            (notice) =>
                notice.category === 'Announcements' &&
                notice.id !== urgentAdvisory?.id,
        ) ?? null;

    const [lead, ...rest] = notices;
    const leadHasPoster = Boolean(lead?.poster) && !leadPosterFailed;

    return (
        <>
            <Head>
                <title>{city.legal_name}</title>
                <meta name="description" content={city.tagline} />
            </Head>

            <SiteHeader />

            <main id="main">
                <UrgentAdvisory notice={urgentAdvisory} />

                <CityHero photos={heroPhotos} advisory={advisory} />

                {/* Service shortcuts first: most visits start with a task, not
                    with the news. */}
                {shortcuts?.length ? (
                    <section className="site-section" id="services">
                        <div className="wrap">
                            <Reveal className="section-heading">
                                <div>
                                    <p className="eyebrow">
                                        Start with what you need
                                    </p>
                                    <h2>City services and requirements</h2>
                                    <p>
                                        Each listing names the office
                                        responsible, what to bring, and any
                                        deadline that applies.
                                    </p>
                                </div>
                            </Reveal>
                            <ServiceGrid shortcuts={shortcuts} />
                        </div>
                    </section>
                ) : null}

                {/* Task guides directly after the services: the next thing a
                    resident who came to do something needs is how. */}
                <CitizenGuides guides={guides} />

                {/* Who is answerable for all of it, after the tasks and before
                    the news. */}
                <MayorsDesk desk={mayorsDesk} />

                {/* Published notices. One lead and a ruled list rather than a
                    row of equal cards: four cards side by side make every
                    notice look equally urgent, which is false. */}
                <section
                    className="site-section site-section--sea"
                    id="information"
                >
                    <div className="wrap">
                        <Reveal className="section-heading">
                            <div>
                                <p className="eyebrow">Public information</p>
                                <h2>Latest from the City Government</h2>
                                <p>
                                    Announcements, job vacancies, scholarships,
                                    events, and service requirements — posted by
                                    the office that administers each one.
                                </p>
                            </div>
                        </Reveal>

                        {/* Events take a column beside the notices when there
                            are any: both are what is happening in the city,
                            and the date blocks give the eye a second thing to
                            scan down. */}
                        <div
                            className={`news${
                                events.length ? ' news--with-events' : ''
                            }`}
                        >
                            {lead ? (
                                <div className="notice-lead-grid">
                                    <Reveal
                                        as="article"
                                        className={`notice-lead${
                                            leadHasPoster
                                                ? ''
                                                : ' notice-lead--plain'
                                        }`}
                                    >
                                        {/* No poster, or one whose file has gone:
                                            the lead is set as type on the page
                                            rather than around a grey rectangle
                                            standing in for a photograph that was
                                            never taken. */}
                                        <Poster
                                            src={lead.poster}
                                            alt={`Poster for ${lead.title}`}
                                            onMissing={() =>
                                                setLeadPosterFailed(true)
                                            }
                                        />

                                        <div className="notice-lead-body">
                                            <p className="notice-kicker">
                                                <span className="notice-category">
                                                    {lead.category}
                                                </span>
                                                {lead.published_at && (
                                                    <time
                                                        dateTime={
                                                            lead.published_at
                                                        }
                                                    >
                                                        {formatCityDate(
                                                            lead.published_at,
                                                        )}
                                                    </time>
                                                )}
                                            </p>
                                            <h3>{lead.title}</h3>
                                            {lead.description && (
                                                <p className="notice-lead-standfirst">
                                                    {lead.description}
                                                </p>
                                            )}
                                        </div>
                                    </Reveal>

                                    {rest.length ? (
                                        <Reveal
                                            as="div"
                                            index={1}
                                            className="notice-rows"
                                        >
                                            <ol>
                                                {rest.map((notice) => (
                                                    <li key={notice.id}>
                                                        <div className="notice-row">
                                                            <span className="notice-row-date">
                                                                {formatCityDayMonth(
                                                                    notice.published_at,
                                                                ) ?? '—'}
                                                            </span>
                                                            <span className="notice-row-copy">
                                                                <span className="notice-category">
                                                                    {
                                                                        notice.category
                                                                    }
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        notice.title
                                                                    }
                                                                </strong>
                                                            </span>
                                                            {/* The title is
                                                                beside it, so the
                                                                thumbnail adds
                                                                nothing to say
                                                                aloud. */}
                                                            <Poster
                                                                src={
                                                                    notice.poster
                                                                }
                                                                alt=""
                                                                className="notice-row-poster"
                                                            />
                                                        </div>
                                                    </li>
                                                ))}
                                            </ol>
                                        </Reveal>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Landmark aria-hidden="true" />
                                    <h3>Nothing published yet</h3>
                                    <p>
                                        City offices publish announcements,
                                        vacancies, and service requirements here
                                        as they are issued.
                                    </p>
                                </div>
                            )}
                            <UpcomingEvents events={events} />
                        </div>
                    </div>
                </section>

                {/* Programmes after the news and before the figures: what the
                    city offers, then what the city is. */}
                <CityPrograms programs={programs} />

                {/* The one dark field on the page. These are facts about Tanjay
                    with their census year attached, not counts of what this
                    portal happens to hold. */}
                {city.figures.length ? (
                    <section className="site-section figures-band" id="figures">
                        <div className="wrap figures-band-inner">
                            <Reveal className="figures-intro">
                                <p className="eyebrow eyebrow--on-dark">
                                    The city
                                </p>
                                <h2>Tanjay by the numbers</h2>
                                <p>{city.figures_note}</p>
                            </Reveal>

                            <Reveal as="div" index={1} className="figures-list">
                                {city.figures.map((figure) => (
                                    <div
                                        className="figure-cell"
                                        key={figure.label}
                                    >
                                        <span className="figure-value">
                                            {figure.value}
                                        </span>
                                        <span className="figure-label">
                                            {figure.label}
                                        </span>
                                        <span className="figure-note">
                                            {figure.note}
                                        </span>
                                    </div>
                                ))}
                            </Reveal>
                        </div>
                    </section>
                ) : null}

                {/* The officials after the city's figures and before its
                    records: who was elected, then what they must disclose. */}
                <PublicServants servants={publicServants} />

                {/* Transparency is a legal duty under the Local Government Code
                    and RA 11032, not a site feature, so it gets a named section
                    with the statute cited. What the city has not published yet
                    is stated as a gap instead of hidden. Awards close it: they
                    are evidence about how the city is run, like the records. */}
                {city.transparency.length || recognitions.length ? (
                    <section
                        className="site-section site-section--wine"
                        id="transparency"
                    >
                        <div className="wrap">
                            <Reveal className="section-heading">
                                <div>
                                    <p className="eyebrow">Accountability</p>
                                    <h2>Transparency and public records</h2>
                                    <p>
                                        What the City Government is obliged to
                                        disclose, where to find it, and what is
                                        still being prepared for publication.
                                    </p>
                                </div>
                            </Reveal>

                            <ul className="transparency-list">
                                {city.transparency.map((item, index) => {
                                    const body = (
                                        <>
                                            <span className="transparency-basis">
                                                {item.basis}
                                            </span>
                                            <strong>{item.title}</strong>
                                            <span className="transparency-copy">
                                                {item.description}
                                            </span>
                                            <span className="transparency-state">
                                                {item.available ? (
                                                    <>
                                                        Open
                                                        <ArrowUpRight
                                                            size={15}
                                                            aria-hidden="true"
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock
                                                            size={13}
                                                            aria-hidden="true"
                                                        />
                                                        Not yet published
                                                    </>
                                                )}
                                            </span>
                                        </>
                                    );

                                    return (
                                        <Reveal
                                            as="li"
                                            key={item.title}
                                            index={index}
                                            className={`transparency-item${
                                                item.available
                                                    ? ''
                                                    : ' transparency-item--pending'
                                            }`}
                                        >
                                            {/* Every obligation is pending
                                                while its page is rebuilt, so
                                                this renders as a stated gap
                                                today. The link branch stays so
                                                that setting `href` and
                                                `available` in config/portal.php
                                                is all it takes to publish
                                                one. */}
                                            {item.href && item.available ? (
                                                <Link
                                                    href={item.href}
                                                    className="transparency-inner"
                                                >
                                                    {body}
                                                </Link>
                                            ) : (
                                                <div className="transparency-inner">
                                                    {body}
                                                </div>
                                            )}
                                        </Reveal>
                                    );
                                })}
                            </ul>

                            <RecognitionsStrip recognitions={recognitions} />
                        </div>
                    </section>
                ) : null}

                {/* Last before the hotlines: the ways to reach the city,
                    non-urgent first, then urgent. */}
                <ReportConcern />
            </main>

            <HotlineBand />
            <SiteFooter />
        </>
    );
}
