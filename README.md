# Tanjay City Public Information Portal

The official website of the City Government of Tanjay, Negros Oriental.

Laravel 13, Inertia 3, React 19, TypeScript, Tailwind CSS 4 and PostgreSQL, with Redis holding the public query cache and sessions.

> **This is a rebuild in progress.** The site is currently one page — the public landing page — and has no sign-in. Everything else was removed so each section can be rebuilt deliberately rather than carried over. Seeded sample records are marked as demonstration records in their own text and never appear outside a local environment. Nothing here should be presented as an official city publication until the City Information Office has replaced those records.

## What exists today

One route, `GET /`, served by `App\Http\Controllers\HomeController`, which only assembles props: each database-backed section is read by its own class in `app/Queries/`, cached behind `App\Support\PublicCache`. Sections are listed in page order.

| Section                          | Where its content comes from                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Masthead, identity strip, footer | `config('portal.city')`, shared on every response by `HandleInertiaRequests`                                                                  |
| Primary menu                     | `config('portal.navigation')`, built by `App\Support\SiteNavigation`; an entry with no page yet renders as "Soon"                             |
| Header search                    | the shortcuts, guides, hotlines, notices, programmes and transparency items already on the page — no server route                             |
| Urgent advisory band             | `UrgentAdvisory`: the newest public post flagged `is_urgent` whose `urgent_until` has not passed                                              |
| Banner photographs               | `HeroPhotos`: the `hero_slides` table, ordered by `sort_order` then `id`                                                                      |
| Services shortcuts               | `config('portal.shortcuts')` — each one links to a section of this same page                                                                  |
| How do I… guides                 | `CitizenGuides`: the `guides` table, six, in `sort_order`                                                                                     |
| From the Mayor's Desk            | `MayorsDesk`: the signed `message` on the executive principal's `officials` row, and the `agenda_items` table                                 |
| Latest notices                   | `LatestNotices`: the `posts` table, five newest, published and not scheduled                                                                  |
| What's on                        | `UpcomingEvents`: the `events` table, five soonest that have not ended, beside the notices                                                    |
| City programmes                  | `CityPrograms`: the `programs` table, six, in `sort_order`                                                                                    |
| The city in figures              | `config('portal.city.figures')`, each figure carrying its own source year                                                                     |
| Elected officials                | `PublicServants`: the `officials` table — Mayor, then Vice Mayor, then the council in `sort_order`; a seat with no name is listed by position |
| Transparency obligations         | `config('portal.city.transparency')`; an item with no page yet renders as "Not yet published"                                                 |
| Awards and recognitions          | `Recognitions`: the `recognitions` table, eight, most recent year first                                                                       |
| Report a concern                 | `config('portal.city.contact')` and `config('portal.city.feedback')` (the national 8888 hotline)                                              |
| Emergency hotlines               | `config('portal.city.hotlines')`                                                                                                              |

Every database-backed section renders nothing until it has a published record, so the live page never shows an empty block. Records flagged `is_demo` — the whole of `DemoContentSeeder` — are withheld everywhere except `local` (`App\Concerns\PubliclyListed`); `tests/Feature/DemoContentTest.php` holds that line. The only real person the samples name is the Mayor, whose name is already on the banner plate.

There is no notice detail page, so the landing page **states** each notice rather than linking it, and the controller does not even send a slug. Add the slug back when the route that consumes it lands.

## Running it

### Docker Compose

Requirements: Docker Desktop, or Docker Engine with the Compose plugin.

```bash
cp .env.example .env
php artisan key:generate
docker compose up --build
```

Open <http://localhost:8000>. Compose starts the app, PostgreSQL 17 and Redis 7; database, Redis append-only data and Laravel storage all use named volumes. Load the sample records with:

```bash
docker compose exec app php artisan db:seed
```

Stop with `docker compose down`. Use `docker compose down -v` only when you deliberately want to erase the local database.

### On the host

Requirements: PHP 8.3+, Composer, Node 22+, PostgreSQL and Redis.

