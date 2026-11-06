#!/usr/bin/env python3
"""
Source of the browser icons in `frontend/public/`.

WHY THIS FILE EXISTS
--------------------
`favicon.ico` and `apple-touch-icon.png` are the city seal at 16, 32, 48 and
180 pixels, derived from the 1254x1254 PNG the City Information Office issued
(`design/source-art/image/OfficialLogo.png`). Committed binary artwork that
nobody can regenerate is artwork nobody can correct, which is the same reason
`tools/covers` exists: when the office re-issues the seal, this is re-run
rather than four files being re-exported by hand from an image editor and
hoped to match.

THE SEAL IS NOT REDRAWN HERE
----------------------------
It is downscaled, and nothing else. The seal is a dense opaque disc — yellow
rim, a black band of rim lettering at about a quarter of the radius, a green
field, a red shield at the centre — and measured against a 16px icon that
lettering band is 2 pixels tall. No filter makes 2 pixels legible, so at tab
sizes the seal reads by silhouette and colour rather than by any letter, and
that is the honest ceiling. The alternative — cutting a simplified mark or a
monogram out of it so something "reads" — would be inventing municipal
iconography, which is the one thing a government site must not do. A city's
seal is prescribed, not styled.

WHAT IS TUNED, AND WHY IT HAS TO BE
-----------------------------------
1. **Unsharp, on colour only.** Lanczos is the right filter for a 78x
   reduction and it still leaves the result softer than an icon wants. The
   pass is mild, scaled by size, and worth about 8% more edge energy at each
   of the three — measured, not assumed. It is applied to the RGB channels
   while the alpha from the clean resize is put back unchanged: sharpening
   alpha would ring the circle's edge, which is the one edge that has to stay
   smooth.

2. **Premultiplied alpha, which on *this* file changes nothing.** Every
   downscale goes through Pillow's premultiplied `RGBa` mode, and it is worth
   saying plainly that it makes no measurable difference to the seal as the
   office issued it: 22.5% of that PNG is transparent black, 76.1% sits at
   alpha 253-255, and only ~1.3% is genuinely part-transparent, so scaling
   the disc's colour by 254/255 is invisible and the transparent region is
   already in premultiplied form. The step is kept anyway, because it is the
   correct way to reduce an image with alpha and a re-issued seal that stores
   straight alpha — white or anything else under its transparent pixels —
   would otherwise pick up a fringe around the rim at 16px, where one pixel
   is a sixteenth of the diameter. It costs nothing to be right in advance.

And one thing left alone: the icons bleed to the canvas edge at 16, 32 and 48,
because the artwork does and because at 16 pixels a margin costs a quarter of
the diameter. `apple-touch-icon.png` is the exception — iOS composites
transparency onto black and masks the corners itself, so that one is flattened
onto white with a small margin for the mask to eat.

USAGE
-----
    /opt/homebrew/bin/python3 tools/icons/render_icons.py
    python3 tools/icons/render_icons.py --dry-run

Requires Pillow. See README.md in this directory.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ModuleNotFoundError:  # pragma: no cover - a missing dependency, not a bug
    raise SystemExit(
        "Pillow is not importable by this interpreter. On this machine it is "
        "installed for /opt/homebrew/bin/python3 — run the script with that, "
        "and note that `-I` hides it (it lives in the user site-packages)."
    ) from None

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "design" / "source-art" / "image" / "OfficialLogo.png"
PUBLIC = ROOT / "frontend" / "public"

# The three a browser actually asks an .ico for. 16 is the tab and the
# bookmark bar, 32 the taskbar and the pinned tab, 48 Windows' shortcut.
# 16 is in here as its own entry rather than being left to the browser to
# derive from 32, which it does with a filter nobody chose.
ICO_SIZES = (48, 32, 16)

# iOS home screen. 180 is the largest any iPhone asks for, and every smaller
# one is downscaled from it by the system.
TOUCH_SIZE = 180

# Room for iOS's corner mask, as a fraction of the canvas. The seal is a
# circle: it touches the mask at four points and needs a little air at them.
TOUCH_MARGIN = 0.06

# Mild, and scaled by size: the smaller the icon, the more of its contrast the
# reduction cost. Radius is in pixels of the *output*, so it has to shrink too.
UNSHARP = {
    16: dict(radius=0.5, percent=90, threshold=0),
    32: dict(radius=0.6, percent=70, threshold=0),
    48: dict(radius=0.7, percent=55, threshold=0),
    TOUCH_SIZE: dict(radius=1.0, percent=35, threshold=0),
}


def reduce_to(source: Image.Image, size: int) -> Image.Image:
    """The seal at `size`, premultiplied through the resize and then sharpened.

    See the note at the top of this file: the sharpening is what you can
    measure, the premultiplying is insurance against a re-issue.
    """
    # Premultiplied, so that nothing under a transparent pixel can bleed into
    # the rim. A no-op on the seal as issued — see above.
    small = source.convert("RGBa").resize((size, size), Image.LANCZOS)
    small = small.convert("RGBA")

    settings = UNSHARP.get(size)
    if settings is None:
        return small

    alpha = small.getchannel("A")
    sharpened = small.convert("RGB").filter(ImageFilter.UnsharpMask(**settings))
    sharpened = sharpened.convert("RGBA")
    sharpened.putalpha(alpha)
    return sharpened


def touch_icon(source: Image.Image) -> Image.Image:
    """The home-screen icon: opaque, on white, with room for the mask."""
    inner = round(TOUCH_SIZE * (1 - 2 * TOUCH_MARGIN))
    seal = reduce_to(source, inner)

    plate = Image.new("RGBA", (TOUCH_SIZE, TOUCH_SIZE), (255, 255, 255, 255))
    offset = (TOUCH_SIZE - inner) // 2
    plate.alpha_composite(seal, (offset, offset))

    # Flattened: iOS ignores alpha and composites what is left onto black.
    return plate.convert("RGB")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render the browser icons from the issued city seal.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would be written, and write nothing.",
    )
    args = parser.parse_args()

    if not SOURCE.is_file():
        raise SystemExit(f"{SOURCE.relative_to(ROOT)} is not there.")

    source = Image.open(SOURCE).convert("RGBA")
    if source.width != source.height:
        raise SystemExit(
            f"The seal is {source.width}x{source.height}, not square. An icon "
            "canvas is square, so this would be stretched or cropped — crop "
            "the source to the seal first."
        )

    ico = PUBLIC / "favicon.ico"
    touch = PUBLIC / "apple-touch-icon.png"
    print(f"from     {SOURCE.relative_to(ROOT)}  {source.width}x{source.height}")
    print(f"icon     {ico.relative_to(ROOT)}  {', '.join(map(str, ICO_SIZES))}")
    print(f"touch    {touch.relative_to(ROOT)}  {TOUCH_SIZE} on white")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return 0

    frames = [reduce_to(source, size) for size in ICO_SIZES]
    # Each entry written at its own tuned size, rather than letting the ICO
    # plugin derive the smaller ones from the largest.
    frames[0].save(
        ico,
        format="ICO",
        sizes=[(size, size) for size in ICO_SIZES],
        append_images=frames[1:],
    )

    touch_icon(source).save(touch, format="PNG", optimize=True)

    for path in (ico, touch):
        print(f"wrote    {path.relative_to(ROOT)}  {path.stat().st_size / 1024:.1f} KB")

    return 0


if __name__ == "__main__":
    sys.exit(main())
