# BLK Remodelling website: project context

Read this first. It is the running handover between work sessions: what the
site is, how it is built, how assets are produced, what has been decided, and
what is open. Last updated: 2026-09-26.

## 1. The business and the goal

- BLK Remodelling, Ras Al Khaimah (RAK), UAE. Sells 4 packages:
  1. **Pure Furnishing**: furnish an empty apartment.
  2. **Basic Airbnb**: furniture + appliances.
  3. **Complete Airbnb**: everything down to linens, towels, toiletries; rentable day one.
  4. **Complete Renovation**: walls moved, rooms reconfigured. **Flagship, most profitable; the site should funnel people here.**
- Every package should push to booking an appointment (CTAs are WhatsApp links; the number `971500000000` is a **placeholder**).
- Client's vision (from the very first prompt): an editorial, premium, **fullscreen** hero where
  **one studio room transforms stage by stage as you scroll**, with text beside it per package and a button
  to that package's page. This is now largely realised with AI-generated video clips (see §3).
- `BRIEF.md` is the ORIGINAL brief from before the video approach. It is partly outdated
  (it describes 4 separate scenes and a floorplan-only Act 4). This file supersedes it where they differ.

## 2. Files

**Folder layout (reorganised 2026-10-02 so the repo can be pushed; `lab/` alone was 6.4 GB):**

```
index.html          the site
css/  js/           scrollcraft, scroll-sequence, strip-gallery (.css/.js)
assets/img/         stills + thumbnails (were loose in assets/)
assets/frames/      video frames (1,938 files, 180 MB: one file per frame, needed)
assets/gallery/     "Our work" photos
archive/            old page versions (index-corador + 3 backups), paths fixed to ../
docs/               BRIEF.md, POVZETEK_KONTEKSTA.md, old-site text
tools/              Playwright test / screenshot scripts; run from the root: node tools/x.mjs
zazeni-streznik.cmd local server (stays in root, it serves its own folder)
lab/  primeri/  node_modules/   local only, in .gitignore
```
Tracked by git: ~2,000 files, 183 MB, largest file 0.6 MB. No .git folder yet (GitHub Desktop is installed).
Paths in the table below that still say `scrollcraft.css`, `assets/01-…`, `lab/compare.html` etc. now live in
`css/`, `js/`, `assets/img/`, and test scripts in `tools/`.

| Path | What it is |
|---|---|
| `index.html` | The page. Inline `<style>` holds the page-specific CSS; inline scripts at the bottom (package rail highlighter, room-thumbnail lightbox). |
| `scrollcraft.css` / `scrollcraft.js` | Scroll engine from the `nateherk-design:scroll-craft` skill. Pinned acts: `<section data-sc-act="pin" data-sc-span="N">` becomes N×100vh tall with a sticky `[data-sc-stage]`. Also drives `data-sc-in` reveals and `data-sc-drift` page colour. Don't edit unless necessary. |
| `scroll-sequence.css` / `scroll-sequence.js` | **Our own** reusable image-sequence player (no libraries). Three modes, documented at the top of the JS: `data-seq` scroll section, `data-seq-mode="autoplay"`, and **`data-seq-chain`** (the one in use). Includes the scroll assist. |
| `assets/frames/roomN/*.h264` | **What the site plays** (since 2026-09-30): each frame as a single-frame H.264 key frame, decoded by the GPU via WebCodecs. The `.webp` files next to them are the fallback for browsers without hardware H.264 decoding. |
| `assets/frames/room/` | Clip 1 frames, 122 (empty room → bed + armchair). Plays on page load. |
| `assets/frames/room2/` | Clip 2 frames, 121 WebP (bed → styled: bedding, curtains, lamps, wall art). Package 1 → 2. |
| `assets/frames/room3/` | Clip 3 frames, 121 WebP (styled → green wall, wood floor, leather chair, throw, towels). Package 2 → 3. |
| `assets/01-furnishing-{dining,kitchen,bathroom}.webp` (+ `-thumb`) | Package 1 room thumbnails (bottom-right on desktop, top-right on phones); click opens a lightbox. |
| `assets/01-furnishing-bed.webp`, `01-empty.webp`, `02-furnished.webp` | **No longer used** (old hero photos). Kept on request, safe to delete. |
| `assets/05-about.webp` | About section portrait (looks like a placeholder). |
| `lab/` | Screenshots from test runs (many folders), `lab/compare.html` (A/B page: original .mp4 vs website frame, Space flips) and `lab/compare-room3.mp4`. Not part of the site. |
| `package.json` | Only `playwright-core` (used for automated browser tests / screenshots). |

