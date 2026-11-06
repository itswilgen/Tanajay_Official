# Source art

The artwork the City Information Office issued, at the size they issued it.
Nothing here is served. It is kept because it is the original: a web file can
be re-derived from one of these, and none of these can be re-derived from a web
file.

It sits outside both deploys on purpose. These nine files are 9MB — the
`Bagong Pilipinas` logo alone is 3MB — and every one of them had been sitting
in the Laravel app's `public/` folder, which meant they were being uploaded to
the host and would have gone to Vercel's CDN, for a page that references none
of them.

## What the site actually serves

`frontend/public/image/`, which is five files and 275KB:

| Served                 | Derived from                 | Why                                                                                     |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| `seal-96.webp` (6.5KB) | `OfficialLogo.png` (1.5MB)   | The seal sits in a 54px slot (44px small, 72px on the failed screen). The PNG is 1254×1254 — a 23× downscale, done on the phone |
| `seal-192.webp` (17KB) | `OfficialLogo.png`           | The 2× file, for a retina screen                                                         |
| `seal-512.webp` (72KB) | `OfficialLogo.png`           | Not the masthead: the watermark behind the figures band, which is drawn at 560px, and the `og:image` |
| `mayor-plate.webp`     | `newTemplate.png` (1.4MB)    | The home banner, 1591×798                                                                |
| `mayor-plate-900.webp` | `newTemplate.png`            | The narrow-viewport banner                                                               |
| `hbg-masthead.webp`    | `hbg.jpg` (708KB, 6000×3000) | Cropped to 2400×480 for a 71px strip, and 5KB instead of 708KB                           |

And the browser icons, in `frontend/public/` rather than `public/image/` because
that is where a browser looks for them without being told:

| Served                        | Derived from       | Why                                                                                      |
| ----------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `favicon.ico` (10KB)          | `OfficialLogo.png` | The tab. Three entries — 16, 32 and 48 — each reduced and sharpened at its own size       |
| `apple-touch-icon.png` (40KB) | `OfficialLogo.png` | An iOS home screen, at 180px: flattened onto white, because iOS composites alpha onto black, with a 6% margin for its corner mask |

Both come from `tools/icons/render_icons.py`. They replaced a `favicon.ico`
with a single 32px entry and a `favicon.svg` that was still the **Laravel
logo** from the starter kit — a red `#FF2D20` monogram serving as the city's
identity in every tab, bookmark and history entry. The SVG was deleted rather
than redrawn: the office issued the seal as a bitmap, there is no vector of it,
and wrapping the bitmap in an `<svg>` would ship a file that claims to scale
and does not.

The rim lettering does not survive a tab, and no filter changes that. The
black band it sits in is about a quarter of the seal's radius, which is 2
pixels at 16px and 4 at 32px. At those sizes the seal reads by silhouette and
colour — yellow rim, green field, red shield — and it is left to do that
rather than being re-cut into something legible. A city's seal is prescribed,
not styled.

There used to be a `seal-256.webp` serving the masthead at 1× and `seal-512.webp`
at 2×. Both were far more detail than a 54px slot can draw — 29KB and 73KB to
fill 54 and 108 pixels. Rendered side by side at the real slot size, the 96px
and the 256px files are indistinguishable. Match the slot, not the artwork.

`mayor-plate.png` is the flattened full-size export of the banner, between
`newTemplate.png` and the WebP.

## Replacing a piece of artwork

1. Put the file the office issued in here, at full size.
2. Export the web file into `frontend/public/image/` — WebP, and no larger
   than the box it goes in.
3. If the proportions have changed, update `--hero-ratio` in
   `frontend/src/styles/tokens.css`. The banner's box carries that ratio and
   the image is laid in with `object-fit: fill`, so a stale value does not
   letterbox — it stretches the Mayor's official portrait. That has happened
   once already, by 13%.
4. If what was replaced is the seal, re-run the two things derived from it:
   the icons, with `tools/icons/render_icons.py`, and the three `seal-*.webp`
   by hand. The icon script refuses a source that is not square rather than
   stretching the seal into an icon canvas.

## Unused

`temp3.png`, `TANJAY_WEB_Template 1.png`, `Supreme_Court_of_the_Philippines.svg`,
`Bagong_Pilipinas_logo.png` and `bagong-pilipinas.webp` are not derived from by
anything on the site today. They are drafts and national marks kept against
needing them; delete them when it is clear they are not wanted.
