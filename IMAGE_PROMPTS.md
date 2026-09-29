# Image Prompts for Red Top Scoopers LLC (Junk Removal)

Paste these into ChatGPT (or any image generator) one at a time. After each image is
generated, download it, resize/export as needed, and save it into the `images/`
folder using the **exact filename** listed — the site's HTML already references
these filenames, so nothing else needs to change once the files are dropped in.

Style anchor used in every prompt below (repeat this if you regenerate anything
later, to keep the whole set visually consistent):

> Brand palette: deep red #c41e2a, charcoal black #1a1a1a, safety yellow #ffc107,
> off-white #f5f5f0. Bold, clean, modern trade-service branding — think
> professional junk removal / hauling company, not cartoonish. No text baked into
> photo-style images (we add text in HTML). Logo marks CAN include text.

---

## 1. Logo & Brand Mark

**`images/logo.png`** — 512×512px, transparent background, square

> Design a modern, bold logo mark for "Red Top Scoopers LLC," a junk removal
> company. Circular or shield-shaped badge combining a stylized dump truck or
> open pickup truck bed silhouette with a small pile of junk/boxes, in deep red
> (#c41e2a) and charcoal black (#1a1a1a) with a safety-yellow (#ffc107) accent
> stripe or outline. Clean vector illustration style, flat design, no gradients,
> no photorealism, transparent background, works well at small sizes (favicon).
> Confident, trustworthy, blue-collar aesthetic.

---

## 2. Favicons & App Icons

Generate these as simplified crops/versions of the same logo mark (ask ChatGPT to
"simplify the logo mark above for a very small icon, removing fine detail, keeping
just the truck/junk silhouette on a solid charcoal circle").

- **`images/favicon.ico`** — 48×48px (multi-size ICO; export the 512px logo down)
- **`images/apple-touch-icon.png`** — 180×180px, solid background (no transparency)
- **`images/icon-192x192.png`** — 192×192px
- **`images/icon-512x512.png`** — 512×512px

> Take the Red Top Scoopers logo mark (red, charcoal, safety yellow, truck +
> junk silhouette) and simplify it into a clean app icon: bold shapes only, no
> thin lines, solid charcoal (#1a1a1a) background, centered mark, square canvas,
> no transparency, readable at 48×48px.

---

## 3. Social Share Image

**`images/og-image.png`** — 1200×630px

> Wide social-share banner for "Red Top Scoopers LLC — Junk Removal." Charcoal
> black (#1a1a1a) background with a bold red (#c41e2a) diagonal stripe, a
> illustrated or flat-style junk removal truck loaded with furniture/boxes on
> the right side, safety-yellow (#ffc107) accent details. Leave clear open space
> in the upper-left third for a text overlay (added afterward), professional
> hauling/moving-company aesthetic, flat illustration or bold graphic style
> (not a busy photo).

---

## 4. Hero / Header Images

These sit behind page headlines, so keep them a bit dark/moody so white text
stays readable, or plan to darken them further in an image editor.

**`images/hero-home.jpg`** — 1600×900px (landscape)

> Wide-angle action photo, dramatic and slightly moody lighting: a junk removal
> crew in red-and-charcoal branded work shirts loading a couch and boxes into
> the back of an open pickup or box truck outside a suburban Georgia home.
> Overcast or golden-hour light, realistic photographic style, muted color
> grade leaning charcoal/red, safety-yellow gloves or safety vest as an accent.
> No visible text/logos on clothing (we don't have real uniforms yet).

**`images/hero-services.jpg`** — 1600×900px

> Wide photographic shot of an empty, freshly cleared garage or driveway with a
> loaded junk removal truck parked in the background, morning light, clean and
> orderly, red/charcoal/yellow color grading, professional hauling-company
> feel, realistic photo style, no people's faces visible.

**`images/hero-locations.jpg`** — 1600×900px

> Wide photographic shot from inside a moving pickup truck cab looking out at a
> Georgia rural/suburban road at golden hour, conveying "on the way to the next
> job," warm but slightly desaturated toward charcoal tones with a hint of red
> accent lighting, realistic photo style.

**`images/hero-contact.jpg`** — 1600×900px

> Close-up realistic photo of a hand holding a smartphone mid-call, blurred
> background of a driveway with a junk removal truck, warm natural light,
> red/charcoal color grade, conveys "just call or text us," no visible faces.

**`images/about-truck.jpg`** — 1200×800px

> Realistic photo of a clean, well-maintained pickup or box truck with an open
> truck bed loaded neatly with furniture and boxes, parked in a driveway,
> daytime natural light, red and charcoal color grading, professional and
> trustworthy feel, no visible logos/text on the truck (we don't have real
> vehicle wraps yet).

---

## 5. Service Icons

Flat, single-color-ish icon style, transparent background, consistent line
weight across the whole set — generate them together in one prompt if possible
for consistency, or generate one and reference it ("match this exact icon style")
for the rest.

**Base style prompt (use first, for `icon-general.png`):**

> Flat, modern line icon of a generic "junk removal / moving boxes" concept —
> a stack of moving boxes with a small arrow or truck silhouette — single
> color deep red (#c41e2a) linework on a transparent background, rounded
> corners, minimal detail, consistent 3px stroke weight, icon-style (not
> illustration), centered in a 512×512px canvas with padding.

Then for each of the following, prompt: **"Generate a matching icon in the exact
same style, stroke weight, and color as the one above, but showing [X]"**:

- **`images/icon-furniture.png`** — a couch/sofa silhouette
- **`images/icon-appliance.png`** — a refrigerator silhouette
- **`images/icon-garage.png`** — a garage door / storage boxes
- **`images/icon-estate.png`** — a house outline with a checklist or key
- **`images/icon-construction.png`** — a dumpster or wheelbarrow with debris
- **`images/icon-yard-debris.png`** — a tree branch / leaf pile
- **`images/icon-hoarding.png`** — a stack of cluttered boxes with a checkmark (keep
  this one respectful/neutral, not exaggerated or negative in tone)
- **`images/icon-commercial.png`** — an office chair or filing cabinet

Each should export at 512×512px transparent PNG.

---

## Notes

- I deliberately did **not** write prompts for "before/after job photos" or fake
  customer testimonial headshots — presenting AI-generated images as real
  completed jobs or real customers would be misleading advertising. Swap in real
  job photos and real reviews once you have them; the site is built to make that
  an easy drop-in later (just add an image + a `.card` block).
- If you want a mascot-style logo instead of a badge mark (the old site had one),
  add "in a friendly cartoon mascot style, like a construction-worker character"
  to the logo prompt in section 1.