Source videos (outside the project):
- Clip 1: `C:\Users\Kugler\Downloads\empty_room_furnishing_transfor_52805_Kling_25_Turbo_Pro.mp4` (1904×1088, 24 fps)
- Clip 2: `C:\Users\Kugler\Downloads\empty_room_furnishing_transfor_52934_Kling_O3.mp4` (1900×1088, 24 fps)
- Clip 3: `C:\Users\Kugler\Desktop\bedroom_makeover_transformatio_02847_Kling_O3.mp4` (1904×1088, 24 fps)
- Package 1 stills: `C:\Users\Kugler\Desktop\FURNISHING\` (ChatGPT images).

## 3. How the hero works now

- Packages 1–3 sit inside `<div class="pf-room-track">`. Its first child `.pf-room-layer` is a **sticky
  full-screen canvas** (starts under the 4.75rem nav bar) that stays put behind all three packages. The
  package stages are transparent, so only the text scrolls over one continuous room.
- The layer's `data-seq-chain` JSON lists the clips:
  - clip 1 `"play":"load"`: plays once on page load (fps 24, delay 150 ms, starts after the first 40 frames are decoded; reduced motion shows the last frame).
  - clip 2 `"play":"scroll", "from":"#pkg-1", "to":"#pkg-2", "blend":8`
  - clip 3 `"play":"scroll", "from":"#pkg-2", "to":"#pkg-3", "blend":8`
  - "blend" cross-fades the first frames over the previous clip's last frame to hide the tiny seam between AI clips.
- Package spans: pkg-1 = 2, pkg-2 = 2, pkg-3 = 2.6, pkg-4 = unchanged (screens of scroll).
- **Scroll assist** (in `scroll-sequence.js`, "scroll assist" section): the first wheel tick / swipe between
  packages glides straight to the next (or previous) package. Wheel momentum is swallowed during the glide
  and until a new gesture; on touch the finger drags 1:1 and release glides; keyboard/scrollbar get an idle
  fallback. Glide = **3000 ms per package** (`ASSIST_MS_PER_SECTION`, `ASSIST_MAX_MS`), custom `easeGlide`
  curve (starts moving instantly, even middle, soft landing). Off under reduced motion; `data-seq-assist="off"` disables it.
  Client iterated on this: first it felt delayed (fixed by gesture-driven trigger), then too short (0.85 s → 2 s → 3 s).
  **2026-10-02: replaced by "smooth wheel"** (`data-seq-assist="smooth"` on `.pf-room-layer`, `bindSmoothWheel` in
  js/scroll-sequence.js): client said a small scroll slid too far; plain "off" then stuttered badly (each notch
  jumped 100 px in one frame, page still 50/58 frames). Now a notch moves its normal distance eased over a few
  frames (`SMOOTH_WHEEL_TAU` 110 ms; bigger = softer/laggier). Measured with `tools/measure-scroll.mjs`: max
  25 px/frame, 0 still frames, 60 fps. Touch, keyboard, scrollbar stay native.
  **+ Auto finish (2026-10-03, client "make auto finish scroll"):** `bindAutoFinish` (js/scroll-sequence.js): when
  scrolling stops 160 ms part-way between two packages (any input), `glideTo(dest, 'finish')` completes the
  transition in the travel direction (1500 ms per package, 450–1400 ms); under 10% of the way (`FINISH_MIN`) it
  returns instead. New input cancels. Fixed a smooth-wheel bug on the way: the ease never "arrived" (sub-pixel
  steps round to 0), leaving `smoothWheel` true forever. Test: `tools/test-finish.mjs` (server :4500):
  1 notch → back to pkg-1; 4 notches → pkg-2; 2 down from pkg-2 → pkg-3; 3 up from pkg-3 → pkg-2. Also the gallery flick was calmed (dragFriction 0.35, maxFlickSpeed 3, wheelStep 180).
- Text on photos: no box. `.pf-photo-card::before` is a **feathered rectangular frosted glow**
  (82% canvas tint, 24px blur, 2.75rem feather) behind the copy. Client went through box → more transparent → no box → glow → "more of a box, a bit bigger". Keep it.
- Package 4 (Complete Renovation) is still the original design: hand-built SVG floorplan that draws itself
  and moves a wall, "site photo coming soon" card, renovation consult CTA. No video yet. Then about section + footer.

## 3a. Layout change 2026-09-30: the room is a framed picture, not full screen

- Client chose this after comparing: full screen stayed laggy on their laptop (~20 fps), a smaller room looked
  sharper (frames scaled down instead of 1:1) and ran smoother. Now the room sits on the right, ~54vw wide
  (`--room-w/--room-h/--room-top` on `:root`, ≈ 1/3 of the screen), copy on the left (`.pf-side-copy`),
  "clean luxury" minimal: eyebrow `01 · …`, headline, one short line, CTA. Icon rows and the frosted glow
  are gone; package 1 thumbnails are a row under the frame. ≤900px: room full width on top, copy below it.
- Also removed: `data-sc-drift` on packages 1–3 (restyled/repainted the whole page every frame).
- Then restyled "editorial" after the client's print references (magazine spread, FR.NT poster, spec sheet):
  room plate on the LEFT (~58vw), a 4-column meta line above it (`.pf-ed-meta`: Package 0X — name / Ras Al
  Khaimah / BLK Remodelling / 0X / 04), right column `.pf-ed-side` with a medium-weight Geist headline
  (normal case), one line, a Scope/Handover spec table with hairlines, an underlined link CTA, and a huge
  package numeral `.pf-ed-num` whose bottom sits on the plate's bottom edge. Caption under the plate.
- Client found that editorial version too "techy" (grids, tables, grotesk, numerals). **Current design** (ref:
  "Corador" print page): soft ivory `--sc-canvas #ECE7DF`, **Cormorant Garamond** (`--pf-serif`) for header,
  rail and packages; each package is a centred cover `.pf-cover`: small spaced kicker "Package One", the
  package name in large spaced serif caps, one short line, an italic underlined link; the room is centred
  below (`--cover-pad/--cover-h/--room-*` vars), pkg-1 thumbnails in a column right of the picture.
  Package 4, About and footer still use the old Archivo/blueprint styling: next to restyle if approved.
- Backups: `lab/index.before-half-layout.html` (full screen), `lab/index.editorial-v1.html` (editorial).
- **Now trying (2026-09-30): "catalogue spread"** (ref: ferm LIVING catalogue): room = left page, full height
  under the nav (`--spread-img-w/-h`, cropped with `data-seq-focus="0.62"` on the layer, new in
  scroll-sequence.js); each package = right page `.pf-page`: running line, serif caps title + italic subtitle,
  3 short sections (The package / Included / Handover), italic link, aside with a colour **palette** of
  swatches sampled from the clip's end frame, pkg-1 room thumbnails under "Also in the studio".
  The previous centred "Corador" version is kept as a working page: `index-corador.html`.
- Phones (≤900px) use a "catalogue cover" (ref: a "Products Catalog" cover): big mixed-case serif title top
  left, one word per line, circled package number `.pf-page__num`, spaced caps subtitle, Included/Handover
  notes right-aligned, italic link, room fills the bottom `--m-img-h: 44svh` edge to edge; pkg-1 thumbnails
  on the picture's bottom-left; no palette on phones.
- **Then stripped to the minimum** (client: "too tacky, unneeded lines, 02 labels"): header has no bottom rule
  and "Book a Visit" is plain text; each right page = title (spaced serif caps), italic line, one sentence,
  a spaced-caps text link (no underline), pkg-1 thumbnails without labels. Phone = mixed-case title one word
  per line, small caps line, link, room fills the bottom 46svh. Removed: running line, sections, palette,
  circled numbers, right-aligned notes, thumbnails on phone.
