# Demonstration snapshot

Regenerates `frontend/public/demo/home.json` and the sample uploads beside it
under `frontend/public/storage`, from a seeded local backend.

A build made with `VITE_DEMO=1` reads that snapshot instead of calling an API,
which is what lets the front end be deployed on its own — before the Laravel
app has a public https address. The reasoning, and why it is a declared flag
rather than a fallback for an API that fails to answer, is in the note on
`DEMO` in `frontend/src/api.ts`.

## Running it

Standard library only — no Pillow, no `cwebp`, nothing to install.

```bash
cd backend
php artisan db:seed --class=DemoContentSeeder   # if the sample set has changed
php artisan serve

cd ..
python3 tools/demo-snapshot/snapshot.py
```

Then rebuild the front end with `VITE_DEMO=1`, and commit both the payload and
the media — they are deployed files, not build artefacts, and nothing in
`.gitignore` covers them.

| Flag             | Does                                                            |
| ---------------- | --------------------------------------------------------------- |
| `--from <origin>` | Backend to read. Default `http://localhost:8000`.              |
| `--dry-run`      | Reports what it would write and prune, and writes nothing.      |
| `--allow-remote` | Permits a non-local backend. Read **Why local only** first.     |

## What it refuses to do

- **A non-local backend**, without `--allow-remote`. See below.
- **A payload that is not the document the front end reads.** The key set is
  checked against `REQUIRED_KEYS`, which is the same exact set
  `HomePageTest` asserts on the backend and `HomePayload` declares on the
  front end. A key added to two of the three and not the third fails here
  rather than shipping a blank section.
- **An empty section.** The point is a page with every band populated, so an
  empty `notices` or `publicServants` means an unseeded or stale database.
- **An upload the backend's disk does not have.** Otherwise the snapshot
  deploys with missing pictures.

It also **prunes**: any file under `frontend/public/storage` the new payload
does not reference is deleted, so a sample that has been removed does not
leave its photograph behind to be served for ever.

## Why local only

What this writes gets committed and published. The records that are safe to
publish that way are the ones `DemoContentSeeder` writes: every one says in
its own copy that it is a sample, and every one carries `is_demo`, which is
also why the API only serves them in `local`.

Pointed at a production backend, this would bake the city's real notices into
a static file that stops updating the moment it is written — so a correction,
a cancelled event or a lifted suspension would stay on the deployed page
looking current. That is worth refusing by default rather than documenting.

## It is a snapshot

It is only as current as the day it was taken, and nothing tells a reader
that but the sample copy inside the records themselves. A build meant to serve
the city's real records leaves `VITE_DEMO` unset and points `VITE_API_URL` at
the deployed API; see `frontend/README.md`.
