# Tanjay City Public Information Portal

The official website of the City Government of Tanjay, Negros Oriental.

Two applications, deployed separately:

| Directory                      | What it is                                                                               | Stack                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`backend/`](backend)          | The JSON API. Holds the database, the office's uploads and the public query cache. Serves no HTML. | Laravel 13, PHP 8.3+, PostgreSQL 17, Redis 7                |
| [`frontend/`](frontend)        | The public site. A static bundle, deployed to Vercel.                                    | React 19, TypeScript, Vite 8, Tailwind CSS 4                |
| [`design/source-art/`](design/source-art) | The artwork the City Information Office issued, at full size. Not served.     | —                                                           |
| [`tools/`](tools)              | One-off generators — today, the service-card cover art.                                  | Python                                                      |
| [`docs/`](docs)                | Research kept for sections not yet rebuilt.                                              | —                                                           |

Each application has its own README with its own setup, and they are the ones
to read before changing either:

- **[backend/](backend) — see "Running it" below**, and `backend/composer.json` for the scripts.
- **[frontend/README.md](frontend/README.md)** — dev setup, `VITE_API_URL`, and the Vercel deploy, including the Root Directory setting.

> **This is a rebuild in progress.** The site is currently one page — the
> public landing page — and has no sign-in. Everything else was removed so each
> section can be rebuilt deliberately rather than carried over. Seeded sample
> records are marked as demonstration records in their own text and never
> appear outside a local environment. Nothing here should be presented as an
> official city publication until the City Information Office has replaced
> those records.

## How the two halves meet

The front end makes exactly one request, `GET /api/home`, and renders the
document it gets back. That document is the whole contract:

- `backend/app/Http/Controllers/HomeController` assembles it. Each
  database-backed section is read by its own class in `backend/app/Queries/`,
  cached behind `App\Support\PublicCache`.
- `HomePayload` in `frontend/src/api.ts` types it.
- `backend/tests/Feature/HomePageTest.php` asserts the exact key set, so a
  field added on one side and not the other is a type error in the front end
  rather than a section that silently renders nothing.

Two things cross the boundary and are worth knowing:

**Uploads are sent as paths, not URLs.** The API has no way to know what
address the bundle was served from, so posters and portraits arrive as
`storage/posters/…`; `resolveUploads` in `frontend/src/api.ts` walks the
document and makes every one of them absolute against `VITE_API_URL`.

**Every request is cross-origin.** `backend/config/cors.php` is what lets the
site read the response — set `CORS_ALLOWED_ORIGINS` once the live hostname is
known, and `CORS_ALLOWED_ORIGIN_PATTERNS` for Vercel's preview hosts.

`GET /api/health` touches the database and answers 200 or 503. Laravel's `/up`
is still mounted as the liveness check; `/api/health` is the readiness one, and
it says which of the two failed.

## What exists today

| Section                          | Where its content comes from                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Masthead, identity strip, footer | `config('portal.city')`, sent in the `city` key of every payload                                                                              |
| Primary menu                     | `config('portal.navigation')`, built by `App\Support\SiteNavigation`; an entry with no page yet renders as "Soon"                             |
| Header search                    | the shortcuts, guides, hotlines, notices, programmes and transparency items already on the page — no server route                             |
| Banner photographs               | `HeroPhotos`: the `hero_slides` table, ordered by `sort_order` then `id`                                                                      |
| Services shortcuts               | `config('portal.shortcuts')` — each one links to a section of this same page                                                                  |
| How do I… guides                 | `CitizenGuides`: the `guides` table, six, in `sort_order`                                                                                     |
| From the Mayor's Desk            | `MayorsDesk`: the signed `message` on the executive principal's `officials` row, and the `agenda_items` table                                  |
| Latest notices                   | `LatestNotices`: the `posts` table, five newest, published and not scheduled                                                                  |
| What's on                        | `UpcomingEvents`: the `events` table, five soonest that have not ended, beside the notices                                                    |
| City programmes                  | `CityPrograms`: the `programs` table, six, in `sort_order`                                                                                    |
| The city in figures              | `config('portal.city.figures')`, each figure carrying its own source year                                                                     |
| Elected officials                | `PublicServants`: the `officials` table — Mayor, then Vice Mayor, then the council in `sort_order`; a seat with no name is listed by position  |
| Transparency obligations         | `config('portal.city.transparency')`; an item with no page yet renders as "Not yet published"                                                 |
| Awards and recognitions          | `Recognitions`: the `recognitions` table, eight, most recent year first                                                                       |
| Report a concern                 | `config('portal.city.contact')` and `config('portal.city.feedback')` (the national 8888 hotline)                                              |
| Emergency hotlines               | `config('portal.city.hotlines')`                                                                                                              |

Every database-backed section renders nothing until it has a published record,
so the live page never shows an empty block. Records flagged `is_demo` — the
whole of `DemoContentSeeder` — are withheld everywhere except `local`
(`App\Concerns\PubliclyListed`); `backend/tests/Feature/DemoContentTest.php`
holds that line. The only real person the samples name is the Mayor, whose
name and portrait the city has already published itself.

There is no notice detail page, so the landing page **states** each notice
rather than linking it, and the controller does not even send a slug. Add the
slug back when the route that consumes it lands.

## Running it

Both halves have to be running. The front end's own README covers its side; the
short version is `cd frontend && pnpm install && pnpm run dev`.

### The API, with Docker Compose

Requirements: Docker Desktop, or Docker Engine with the Compose plugin.