- **Text no longer scrolls over the room**: `.pf-page` is `position: fixed`; a small script at the bottom of
  index.html marks the package section nearest the scroll position `.is-current` (swaps halfway between
  packages; package 3 holds until package 4 fills half the screen; none on package 4). The current page is
  revealed left to right with `clip-path` (1.2 s), the leaving one fades. Package names are on one line
  (`white-space: nowrap`). Phones use **Inter Tight** (ref "QUIET CONFIDENCE / Danish Design"): bold caps title
  sized `min(2.6rem, (100vw - 2*gutter)/9.6)` so "COMPLETE AIRBNB" fits, regular subtitle; desktop stays serif.
- **Update:** phone font now Inter Tight **300** (client: bold killed the luxury feel), title sized
  `(100vw - 2*gutter) / 11.7` so "COMPLETE RENOVATION" fits one line. Text change is now a slide: the old page's
  lines slide off to the right and fade (`.is-leaving`, 650 ms), the new ones slide in from the left, staggered.
- **Package 4 now has its video** (clip 4, `assets/frames/room4/`, 121 frames, from
  `C:\Users\Kugler\Desktop\bedroom_makeover_transformatio_65130_Kling_O3.mp4`, 1916x1080 → `scale=1930:1088,crop=1904:1088`
  + the grade). pkg-4 moved inside `.pf-room-track` (span 2.6; pkg-3 now 2) with the same `.pf-page` layout;
  the old floorplan/blueprint design is gone from index.html (still in `index-corador.html`). Text leaves
  when the About section fills half the screen. Seam clip3→clip4 SSIM 0.95 + blend 8.
- Desktop, package 4: the room widens to 62vw (`html.room-wide`, toggled by the current-package script,
  0.9 s width/left transition; scroll-sequence.js now has a ResizeObserver on the canvas so the buffer
  follows). The old SVG floorplan is back under pkg-4's text (`.pf-page .pf-plan-wrap`, no card); it draws
  itself on arrival: `--sc-p` there is fed by an animated `@property --plan-p` (0→1 over 3.4 s) instead of
  scroll. Hidden on phones.
- Black flash when the room widened (fixed): Chrome showed the opaque canvas black for a few frames when it was
  resized or re-layered. Now the canvas is always `--room-max-w` (62vw desktop) inside `.pf-room-frame`; the
  widening animates only the frame's `clip-path` and the canvas `transform` (focus 62%), and the canvas has
  `will-change: transform`. Verified with a CDP screencast of every frame: 0 dark frames (was 4–30).
  Also: the current-package script ran before scrollcraft set section heights, so sometimes no package
  was current on load (no text); it now re-checks on `load` and via a ResizeObserver on `<main>`.
- Desktop package text now uses the same **Inter Tight 300** as phones (title caps on one line,
  `clamp(1.5rem, 0.4rem + 2vw, 2.5rem)`, fits "COMPLETE RENOVATION" at 1280/1536/1920 incl. the narrowed
  pkg-4 page; subtitle 1.35rem regular-case; link 0.7rem spaced caps). Header/nav stay in Cormorant.
- **Room views replace the lightbox**: thumbnails under each package switch what the LEFT page shows (script
  "Room views"; details in the TV-view note below). Active thumb = full opacity + aria-pressed. The
  current-package script dispatches `pf:current`. `.pf-lightbox` CSS is now unused.
- **TV-corner view is a second scroll chain and the chosen view is remembered** (client: "I don't want to
  switch to TV view every time I scroll a package"). `.pf-tv-view` inside `.pf-room-frame` is another
  `data-seq-chain` (`data-seq-lazy`, `data-seq-assist="off"`, focus 0.7): tv1 dining (`"play":"manual"`, rests on
  its end frame), tv2 pkg-1→2 (curtains, TV, art), tv3 pkg-2→3 (wood floor, green chairs, plants, blend 8), tv4
  pkg-3→4 (renovation pull-back; source 1660x1244, the middle band `crop=1660:936:0:154` continues tv3, blend 8).
  Frames in `assets/frames/tv1..tv4/` (h264 + webp, graded, fit to 1904x1088, ~54 MB h264 total), downloaded only
  after a TV thumbnail is hovered/picked. Sources on the Desktop: `..._45631_` (dining), `..._34934_`,
  `..._23333_`, `..._68891_Kling_O3.mp4`. Seams SSIM 0.99 / 0.99 / 0.96.
  Thumbnails: `data-view="bedroom"` / `data-view="tv"` (Dining in pkg-1, TV corner in 2–4) / `data-full` photos
  (kitchen, bathroom; cleared on package change). Picking TV adds `html.view-tv` (0.7 s cross-fade), calls
  `.__seq.playClip(package index)` so that package's transition plays once in place (waits until the clip is
  downloaded; cancelled as soon as the visitor scrolls on), and after the fade `setActive(false)` on the hidden
  chain. All rows mark the current view. New player API in scroll-sequence.js: `start()`, `setActive()`,
  `playClip()`, `"play":"manual"`. Thumbs: `0N-bedroom-thumb.webp`, `01-dining-end-thumb.webp`,
  `0N-tv-end-thumb.webp`. Also on phones (since 2026-09-30): the thumbnail row sits under the link (3.4rem thumbs); over a LAN IP the TV chain uses the WebP frames (no WebCodecs on plain http), tested.
- **Margin around the picture** (client: not to the left/bottom edge): `--room-inset` (desktop
  `clamp(1rem, 2.2vw, 2.25rem)` on left, top and bottom; phone = `--sc-gutter` on left, right and bottom).
  The picture's own sizes are `--view-left/-top/-w/-max-w/-h` (derived from `--spread-img-w`, `--room-max-w`,
  so `html.room-wide` still widens it); `.pf-room-frame`, the canvases and `.pf-room-view` use them.
