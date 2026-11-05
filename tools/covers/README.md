# Sample cover artwork

`render_covers.py` draws the four portrait covers the seeder puts behind the
landing page's "Latest updates" band:

    database/seeders/assets/posters/update-frontliner.webp
    database/seeders/assets/posters/update-market.webp
    database/seeders/assets/posters/update-riverwalk.webp
    database/seeders/assets/posters/update-eservices.webp

Each is 1200x1600 (3:4), in the same palette, type and republic header as the
existing 16:9 demo posters, and **every one is stamped SAMPLE** — they are
demonstration records, not city artwork. Replace them with the City
Information Office's own files rather than editing these.

## Running it

    python3 tools/covers/render_covers.py

Needs [Pillow](https://pypi.org/project/Pillow/) and `cwebp`
(`brew install webp`). The output **is committed**, so this only needs running
when a cover's copy, palette or size changes — commit the regenerated `.webp`
files with the change.

Type is the project's own Archivo and Source Sans 3, read from the woff2 files
in `public/build/assets/` and converted to TTF in `.fontcache/` (gitignored).
That directory is a build artefact, so on a fresh clone run `npm run build`
first, and install `fonttools brotli` for the conversion. Without either, the
script falls back to the macOS system faces and still renders.
