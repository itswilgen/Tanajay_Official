# Browser icons

Renders `frontend/public/favicon.ico` and `frontend/public/apple-touch-icon.png`
from the seal the City Information Office issued,
`design/source-art/image/OfficialLogo.png` (1254×1254).

## Running it

Needs Pillow. On this machine it is installed for Homebrew's interpreter, and
`-I` hides it — Pillow sits in the user site-packages, which `-I` excludes:

```bash
/opt/homebrew/bin/python3 tools/icons/render_icons.py
/opt/homebrew/bin/python3 tools/icons/render_icons.py --dry-run
```

| Written                 | Sizes          | Notes                                                        |
| ----------------------- | -------------- | ------------------------------------------------------------ |
| `favicon.ico`           | 48, 32, 16     | Each entry reduced and sharpened at its own size             |
| `apple-touch-icon.png`  | 180            | Flattened onto white, 6% margin for iOS's corner mask        |

## What it will not do

**Redraw the seal.** It downscales, and that is all. The seal is a dense
opaque disc — yellow rim, a black band of rim lettering at about a quarter of
the radius, a green field, a red shield at the centre — and that lettering
band comes to 2 pixels at 16px and 4 at 32px. No filter makes 2 pixels
legible, so at tab sizes the seal reads by silhouette and colour, and that is
the ceiling. Cutting a simplified mark or a monogram out of it so that
something "reads" would be inventing municipal iconography. A city's seal is
prescribed, not styled.

**Stretch a non-square source.** It refuses one, rather than squashing the
seal into an icon canvas. Crop the source first.

## The two details that are tuned

**Unsharp, on colour only.** Lanczos is right for a 78× reduction and still
leaves the result softer than an icon wants. The pass is mild and scaled by
size, and it is worth about 8% more edge energy at each of 16, 32 and 48 —
measured, not assumed. The alpha channel from the clean resize is put back
unchanged, because sharpening alpha would ring the circle's edge, the one edge
that has to stay smooth.

**Premultiplied alpha, which changes nothing on this file.** Worth saying
plainly: 22.5% of the issued PNG is transparent black, 76.1% sits at alpha
253–255 and only ~1.3% is genuinely part-transparent, so the premultiplied
route and the straight one agree to the last decimal here. It is kept because
it is the correct way to reduce an image with alpha, and a re-issued seal
storing straight alpha — white, or anything else, under its transparent
pixels — would pick up a fringe around the rim at 16px, where one pixel is a
sixteenth of the diameter.

## No SVG icon

A modern icon set leads with one, and this one cannot: the office issued the
seal as a bitmap and there is no vector of it. Wrapping that bitmap in an
`<svg>` would ship a file that claims to scale and does not, so the set is
`.ico` plus the iOS PNG — which covers every browser, and is smaller than the
fashionable answer.

## What was there before

A `favicon.ico` with one 32px entry, and a `favicon.svg` that was still the
**Laravel logo** from the starter kit: `#FF2D20`, serving as the city's
identity in every tab, bookmark and browser history entry. The 16px entry is
in the `.ico` now because a browser handed only a 32 downscales it to 16
itself, with a filter nobody chose.