```bash
cp .env.example .env            # then point DB_HOST and REDIS_HOST at your local services
composer install
npm install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link         # the banner reads photographs through public/storage
```

Then `npm run dev` in one terminal and `php artisan serve` in another.

**There is no Vite dev server in front of the deployed app.** `php artisan serve` on its own reads the compiled bundle in `public/build`, so a change to anything under `resources/` is invisible until you run either `npm run dev` or `npm run build`.

## How the public data flows

`posts` holds one row per notice — category, title, slug, description, body, requirements, optional poster, publication status and date. `hero_slides` holds one row per banner photograph. Notices, events and programmes each take an optional `poster_path` on the `public` disk; the `HasPoster` trait turns it into the URL the page loads, and the page frames every poster at 16:9, the shape the city's pubmats are made in. The service cards' covers are different: they are the portal's own category art, which states only the card's title and line and announces nothing, so they ship in the bundle from `resources/images/services`. Each shortcut names its cover in `config/portal.php`. Both are owned by the City Information Office, so no copy that an office would have to correct is written into the source.

`Post::publiclyVisible()` is the only gate on readable content, and it is deliberately narrow:

- the status must be `published`,
- `published_at` must be set and already past, so a scheduled notice stays off the site until the city's own release date,
- `is_demo` rows are withheld everywhere except a `local` environment.

Both queries are cached — slides for ten minutes, notices for two. `App\Support\PublicCache` namespaces every key with a single version counter, and the `InvalidatesPublicCache` trait bumps that counter whenever a slide or a notice is saved or deleted, so a correction an office has already made is never served from cache.

## Seeded content

`HeroSlideSeeder` registers photographs that the city has already uploaded to storage; two files in that folder carry another publisher's watermark and are deliberately left unpublished. `DatabaseSeeder` then adds five demonstration notices in `local` and `testing` only. Each one says it is a sample in its own body, not just in the `is_demo` column, because an invented city announcement that escaped into production would otherwise be indistinguishable from a real one.

The sample notices, events and programmes carry sample posters from `database/seeders/assets/posters`, copied to `posters/demo/` on the public disk by `DemoPosters`. They were drawn for these samples: type, flat geometry and Lucide pictograms, with no photographs and no city seal. Each is stamped SAMPLE, says "not an actual announcement" in its footer, and prints no date, because the sample events are re-dated every time they are seeded.

## Design system

Three stylesheets, loaded in this order by `resources/css/app.css`:

- `tokens.css` — every colour, radius, shadow, space step and type step, declared once. Components reference tokens, never raw values. One light theme, deliberately: the seal and the photographed Mayor are fixed light artwork, so a second palette only restated the first with worse contrast on the two things nobody can recolour.
- `base.css` — the reset, typography, focus, the page container, buttons, the eyebrow and republic rule, and the empty state.
- `site.css` — the landing page itself, section by section.

The interface is written in named semantic classes rather than Tailwind utilities, so a class that no component references is dead code. Both stylesheets are kept clean of those; the check is mechanical:

```bash
grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' resources/css/site.css | sort -u | sed 's/^\.//' \
  | while read -r c; do grep -rqF "$c" resources/js resources/views || echo "DEAD $c"; done
```

Accessibility decisions carry their measured contrast ratios in comments next to the values. Keep that habit: the masthead is deep green with white type and gold accents, and several of those pairings sit within a tenth of a ratio point of failing AA.

## Commands

```bash
composer test          # pint --test, phpstan, then php artisan test
composer lint          # pint --parallel, writing fixes
composer types:check   # phpstan, level 7, no baseline
php artisan test

npm run check          # format + lint
npm run check:fix
npm run types:check    # tsc --noEmit
npm run build
```

`composer ci:check` runs the frontend checks and the full PHP suite together. PHPStan has no baseline and no inline suppressions — if it reports something, the type or the code is wrong.

## Reference

`docs/explore-research.md` describes the removed Explore section — PSA barangay names and PSGC codes with their source dates, map tile and routing configuration, and the verification rules that governed which places could be pinned. It is kept as research for when that section is rebuilt and does not describe anything currently in the app.
