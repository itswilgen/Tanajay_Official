# Tanjay City portal — front end

The public site of the City Government of Tanjay. A React 19 + TypeScript
single-page app, built by Vite into a folder of static files and deployed to
Vercel. It holds no database, no session and no secret: everything on the page
comes from one request to the Laravel API in [`../backend`](../backend).

```
          build time                     run time
  frontend/  ──vite build──►  dist/  ──►  Vercel CDN  ──fetch──►  backend /api/home
```

## Running it locally

Requirements: Node 22+ and pnpm.

```bash
pnpm install
cp .env.example .env.local      # then set VITE_API_URL if the API is not on :8000
pnpm run dev
```

The API has to be running too, in a second terminal:

```bash
cd ../backend && php artisan serve
```

That is the address `VITE_API_URL` defaults to, so a fresh clone needs no
configuration to run against a local backend. If the page shows **"The city's
information did not load"** with an address in the technical line, that address
is what it tried and did not reach — start there.

## Commands

```bash
pnpm run dev           # dev server, HMR
pnpm run build         # → dist/
pnpm run preview       # serve dist/ as Vercel will, for checking the real bundle
pnpm run check         # format + lint (warnings are errors)
pnpm run check:fix
pnpm run types:check   # tsc --noEmit
```

`check`, `types:check` and `build` are what CI runs, in that order, in the
`frontend` job of `.github/workflows/tests.yml`. The build is last on purpose:
it is the only one of the three that catches an unresolved import.

## Configuration

One variable, and it is read at **build** time, not run time — the output is
static files with no server to ask. Changing it means a redeploy, not a
restart.

| Variable       | Example                     | Notes                                                                                                                                                             |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `https://api.tanjay.gov.ph` | No trailing slash. Must be https in production: a page served over https cannot fetch over http, and the browser blocks it with nothing on screen to explain why. |

`.env.example` documents it in full. Nothing in a `VITE_*` variable can be a
secret: Vite inlines each one into the shipped bundle, where anyone can read
it.

## Deploying to Vercel

1. **New Project** → import this repository.
2. **Root Directory: `frontend`.** This is the one setting that matters. The
   repository root holds two applications; without it Vercel finds no
   `package.json` and the build never starts.
3. Framework Preset: **Other**. Install, build and output are already pinned in
   `vercel.json` (`pnpm install --frozen-lockfile`, `pnpm run build`, `dist`),
   so there is nothing to type here.
4. **Settings → Environment Variables:** `VITE_API_URL`, set to the deployed
   API. Set it for Production, Preview and Development, or a preview build
   silently falls back to `http://localhost:8000` and the deployed page cannot
   load.
5. Deploy.

### Then allow this site back, on the backend

The site and the API are different origins, so the browser only hands the
response back if the API says it may. In the backend's `.env`:

```dotenv
CORS_ALLOWED_ORIGINS="https://tanjay.gov.ph,https://www.tanjay.gov.ph"
CORS_ALLOWED_ORIGIN_PATTERNS="^https://tanjay-portal-[a-z0-9-]+\.vercel\.app$"
```

The pattern is for Vercel's preview URLs, which change with every deployment
and so cannot be listed. Left unset, `CORS_ALLOWED_ORIGINS` allows every
origin — see the reasoning at the top of `backend/config/cors.php` before
treating that as a bug — but as soon as the live hostname is known, name it.

`GET /api/health` on the backend touches the database and answers 200 or 503;
point Vercel's or the host's monitor at that rather than at `/`.

### What `vercel.json` does

- **One rewrite**, `/(.*)` → `/index.html`. Vercel matches the filesystem
  _before_ rewrites, so real files — `/assets/…`, `/image/…`, `/favicon.ico` —
  are still served as themselves, and only paths with no file behind them reach
  the SPA. That is what makes a deep link work instead of 404ing.
- **Immutable one-year caching** on `/assets/*` and `/fonts/*`. Vite hashes
  every asset filename, so a changed file is a new URL and can never be served
  stale. `index.html` is deliberately not in there.
- **Security headers** on everything: `nosniff`, `SAMEORIGIN`,
  `strict-origin-when-cross-origin` and HSTS.

## Layout

```
index.html                 the document; the two web fonts are linked here
public/                    served verbatim at the root
  image/                   seal, masthead texture, the Mayor's banner plate
  fonts/                   Archivo and Source Sans 3, self-hosted
src/
  main.tsx                 mounts #app in StrictMode
  App.tsx                  the three states: loading, ready, failed
  api.ts                   HomePayload — the contract with the API — and fetchHome
  pages/home.tsx           the landing page, section by section
  components/site/         the sections and the chrome
  images/services/         the service-card covers, bundled and hashed
  lib/                     page data, document title, location, city time
  styles/                  fonts → tokens → base → site → boot, in that order
```

Two things are worth knowing before changing anything:

**`HomePayload` in `src/api.ts` is the contract with the backend.**
`HomeController` sends exactly these keys and `backend/tests/Feature/HomePageTest.php`
asserts the key set, so a field added on one side and not the other is a type
error here rather than a section that quietly renders nothing.

**There is no router.** One page, one request. `src/lib/location.ts` reads the
browser's location through `useSyncExternalStore` so the header can mark the
current item, and every link is a plain `<a>`. When a second page lands, that
is the moment to add a router — not before.

## Why a static SPA, and what it costs

This was an Inertia app rendered by Laravel, and splitting it had a price worth
writing down rather than rediscovering:

- A crawler that does not run JavaScript sees `<div id="app"></div>`. For a
  public information site that is a real regression.
- First paint waits on JS, then on a cross-origin fetch, then on render. The
  loading state in `App.tsx` exists for exactly that gap and is shaped like the
  page it is replacing, which is why the masthead bar in `styles/boot.css`
  carries the city's own colour rather than a grey slab.

Both are fixed by prerendering, not by changing hosts. Until then, the three
states in `App.tsx` — loading, ready, failed — are the whole of the site's
resilience, and the failure screen prints 911 because every city hotline it
would otherwise list arrives in the payload that just failed to load.