```bash
cd backend
cp .env.example .env
docker compose up --build
```

<http://localhost:8000> then answers with the endpoint list. Compose starts the
API, PostgreSQL 17 and Redis 7; database, Redis append-only data and Laravel
storage all use named volumes. Load the sample records with:

```bash
docker compose exec app php artisan db:seed
```

Stop with `docker compose down`. Use `docker compose down -v` only when you
deliberately want to erase the local database.

### The API, on the host

Requirements: PHP 8.3+, Composer, PostgreSQL and Redis.

```bash
cd backend
cp .env.example .env            # then point DB_HOST and REDIS_HOST at your local services
composer setup                  # install, .env, key:generate, migrate
php artisan db:seed             # optional: the demonstration records
php artisan storage:link        # the banner reads photographs through public/storage
php artisan serve
```

`storage:link` is per checkout — the symlink is machine-local and is not
committed — so skipping it 404s every poster the office has uploaded.

## How the public data flows

`posts` holds one row per notice — category, title, slug, description, body,
requirements, optional poster, publication status and date. `hero_slides` holds
one row per banner photograph. Notices, events and programmes each take an
optional `poster_path` on the `public` disk; the `HasPoster` trait turns it
into the path the front end resolves, and the page frames every poster at 16:9,
the shape the city's pubmats are made in. The service cards' covers are
different: they are the portal's own category art, which states only the card's
title and line and announces nothing, so they ship inside the bundle from
`frontend/src/images/services` and are hashed by Vite. Each shortcut names its
cover in `backend/config/portal.php`. Both are owned by the City Information
Office, so no copy that an office would have to correct is written into the
source.

`Post::publiclyVisible()` is the only gate on readable content, and it is
deliberately narrow:

- the status must be `published`,
- `published_at` must be set and already past, so a scheduled notice stays off
  the site until the city's own release date,
- `is_demo` rows are withheld everywhere except a `local` environment.

Both queries are cached — slides for ten minutes, notices for two.
`App\Support\PublicCache` namespaces every key with a single version counter,
and the `InvalidatesPublicCache` trait bumps that counter whenever a slide or a
notice is saved or deleted, so a correction an office has already made is never
served from cache.

## Seeded content

`HeroSlideSeeder` registers photographs that the city has already uploaded to
storage; two files in that folder carry another publisher's watermark and are
deliberately left unpublished. `DatabaseSeeder` then adds five demonstration
notices in `local` and `testing` only. Each one says it is a sample in its own
body, not just in the `is_demo` column, because an invented city announcement
that escaped into production would otherwise be indistinguishable from a real
one.

The sample notices, events and programmes carry sample posters from
`backend/database/seeders/assets/posters`, copied to `posters/demo/` on the
public disk by `DemoPosters`. They were drawn for these samples: type, flat
geometry and Lucide pictograms, with no photographs and no city seal. Each is
stamped SAMPLE, says "not an actual announcement" in its footer, and prints no
date, because the sample events are re-dated every time they are seeded.

## Design system

Five stylesheets, loaded in this order by `frontend/src/styles/app.css`:

- `fonts.css` — the two self-hosted faces, Archivo and Source Sans 3, declared
  before anything sets them.
- `tokens.css` — every colour, radius, shadow, space step and type step,
  declared once. Components reference tokens, never raw values. One light
  theme, deliberately: the seal and the photographed Mayor are fixed light
  artwork, so a second palette only restated the first with worse contrast on
  the two things nobody can recolour.
- `base.css` — the reset, typography, focus, the page container, buttons, the
  eyebrow and republic rule, and the empty state.
- `site.css` — the landing page itself, section by section.
- `boot.css` — the loading skeleton, which is shaped like the page it stands in
  for and carries the masthead's own colour rather than a grey slab.

The interface is written in named semantic classes rather than Tailwind
utilities, so a class that no component references is dead code. The
stylesheets are kept clean of those; the check is mechanical:

```bash
cd frontend
grep -oE '\.[a-zA-Z][a-zA-Z0-9_-]*' src/styles/site.css | sort -u | sed 's/^\.//' \
  | while read -r c; do grep -rqF "$c" src || echo "DEAD $c"; done
```

Accessibility decisions carry their measured contrast ratios in comments next
to the values. Keep that habit: the masthead is an orange gradient with white
type and gold accents, and several of those pairings sit within a tenth of a
ratio point of failing AA.

Source artwork and how to replace a piece of it:
[`design/source-art/README.md`](design/source-art/README.md). Changing the
banner without updating `--hero-ratio` stretches the Mayor's official portrait
rather than letterboxing it; it has happened once, by 13%.

## Commands

```bash
cd backend
composer test          # pint --test, phpstan, then php artisan test
composer lint          # pint --parallel, writing fixes
composer types:check   # phpstan, level 7, no baseline
composer ci:check      # what CI runs

cd frontend
pnpm run check         # format + lint
pnpm run check:fix
pnpm run types:check   # tsc --noEmit
pnpm run build
```

PHPStan has no baseline and no inline suppressions — if it reports something,
the type or the code is wrong. `.github/workflows/tests.yml` runs the two
halves as separate jobs in parallel, so a failure names which one broke.

## Reference

`docs/explore-research.md` describes the removed Explore section — PSA barangay
names and PSGC codes with their source dates, map tile and routing
configuration, and the verification rules that governed which places could be
pinned. It is kept as research for when that section is rebuilt and does not
describe anything currently in the app.