- **Colour grade baked into all frames** (h264 + webp), because the raw Kling colours (turquoise sea, stark
  white) clashed with the soft page. ffmpeg filter used before encoding (see §4 commands):
  `huesaturation=saturation=-0.7:colors=c+b:strength=1,eq=saturation=0.8:contrast=0.9,colorbalance=rs=0.02:bs=-0.03:rm=0.02:bm=-0.025:rh=0.035:gh=0.015:bh=-0.035,curves=all='0/0.05 0.5/0.49 0.85/0.8 1/0.92'`
  **Replaced 2026-10-03** (client: videos didn't match the cool palette): all 8 clips re-exported from the
  Desktop sources by `tools/grade.ps1` (`-Test` = comparison frames only) with a near-original grade (turquoise
  tamed toward smoke grey, saturation 0.9, contrast 0.97, darks slightly mahogany, whites to greige). No CSS filter
  or tint on the room/canvas/frame thumbs any more (only on photos: `.pf-room-view--still`, `.pf-room[data-full]`,
  `.pk-extra img[src*="/img/"]`). View thumbs regenerated from the new end frames. Seams SSIM 0.94–0.99.
- Screenshots for the client are in `primeri/` (`corador-*`, `katalog-*`, `clean-*` = current).
- `zazeni-streznik.cmd` (double-click): starts the server if needed and prints the phone URL
  (http://<LAN IP>:4500; the IP changes per network, was 192.168.178.29 on 2026-09-30). Over plain http
  on a LAN IP WebCodecs is unavailable (secure context only), so phones there use the WebP frames.
- Performance note: on battery the laptop/Chrome caps at exactly 30 fps (worst frame 34 ms) for every
  layout; measure on mains power. Likely why the client saw ~20 fps.
- `?fps` in the address shows a corner readout (fps, worst frame, GPU video vs images).
- Measured in headed Chrome at the client's size: ~58–60 fps during a glide.

## 3o. Reviews + black and white collage (2026-10-03)

- `#reviews` is now `.pf-reviews`: a column against the left edge with three equal photos (gallery 03-studio-living,
  26-master-bedroom, 31-living-room; `grayscale(1) contrast(1.06)`), each a third of the screen height at ~0.85
  ratio (`--pic-h`), 4px gaps, sticky under the header; the six reviews (unchanged) in the 3-col grid beside it.
  Phone: the three photos in a row on top (3:4), reviews below. Check: `tools/shoot-reviews.mjs`.
  **Photos replaced (client):** construction "during" shots from Downloads: `assets/img/reviews-1-demolition.webp`
  (20250505_150403, the Drive link), `reviews-2-wall.webp` (20250509_115718), `reviews-3-bathroom.webp`
  (20250509_115814); converted to grayscale at 900px. Unused from the same set: 20250509_115734 (blockwork wall).

## 3n. Flow spread replaces #why + interlude + #what-we-do (2026-10-03)

- Client: sections should not read as separate slides; the photo stays and only the text changes (refs Armani
  Hotels, "Between Feeling", Oliver Du Puy). `section.pf-flow`: left 56% = two chapters `article#why` and
  `article#what-we-do` (ids kept for scripts/tests), each ~a screen tall: kicker, Bodoni title, then small
  label/text columns (`.pf-flow__cols`, labels "Booking", "We know", "Feel right" are Claude's); right 44% =
  `.pf-flow__media`, sticky under the header, plant ↔ lamp cross-fade (opacity + settle from scale 1.04) when a
  chapter crosses mid-screen (script "Flow", IntersectionObserver). Phones: no sticky photo; each chapter shows its
  photo inline (square, max 58svh, full bleed). All text verbatim from before. Backup: archive/index.before-flow.html.
  Check: `tools/shoot-interlude.mjs` (now shoots the flow). The 3m interlude below is replaced.
  **Revised same day (client didn't like the big sticky photo):** no sticky media; two SMALL photos placed
  absolutely in different spots: plant top-right of #why (~19vw, 3:4), lamp lower and further in on #what-we-do
  (right 24vw, bottom, ~14vw, 4:5). Text column max 54vw. Phone: photos inline after the text, plant right 56%,
  lamp left 46%. The "Flow" cross-fade script stays but does nothing (no .pf-flow__media).

## 3m. Interlude between #why and #what-we-do (2026-10-03)

- `.pf-interlude`: two photos, no text, 12-col grid: plant (`assets/img/interlude-plant.webp`, from Desktop\
  713EDCEE-….PNG) cols 2–6 at 3:4; lamp (`interlude-lamp.webp` = the old About lamp) cols 8–11 at 4:5, pushed down
  ~28vh. Phone: overlapping (plant left 8 cols, lamp right 7 cols, -6rem). Photo filter applied. The client's own
  attachments were a duplicate screenshot, so these two were chosen by Claude: swap if the client sends others.
  Check: `tools/shoot-interlude.mjs`.

## 3l. About tweaks (2026-10-03)

- "Branka" overlay on the photo removed (client). About text now styled like the rest (type.css: labels = tiny
  muted spaced caps 0.7rem; body 1rem / 1.7, muted; services 1rem).

## 3k. Pricing removed (2026-10-03, client)

- First the three per-m² tiers, then the whole `#pricing` section (heading, AED 49,500 / 63,000 examples, Ask for a
  quote) were removed. No prices on the site now. `.pf-tier*` / `.pf-example*` CSS is unused. Renovation package
  page no longer links to "price ranges". Test scripts updated (no 'pricing' id).

## 3j. Serif type + cool palette (2026-10-03, replaces 3h Inter Tight)

- Client refs "Content by Kenna", "Rowen" (type) and "Smoke #D1D1CC / Mahogany #351D14", grey-tile bathroom (colour).
- Fonts: **Bodoni Moda** (headlines, logo, figures, prices; wide caps) + **Cormorant Garamond** (everything else;
  italic for accent words, tiny spaced caps for labels). Variables `--pf-display`, `--pf-text` in site.css; the
  old names point to them. `css/type.css` sets ALL text to Cormorant with !important (incl. the About sheet, which
  was IBM Plex Mono) and Bodoni for the listed headline classes. Inter Tight + Plex Mono no longer loaded.
  Old sheet: `archive/type.inter.css`.
- Palette: canvas #E3E1DB, surface #EDECE8, ink #2B221E, muted #7D7872, line #BEBAB2, accent = floor = mahogany
  #351D14, accent-soft #98928A, photo tint rgba(110,106,98,.05). Hardcoded #F4EDE1 → var(--sc-surface).
  Intro picture edge #DDD1C4 unchanged (part of the client's image).
- Bodoni hairlines vanish in downscaled screenshots: judge at full size.

## 3i. About = studio sheet (2026-10-03, replaces the square panel)

- Client reference "Form & Sight" copied 1:1: light sheet (`--sc-surface`), all text in **IBM Plex Mono 400**
  (only this section; loaded in the Google Fonts link). 4-column rows (21% · 33% · 21% · rest): Studio / RAK live
  time (`.pf-about-time`, Intl, Asia/Dubai, script before strip-gallery.js) / Location / Contact; big gap; About us ·
  Branka · Role · Founder, B&B Remodeling. Body: photo `05-about-branka.webp` left 54%, aspect 0.865, bottom-anchored
  (only top of wall trimmed), "Branka" in white over it; right: Description (all of Branka's text verbatim incl. the
  closing "Because…" line), Services = 4 package links, → arrow bottom-right = Calendly.
- The brown closing band and the lamp picture are gone. Backup: `archive/index.before-about-sheet.html`.
  Check: `tools/shoot-about-panel.mjs` (clock, photo, font).

## 3h. One typeface: Inter Tight (2026-10-03, client reference: Saint Laurent lettering)

- All fonts are Inter Tight (closest web font to Helvetica Neue). `css/site.css` `:root`: `--pf-sans`, and
  `--pf-serif`, `--sc-font-display`, `--sc-font-text` all point to it (old rules keep working). Google Fonts link
  loads only Inter Tight 300–700 (Cormorant, Archivo, Geist dropped) in index.html and the package build script.
- `css/type.css`, loaded LAST (after the inline style in index.html; after package.css on package pages): headlines
  600 caps, tight negative tracking, smaller sizes than the old serif; labels 600–700 small caps; body 300–400.
  No italics anywhere (`font-style: normal !important` for em/blockquote/etc.), accent words keep their colour and
  follow the headline's caps. Tier prices `nowrap` (bold digits are wider). Check: `tools/shoot-type.mjs`
  (reports rendered font families and italic count: must be only "Inter Tight", 0 italics).
- The intro picture's lettering is part of the image (serif) and is unchanged.

## 3g. About as a framed square panel (2026-10-03)

- Client reference: a dark square print layout. `.pf-about-panel`: square `--side: min(100vw - 2*gutter,
  100svh - 10rem, 62rem)`, warm near-black #2C2622, 1px `--pf-line` outline with offset (the frame). Left column
  (42%) = two stacked pictures: Branka `assets/img/05-about-branka.webp` (from Desktop\IMG_2172 (1).jpeg, the large
  4284×5712 original; shown whole at 3:4, no filter) and the lamp `assets/img/05-about-lamp.webp` (from Desktop\
  05948C96-….PNG) laid absolutely into the rest (cropped, object-position 50% 30%) so it never stretches the
  square. Right side empty; text in the bottom corner: "About us" kicker, title in Cormorant caps, Branka's three
  paragraphs (verbatim, original order; the old "02 My approach" row is merged in), Book a session link.
  Closing brown band unchanged. ≤900px: stacked (photo, lamp 4:3, text). Backup: archive/index.before-about-panel.html.
  Check: `tools/shoot-about-panel.mjs`. Old `05-about-sofa.webp` no longer used.

## 3f. Editorial refinement (2026-10-03, client brief "quiet luxury, editorial, warm stone")

- Backup of the state before: `archive/before-editorial/` (index.html, site.css, package.css, intro.css).
- **Palette tokens** in `css/site.css` `:root`: canvas #E8E1D7, surface #F1ECE5, ink #28231F, muted #81786F,
  line #B7ADA1 (`--pf-line`), accent #5A372A, accent-soft #928474 (`--pf-accent-soft`); hairlines derived from line.
  The intro veil uses `--sc-canvas`, so it follows automatically (no colour jump).
- **Photo treatment** tokens `--pf-photo-filter` (saturate .78, contrast .96, brightness .98) and `--pf-photo-tint`
  (rgba(120,102,84,.05), as `::after` over `.pf-room-frame` and gallery tiles). Applied to the room, views,
  thumbnails, gallery + lightbox, package-page images. NOT the About portrait (client wants it unfiltered).
- Home package text: name = small Cormorant caps label; statement (`.pf-page__sub`) = large Cormorant 300, the
  strongest element; supporting line small and muted; links muted small caps with a drawn 1px hover line;
  block offset to the upper part (`align-items: flex-start`, top padding ~15vh). Room 47vw (was 50vw).
  Views: 4:3, larger, wider gaps, no rounding, hover = opacity + slight zoom inside. Kept 4 (each is a view).
- Header: logo 0.95rem/0.18em, rail 0.76rem/0.12em in accent-soft, active = ink only.
- Dock + package-page buttons: 2px corners (no pills), 2.6rem tall, no shadow; Book = accent, Get in touch =
  surface + 1px line. Package page title reduced. Phone: room `--m-img-h: min(52svh, 100svh - 4.75rem - 19rem)`.
- Check: `tools/shoot-editorial.mjs`.

## 3e. Intro (added 2026-10-03)

**Current version (2026-10-03, last): the client's picture.** `assets/img/intro.webp` (from Downloads\
"Minimalistična bež eleganca z grbom.png", 1884×835; the text "WE SEE WHAT IS POSSIBLE" and the crest are IN the
image). 3 s total, then the page (client: "3 seconds, no more"): picture fades in (0.8 s); blurred copies of the
picture cover the text and crest with feathered masks (hard clip boxes showed as rectangles) and are wiped
left→right (text, `@property --pf-wipe`, soft 7% edge) / faded (crest); at 3.0 s `reveal()` releases the room,
removes `intro-on` and adds `.is-out`: the words blur back (covers fade in 0.9 s), the picture scales to 1.035 and
the overlay fades over 1.8 s on an even curve (client: "slowly dissolve into nothing"). Opacity only, no
full-screen blur (would stutter on Iris Xe). Screenshots lag ~0.5 s each, so check timing by measuring opacity, not
by frames. Text/crest positions are % of the image (in the css comment). Portrait
screens: picture 275vw wide so the text fits, top/bottom masked into #DDD1C4 (the image's edge colour).
The head script preloads the picture. Everything below about the window-opening transition is the OLD version.

- Home page only: `css/intro.css`, `js/intro.js`, markup `.pf-intro` at the top of `<body>`, and an inline switch
  in `<head>` that sets `<html class="intro-run intro-on" data-seq-hold>` before the first paint.
- Shown once per browser tab (sessionStorage `pf-intro-seen`), not under reduced motion, not when the address has
  a #section; `?intro` forces it. Click / key / wheel / touch skips (page shown ~1.8 s later). Safety: the head
  script releases the page after 9 s if the intro never finishes.
- **Layout after the client's reference (a brand-guideline cover, 2026-10-03):** tiny Inter Tight caps top-left
  "BLK Remodelling" and top-right "Ras Al Khaimah · UAE"; centre title "WE SEE WHAT IS POSSIBLE" (client's text,
  Cormorant 400 caps, tight spacing, ~2.3rem max) with two tiny lines under it "From empty shell / to rental-ready";
  bottom-centre sentence "We furnish, equip and rebuild apartments in Ras Al Khaimah, from the first visit to the
  keys. Scroll to see what we do." The small texts are Claude's suggestions (no "10 years" claim: not verified).
  Background kept the page ivory so the opening stays seamless. Letters are grouped per word (`.pf-intro__word`).
- Sequence (measured, ms from page start): ~1100 the line writes in letter by letter (rise out of blur) · ~4600
  letters lift away (`animation-fill-mode: both` matters, see css comment) · ~6000 a 1px slit across where the
  text was opens as an even-odd `clip-path` window on the ivory veil into the room frame (from
  `--view-left/-top/-w/-h`) and fires `seq:release`, so clip 1 (bed appears) starts only now (hold in
  `startLoadClip`, js/scroll-sequence.js) · ~7300 `intro-on` removed: header, dock and package 01's text come in,
  veil fades · ~8200 done.
- First version (2026-10-03, replaced the same day): logo slot + "La Casa Branca" + hairline + "Remodeling".
- Tests: `tools/shoot-intro.mjs` (frames + skip + once-per-tab), `tools/time-intro.mjs` (phase times,
  `window.__pfIntro.log`).

## 3d. Package pages (added 2026-10-02)

- `packages/pure-furnishing.html`, `basic-airbnb.html`, `complete-airbnb.html`, `complete-renovation.html`.
  **Generated** by `tools/build-packages.mjs` (all copy is in its `PACKAGES` array): edit there, then
  `node tools/build-packages.mjs`. Style: `css/package.css` (About-section language: "01 —— …" labels, Cormorant 300
  with an italic accent word, Inter Tight 300, hairlines).
- Sections: hero (name, lead line, intro, Book a session + Ask on WhatsApp, the finished room = clip's last frame)
  · 01 What's included (numbered list + "Not in this package" linking up to the next package) · 02 Who it's for
  (3 columns) · [Complete Airbnb only: +20% / +50% / 200+] · Before & after (clip first/last frame + extra views)
  · How it works (4 steps) · Next package (Renovation links back to Complete Airbnb) + "All four packages".
- Tried and reverted (client): sorting the PICS photos per package from what they show. The client said the
  sorting was wrong; the package pages show no gallery photos. Don't guess package membership from photos.
- Copy is a draft from the package definitions, the old BB site and the home page: no prices, no timelines.
  Assumptions to confirm with the client: Basic includes TV + AC service; Complete includes photo shoot and help
  finding a host; Renovation handles permits and links to the per-m² prices on the home page.
- Home page: each package's text now has "More about the package →" (to its page) + "Ask on WhatsApp" (number
  chooser with a package message). The old placeholder WhatsApp links (971500000000) are gone from the packages.
- **Shared chrome moved out of index.html** into `css/site.css` (palette, header + rail, dock, number chooser,
  footer) and `js/site.js` (number chooser). Both pages types load them. Backup: `archive/index.before-site-css.html`.
  `.site-bar` now has `min-height: 4.75rem` (it had been set by the removed "Book a Visit" button).
- Tests: `tools/shoot-packages.mjs` (all pages, desktop + phone, broken images, chooser, home links),
  `tools/shoot-package-phone.mjs`.

## 3c. Content from the old site (added 2026-10-02)

- lacasabranca.com = the family's old site "BB Remodeling" (Branka, +971 545979814, branka.kugler@gmail.com).
  Its full text is in `lab/lcb-text.txt` (scraped with `lab/scrape-lcb.mjs`). Backup before this change:
  `lab/index.before-content.html`.
- New `.pf-story` sections between `.pf-room-track` and About: `#why` (two seconds to convince), `#what-we-do`
  (+20% / +50% / 200+ and the turnkey text), `#reviews` (6 testimonials, grammar lightly fixed, old brand name removed),
  `#pricing` (two studio examples + Total / Premium / VIP Make Over per m², sq ft, EUR), `#apartments` (13 units
  in Pacific, Bab Al Bahr, Bahar 4). About text shortened to fit above the portrait's head; phone + email in the footer.
- `.pf-story` has a canvas background and z-index above `.pf-page`, so it slides over the sticky room and
  package 4's fixed text like a curtain. The current-package script now hides the text when `#why` is half up.
- Open with the client: prices are from 2020; how the 3 make-over levels map to the 4 packages; apartment
  availability (old site was unclear, now "Check availability" link); whether +971 545979814 replaces the
  WhatsApp placeholder.
- **About restyled (2026-10-02)** after refs "Audrey" (split photo/text, thin serif caps with italic words) and
  "Oura & Co." (dark brown block): `.pf-about-split` = portrait left edge to edge (no fades), right column kicker +
  Cormorant 300 caps title + Inter Tight 300 body (Branka's own text, verbatim); last line in `.pf-about-close`, a
  floor-brown band that runs into the footer. Cormorant 300 + italic 300 added to the font link. Phone: photo on top (4:5).
  Text says "B&B Remodeling" (client's wording), not BLK: ask.
  **Re-done 2026-10-02 (ref: "Audrey" about page):** `.pf-about-hero` = text left ("01 —— About us" label,
  Cormorant 300 mixed-case title with the italic word in `--sc-accent`, first paragraph, underlined "Book a session →"
  to Calendly), photo right against the right edge. **Never cropped** (client): shown whole at its own 3:4, max height
  `100svh - 10rem` so it fits on screen. No filter: a gentle warm one was tried and the client wanted the original back. Check: `tools/shoot-about-photo.mjs` (displayed aspect = file aspect). New photo
  `assets/img/05-about-sofa.webp` (from Downloads\IMG_2172.jpeg, 1500×2000). `.pf-about-row2` under a full-width
  hairline: "02 —— My approach", "Every project is *personal* to me." + vertical rule + the other two paragraphs
  (Branka's text verbatim, only split). Old `05-about.webp` no longer used.
- Footer icons linked: Instagram `bnb_remodelling_apartments`, Facebook profile id 61593609083694, WhatsApp wa.me/971545979814.
- **Contact dock** `.pf-dock` (fixed, bottom, every page position): "Get in touch" = `tel:+971545979814`,
  "Book a session" = `https://calendly.com/blkremoddeling/30min` (tracking params from the IG link removed).
  Desktop: centred pair; ≤600px: two halves of a bar. Footer has extra bottom padding so the dock never covers it.
- **"Our work" photo strip** `#work` under About (from `Downloads\Interiors Photo Strip.html`): library copied
  unchanged to `strip-gallery.css` / `strip-gallery.js` (StripGallery, no deps), photos extracted to `assets/gallery/`
  (9 × WebP + thumbs, ~1.5 MB, `lab/extract-gallery.mjs`). Restyled only from index.html via `--sg-*` vars: ivory on
  floor brown, Inter Tight caps, Cormorant title. `wheelMode: 'horizontal'` so the vertical wheel scrolls the page,
  not the strip (the original default hijacked it). Placeholder captions "[Location] · [Package] · [Duration]" left out.
  CTA under it = WhatsApp 971545979814 with the current photo's name in the message. Tests: `tools/test-gallery.mjs`.
  **34 photos since 2026-10-02:** 25 added from `Desktop\PICS` (10–34, `tools/import-photos.mjs`: Chrome decodes so
  EXIF rotation is right, 1600 px long edge + 480 px thumb, WebP). Duplicates (`tools/find-duplicates.mjs` + contact
  sheet): `20250711_165425 (1).jpg` byte-identical → deleted from PICS; `IMG-20260619-WA0213.jpg` = gallery 01 →
  not added (file left in PICS). Gallery is now ~5.4 MB, so StripGallery is only built when `#work-strip` is within
  1.5 screens (IntersectionObserver): 0 gallery requests at page load. Portrait photos are cropped 4:3 in the
  strip, full in the lightbox.
- **Two phone numbers** (2026-10-02): +971 54 597 9814 and +971 50 498 5529. Anything with `data-choose="call"` or
  `"wa"` opens a small menu (`.pf-choose`, script "Number chooser", list `NUMBERS`) with both: call → `tel:`, wa →
  `wa.me` (+ `data-wa-text` message, used by the gallery link). Used on: dock "Get in touch", footer WhatsApp icon,
  gallery "Chat with us on WhatsApp". Footer text lists both numbers. Test: `tools/test-choose.mjs`.
- **Strip motion (2026-10-03, client: "less abrupt"):** `slide: true` (row glides; was frames jumping),
  `growDuration: 0.55`, and a new library option `springScale: 0.45` (js/strip-gallery.js: slower spring, same
  damping ratio, no overshoot). `tools/measure-strip.mjs` (needs :4500): 0 slow frames, max 27 px/frame, 0 px
  overshoot. Don't screenshot during that measurement (SHOTS=1 stalls frames).
- `#what-we-do` text replaced with the client's own copy ("Beautiful is not enough.", verbatim). The turnkey list,
  suppliers and "help finding a host" lines from the old site are no longer on the page.

## 3b'. Desktop lag, 2026-10-02 (client: "still insanely laggy on PC, phone is fine")

- Measured with `tools/measure-lag.mjs` (headed Chrome, real GPU, 1536×864 @1.25, wheel through all packages;
  needs the server on :4500). As it was: 57 fps, 17 frames > 25 ms (hitches to 100 ms). Images instead of GPU
  video (= what phones use over the LAN IP): 42 fps, 155 slow frames, so the GPU path is right for desktop.
  **Cause: `backdrop-filter: blur` on the dock's "Get in touch" button**, which floats over the room video and
  is re-blurred every frame. Removed (solid ivory): 60 fps, 0–1 slow frames per pass. Don't put backdrop blur
  over the room again.
- Laptop facts: i5-1135G7, Iris Xe, Intel driver 30.0.101.3111 (2022, old), was running on battery. Chrome's
  Energy Saver caps at 30 fps on battery; `?fps` in the address shows fps, worst frame and GPU video vs images.

## 3b. Playback performance (fixed 2026-09-30)

- Cause of the stutter: drawing `<img>` frames made Chrome decode each 1904×1088 WebP on the main thread at
  draw time (~20 ms, 50–100 ms long tasks, ~26 fps, 2 of 3 frames skipped). Measured with Playwright traces.
- Now (`scroll-sequence.js`, FrameSet): all frames are downloaded as compressed data; only a window around the
  playhead is decoded into ImageBitmaps (30 ahead in the travel direction, 3 behind; at rest a 12-frame head
  start into the clips on either side). Clips with `"video":true` decode `.h264` frames on the GPU
  (WebCodecs `VideoDecoder`, `prefer-hardware`); otherwise `createImageBitmap(blob)` off-thread.
  Don't `close()` bitmaps (costs ~5 ms each on the main thread); dropping them lets GC free them.
- Drawing is pixel-exact when the frame is within 2.5% of the canvas size (1904px frame on a 1920px canvas
  was being stretched 0.8% and blurred). The `.sc-grain` noise overlay was removed (it dulled the video).
- Result on the client's laptop (headless Chrome, 1536×864 @1.25): no long tasks, ~42–45 fps during a glide
  (idle ceiling ~55–60), shown frames ≈ source (SSIM 0.985; colours BT.709 like a video player).
- Remaining GPU cost: canvas draw + compositing + decode. The frosted glow's backdrop blur costs ~2–5 fps.

## 4. Producing frames from a new clip (the process we use)

```powershell
$d = "assets\frames\roomN"; New-Item -ItemType Directory -Force $d
# what the site plays (GPU decode): one H.264 key frame per file
ffmpeg -i "<clip>.mp4" -an -c:v libx264 -preset slow -profile:v high -level 4.0 -crf 16 -pix_fmt yuv420p -x264-params "keyint=1:min-keyint=1:repeat-headers=1:scenecut=0" -f image2 "$d\%04d.h264"
# fallback for browsers without hardware H.264
ffmpeg -i "<clip>.mp4" -an -vf "unsharp=5:5:0.55:5:5:0" -c:v libwebp -quality 82 -compression_level 6 "$d\%04d.webp"
```
- Native resolution. H.264 crf16 ≈ 13–15 MB per clip (SSIM 0.979); WebP q82 ≈ 10–12 MB (0.970).
  AVIF was tested and dropped: decoding is the bottleneck, and the source video itself limits sharpness.
- Add `"video":true` to the clip in the chain JSON. The codec string `avc1.640028` in the JS must match (High, level 4.0).
- Then add the clip to the chain JSON in `index.html`, move the next package `<section>` inside
  `.pf-room-track`, make its stage transparent (remove poster/background), give its copy `pf-photo-card`
  with an inner `<div data-sc-in>`, and set its span.
- Always check the seam: compare the previous clip's last frame with the new clip's first frame.
- Canvas draws with `imageSmoothingQuality = 'high'` (the default 'low' visibly blurred frames).

## 5. Generating the videos (client does this in Kling)

- Each clip: start frame = previous clip's end state, end frame = next package state, **locked camera**, same room.
- Client uses **Kling O3** for finals (better reference consistency); Kling 3.0 Turbo is fine for cheap prompt tests.
- Desktop: **16:9, 1080p** (4K costs 2,500 credits each and is too heavy as frames; client has ~16,500 credits).
  Keep bed / armchair / window away from the very top and bottom edges.
- Phones: **9:16 vertical versions are planned but not made yet.** Phones currently get the wide clip cropped to the centre
  (window/sea mostly lost). When they arrive: load a separate frame set on narrow screens; consider smaller phone frames.

## 6. How to run and test

- Server: `node "C:\Users\Kugler\.claude\plugins\cache\nateherk\nateherk-design\0.3.0\skills\scroll-craft\scripts\serve.mjs" .`
  from the project folder → http://localhost:4500 (also reachable on the LAN at http://192.168.68.69:4500 for phone testing).
  Alternatives: `npx serve .` or `python -m http.server`.
- Screenshots: `shoot.mjs` in the same plugin scripts folder (`--url --out lab/x --steps N --width --height`), or small
  Playwright scripts (playwright-core is in `node_modules`, Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`).
  Touch tests: use CDP `Input.dispatchTouchEvent` (`synthesizeScrollGesture` did not scroll in headless).
- Client's screen: 1920×1080 at 125% Windows scaling (CSS viewport 1536×864, DPR 1.25), Intel Iris Xe.

## 7. Where we are / open items (as of 2026-09-26)

**Update 2026-09-30:** the page now shows the source frames pixel-exact (verified), so remaining softness is the
Kling 1080p source itself. Next idea for sharpness: AI-upscale the source clips 2× and export larger frames
(not started; client to decide). The notes below are the earlier investigation.

**Earlier: image quality.** Client feels the site looks softer than the .mp4.
- Measured: website frames ≈ source (SSIM 0.971, colour within 1/255); on the client's screen frames are shown ~1:1.
  Likely causes: video-player / Intel driver enhancement on .mp4 playback, stills being inspected vs motion, the frosted glow.
- `lab/compare.html` was made so the client can A/B the original .mp4 and the website frame at the same size.
  **Waiting on the client's verdict.**
- Tested option: **AVIF** instead of WebP. Frame 100 of clip 3: WebP q82 = 115 KB / SSIM 0.971; AVIF crf18 = 77 KB / 0.974;
  AVIF crf14 = 95 KB / 0.976 (libaom-av1, `-still-picture 1`). I.e. better quality AND smaller. Recommended next step.
  Keep a WebP fallback only if very old browsers matter (AVIF: all current browsers).
- Other options discussed: AI-upscale the source clips to 1440p and export desktop frames larger; a slight contrast/sharpen
  grade to match the "player look". Not recommended: shrinking the room to less than fullscreen (the client wanted fullscreen; small gain).

**Next content:** Package 3 → 4 transition video (renovation). Then decide how Package 4's floorplan fits with a video.

**Copy mismatches to raise with the client:**
- Package 2 text lists Fridge / Washer / TV / AC, but clip 2 shows bedding, curtains, lamps, art (no appliances).
- Package 1 headline "Every renovation starts empty." fits the load animation (starts empty).

**Page weight:** ~31 MB of frames for 3 clips. Only clip 1's first 40 frames gate the start; the rest load in the background.
Revisit for mobile data (smaller/vertical phone frames, AVIF).

## 8. Working with this client

- Works iteratively and visually: small concrete requests ("more transparent", "a bit bigger", "longer").
  Make the change, verify with screenshots/tests, report briefly with how to tweak the value.
- Wants things to feel premium and smooth. Explain trade-offs (file size, credits) in plain terms with numbers.
- Writes quickly and informally; answer in English, plainly, without jargon.
