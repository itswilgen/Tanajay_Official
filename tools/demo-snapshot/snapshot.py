#!/usr/bin/env python3
"""
Source of the demonstration payload at `frontend/public/demo/home.json`.

WHY THIS FILE EXISTS
--------------------
The front end deploys on its own. A static host takes it in one command; the
Laravel app behind it needs Postgres, a storage disk and a public https
address, and between the two there is a stretch where the portal is deployed
and has nothing to draw. A build made with VITE_DEMO=1 reads one snapshot of
`GET /api/home` instead of calling an API, so the pages can be put in front of
someone before the backend has anywhere to live. See the note on DEMO in
`frontend/src/api.ts`.

A snapshot nobody can regenerate is a snapshot nobody can correct: the day the
sample set gains a section or the Mayor's office re-issues a portrait, a
hand-saved JSON file would have to be re-saved by hand and the uploads beside
it copied by hand, and the two would drift. So the file is generated from this
script, the script is committed next to it, and the snapshot is refreshed by
re-running it against a seeded local backend.

WHAT IT TAKES, AND WHAT IT WILL NOT DO
--------------------------------------
It reads a *local* backend only, unless told otherwise. What it writes ends up
committed and published, and the records that make a demonstration safe to
publish are the ones DemoContentSeeder writes — each says in its own copy that
it is a sample, and each carries `is_demo`. Pointed at a production API this
would quietly bake the city's real notices into a static file that no longer
updates when they are corrected, which is the one outcome worth refusing by
default.

It also prunes. Every file under `frontend/public/storage` that the new
payload does not reference is deleted, so a removed sample does not leave its
photograph behind to be deployed for ever.

USAGE
-----
    php artisan db:seed --class=DemoContentSeeder   # in backend/, if stale
    php artisan serve                               # in backend/
    python3 tools/demo-snapshot/snapshot.py

    python3 tools/demo-snapshot/snapshot.py --from http://127.0.0.1:8000
    python3 tools/demo-snapshot/snapshot.py --dry-run

Standard library only.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
BACKEND_UPLOADS = ROOT / "backend" / "storage" / "app" / "public"
PAYLOAD = ROOT / "frontend" / "public" / "demo" / "home.json"
MEDIA = ROOT / "frontend" / "public" / "storage"

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0", "[::1]"}

# The contract with App\Http\Controllers\HomeController, which HomePageTest
# asserts as an exact set, and `HomePayload` in frontend/src/api.ts, which the
# compiler holds to the same shape. Listed here so a snapshot taken from a
# half-migrated backend is refused now rather than rendering as a page with
# two missing sections in production.
REQUIRED_KEYS = {
    "name",
    "city",
    "navigation",
    "heroPhotos",
    "cityUpdates",
    "shortcuts",
    "guides",
    "mayorsDesk",
    "notices",
    "events",
    "programs",
    "publicServants",
    "recognitions",
}

# Sections that are a demonstration of nothing when they come back empty. The
# point of the exercise is a page with every band populated, so an empty one
# is a stale or unseeded database rather than a snapshot worth committing.
MUST_NOT_BE_EMPTY = (
    "heroPhotos",
    "cityUpdates",
    "guides",
    "notices",
    "events",
    "programs",
    "publicServants",
    "recognitions",
)

# What the backend's queries prefix every upload with, stated in HomeController
# and relied on by `resolveUploads` in frontend/src/api.ts.
UPLOADS = "storage/"


def fetch(source: str) -> dict:
    request = urllib.request.Request(
        f"{source.rstrip('/')}/api/home",
        headers={"Accept": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status != 200:
                raise SystemExit(
                    f"{request.full_url} answered {response.status}. "
                    "Is `php artisan serve` running?"
                )
            body = response.read()
    except urllib.error.URLError as error:
        raise SystemExit(
            f"{request.full_url} did not answer ({error.reason}). "
            "Start the backend with `php artisan serve` first."
        ) from error

    try:
        document = json.loads(body)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{request.full_url} did not answer JSON: {error}") from error

    if not isinstance(document, dict):
        raise SystemExit("The payload is not an object.")

    return document


def uploads_in(value: object, found: set[str]) -> None:
    """Every `storage/…` path anywhere in the document.

    The whole document is walked rather than a list of the fields that hold
    an upload, for the same reason `resolveUploads` walks it on the front end:
    a list of eight field names is a list that goes silently out of date the
    day a record gains a second image.
    """
    if isinstance(value, str):
        if value.startswith(UPLOADS):
            found.add(value)
    elif isinstance(value, list):
        for item in value:
            uploads_in(item, found)
    elif isinstance(value, dict):
        for item in value.values():
            uploads_in(item, found)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Snapshot a seeded local backend into the demonstration payload.",
    )
    parser.add_argument(
        "--from",
        dest="source",
        default="http://localhost:8000",
        help="Backend origin to read (default: http://localhost:8000).",
    )
    parser.add_argument(
        "--allow-remote",
        action="store_true",
        help="Permit a non-local backend. Read the note at the top of this file first.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would be written and written over, and change nothing.",
    )
    args = parser.parse_args()

    host = urlparse(args.source).hostname or ""
    if host not in LOCAL_HOSTS and not args.allow_remote:
        raise SystemExit(
            f"{host or args.source} is not a local backend. What this writes is "
            "committed and published, and only DemoContentSeeder's records are "
            "safe to publish that way — every one of them says it is a sample. "
            "Pass --allow-remote if you have read why that is the default."
        )

    document = fetch(args.source)

    missing = REQUIRED_KEYS - document.keys()
    extra = document.keys() - REQUIRED_KEYS
    if missing or extra:
        raise SystemExit(
            "The payload is not the document the front end reads.\n"
            f"  missing: {', '.join(sorted(missing)) or 'none'}\n"
            f"  unknown: {', '.join(sorted(extra)) or 'none'}\n"
            "Update REQUIRED_KEYS here, HomePayload in frontend/src/api.ts and "
            "HomePageTest together, or the page ships a blank section."
        )

    empty = [key for key in MUST_NOT_BE_EMPTY if not document.get(key)]
    if empty:
        raise SystemExit(
            f"Empty in this payload: {', '.join(empty)}.\n"
            "A demonstration needs every band populated. Seed the sample set "
            "first:\n"
            "  cd backend && php artisan db:seed --class=DemoContentSeeder"
        )

    referenced: set[str] = set()
    uploads_in(document, referenced)

    sources = {path: BACKEND_UPLOADS / path[len(UPLOADS) :] for path in referenced}
    absent = sorted(path for path, file in sources.items() if not file.is_file())
    if absent:
        raise SystemExit(
            "The payload names uploads that are not on the backend's disk:\n"
            + "\n".join(f"  {path}" for path in absent)
            + "\nThe snapshot would deploy with missing pictures."
        )

    keeping = {MEDIA / path[len(UPLOADS) :] for path in referenced}
    stale = sorted(
        file for file in MEDIA.rglob("*") if file.is_file() and file not in keeping
    )

    serialised = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
    total = sum(file.stat().st_size for file in sources.values())

    print(f"from     {args.source.rstrip('/')}/api/home")
    print(f"payload  {PAYLOAD.relative_to(ROOT)}  {len(serialised) / 1024:.1f} KB")
    print(f"media    {len(sources)} files  {total / 1048576:.1f} MB")
    for file in stale:
        print(f"  prune  {file.relative_to(ROOT)}")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return 0

    PAYLOAD.parent.mkdir(parents=True, exist_ok=True)
    PAYLOAD.write_text(serialised, encoding="utf-8")

    for path, file in sorted(sources.items()):
        destination = MEDIA / path[len(UPLOADS) :]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, destination)

    for file in stale:
        file.unlink()

    # Directories the prune emptied. Left behind they are noise in the tree
    # and, on some hosts, a listable empty path.
    for directory in sorted(MEDIA.rglob("*"), reverse=True):
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()

    print("\nWritten. Rebuild with VITE_DEMO=1 for the demonstration bundle.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
