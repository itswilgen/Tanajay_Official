import { ArrowUpRight, Landmark, Lock } from 'lucide-react';
import { useState } from 'react';
import type { HomePayload } from '@/api';
import { useCity } from '@/components/site/city';
import { CitizenGuides } from '@/components/site/citizen-guides';
import { CityHero } from '@/components/site/city-hero';
import { CityPrograms } from '@/components/site/city-programs';
import { CityUpdates } from '@/components/site/city-updates';
import { HotlineBand } from '@/components/site/hotline-band';
import { MayorsDesk } from '@/components/site/mayors-desk';
import { Poster } from '@/components/site/poster';
import { PublicServants } from '@/components/site/public-servants';
import { RecognitionsStrip } from '@/components/site/recognitions-strip';
import { ReportConcern } from '@/components/site/report-concern';
import { Reveal } from '@/components/site/reveal';
import { ServiceGrid } from '@/components/site/service-grid';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { UpcomingEvents } from '@/components/site/upcoming-events';
import { formatCityDate, formatCityDayMonth } from '@/lib/city-time';
import { useDocumentMeta } from '@/lib/document-meta';

/**
 * What the page renders.
 *
 * `HomePayload` is the whole document the API sends and this takes all of it,
 * rather than restating the ten sections it reads: App spreads the payload
 * in, and a list here was one more place a new section had to be added by hand.
 * `name`, `city` and `navigation` are in it too and are reached through
 * `useCity`/`useNavigation` from wherever they are needed, as they always were.
 *
 * `Notice` moved to api.ts with the rest of the contract — it is what the
 * backend sends, not something this file decides.
 */
type Props = HomePayload;

export function Home({
    heroPhotos,
    cityUpdates,
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

    const [lead, ...rest] = notices;
    const leadHasPoster = Boolean(lead?.poster) && !leadPosterFailed;

    // index.html carries a static copy of both, because a crawler reading a
    // client-rendered page never runs this. This keeps the live document true
    // to config/portal.php, which is where the city's own name and tagline are
    // maintained.
    useDocumentMeta({ title: city.legal_name, description: city.tagline });

    return (
        <>
            <SiteHeader />

            <main id="main">
                <CityHero photos={heroPhotos} />

                {/* What the city has done lately, directly under the banner.
                    The band replaced a panel of lead copy and a clock: the copy
                    said what the site is, which the header above already says,
                    and Philippine Standard Time is still on the page in the
                    header strip, where it belongs to the whole site rather than
                    to the banner. */}
                <CityUpdates updates={cityUpdates} />

                {/* Service shortcuts first: most visits start with a task, not
                    with the news. */}
                {shortcuts?.length ? (
                    <section className="site-section" id="services">
                        <div className="wrap">
                            <Reveal className="section-heading" effect="unfold">
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
                        {/* `cascade` is this section's gesture, shared by both
                            of its columns: the notices and the events are two
                            dated lists, and a staggered fall down the page is
                            how a list of dates wants to arrive. */}
                        <Reveal className="section-heading" effect="cascade">
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
                                        effect="cascade"
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
                                            effect="cascade"
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
                            {/* `curtain` is this section's gesture, and only
                                this section's: the band opens from its centre
                                line outwards, which is the one entrance on the
                                page that reads as a stage rather than as paper.
                                It is given to the one dark field for the same
                                reason the dark field exists — this is where the
                                page stops to state something. */}
                            <Reveal className="figures-intro" effect="curtain">
                                <p className="eyebrow eyebrow--on-dark">
                                    The city
                                </p>
                                <h2>Tanjay by the numbers</h2>
                                <p>{city.figures_note}</p>
                            </Reveal>

                            <Reveal
                                as="div"
                                index={1}
                                className="figures-list"
                                effect="curtain"
                            >
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
                            {/* `ledger` is this section's gesture: each row is
                                wiped in from its left edge, the way a line is
                                entered in a register. It suits a list of legal
                                disclosure duties better than any movement
                                would, and the awards strip at the foot of the
                                section shares it. */}
                            <Reveal className="section-heading" effect="ledger">
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
                                            effect="ledger"
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
                                                <a
                                                    href={item.href}
                                                    className="transparency-inner"
                                                >
                                                    {body}
                                                </a>
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

export default Home;
