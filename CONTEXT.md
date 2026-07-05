# GEDI — Context File (for continuing work in a fresh session)

**What this is:** Gamified Hyderabad exploration web app for IIITH freshers. RPG-style: main quests / side quests / specials, XP, levels, badges, collections. Accessed via QR at orientation. Repo: `saix0x0/gedi` (to be transferred to tag-iiith org).

## Architecture decisions (do not re-litigate)
- **Open-source only, $0 hosting.** Vite + React + TS, MapLibre GL JS, CARTO dark raster tiles (free, no key). GitHub Pages via Actions, base `/gedi/`.
- **Places are data, not code.** All places in `src/data/places.json`. UI reads via `getPlaces()` in `src/store.ts` — the single data-layer seam. V2 backend (Supabase) swaps only that function.
- **No auth, no backend in V1.** Progress (visited/XP) in localStorage (`gedi.visited`). User-added local places supported via `addLocalPlace()` → `gedi.localPlaces` key (no UI for it yet).
- **No Tailwind/framer-motion** — single `src/index.css`, CSS animations. Keep it lean.

## File map
- `src/data/places.json` — 16 seeded places. Schema: id, name, area, category, quest(main|side|special), collections[], description, lat, lng, budget, bestTime, duration, metro, xp, maps, sid (Sid's Special text), tags[].
- `src/store.ts` — data layer, XP/level math (level n needs n²·40 cumulative XP), BADGES (8, predicate-based), COLLECTIONS (8 chips: budget/gourmet/birthday/date/night/streetfood/trek/study).
- `src/MapView.tsx` — MapLibre wrapper, DOM markers colored by quest type, pulse animation, dimmed when visited.
- `src/App.tsx` — everything else: HUD (level/XP bar/% explored), 4 tabs (Map/Quests/Collections/You), search, place bottom-sheet, toast on XP/badge.
- `public/progress.html` — living progress page, served at /gedi/progress.html. **Update it each milestone.**
- `.github/workflows/deploy.yml` — build + deploy to GitHub Pages on push to main.

## Gotchas discovered
- `.maplibregl-map` sets `position:relative` on its container → `.map` needs `position:absolute !important`.
- Vite `base: '/gedi/'` — dev URL is `localhost:5173/gedi/`.

## Themes & quest path (added 2026-07-05)
- Two themes: `cyber` (default, Rajdhani/Orbitron fonts — Rajdhani IS Cyberpunk 2077's UI font) and `rdr` (Rye + Georgia, parchment). Toggle in HUD, persisted `gedi.theme`, applied as `data-theme` on <html>; all styling via CSS var overrides in index.css. RDR map = CARTO voyager tiles + CSS sepia filter (.map-rdr).
- Quest path: selecting a place draws glowing dashed route (OSRM public demo API, straight-line fallback) from user geolocation (fallback: IIITH campus 78.3489,17.4455) to the place. Route persists after sheet closes (separate `routeTo` state). Redraw needed after setStyle (theme switch wipes layers) — handled via routeCoords ref + styledata listener.

## De-vibecoding pass (added 2026-07-05, later same day)
- **No emojis anywhere.** All glyphs from `src/icons.ts` — raw SVG strings (stroke, currentColor), used via `svg(name,size)` in marker innerHTML and `<Glyph>` (dangerouslySetInnerHTML) in React. `CATEGORY_ICON` maps category→glyph.
- Markers = CP2077 icon badges (rounded square, category glyph, quest-color border/glow). Districts = hand-drawn polygons in MapView `DISTRICTS` (rough rings, game aesthetic, not real boundaries) with dashed borders; per-district neon color in cyber, uniform ink `#5a4632` in rdr; labels are DOM markers (survive setStyle) styled `.district-label`.
- Filter legend on map (funnel button): quest-type chips + category grid w/ counts; state = hiddenCats/hiddenQuests Sets in App.
- Fonts: `--display` var = Oswald (cyber) / Rokkitt (rdr); body Rajdhani (cyber) / Georgia (rdr). No Orbitron/Rye (user called them vibecoded).
- Tabs renamed: MAP / EXPLORATIONS (quests) / SPECIAL PICKS (collections) / YOUR PICKS (profile + badges + conquered list). Theme toggle shows "2077"/"1899".
- RDR toned down: bg #c9b98f, map filter sepia(.62) saturate(.52) brightness(.8).

## CP2077 map-language pass (added 2026-07-05, third pass)
- Districts moved to `src/districts.ts` (+ taglines, `inRing` point-in-polygon, centroid). Single geojson source `districts` with promoteId:'name'; solid borders; feature-state hover/selected drives fill-opacity .04→.16 and line-width 1.2→2.6. Hover via mousemove/mouseleave on `districts-fill`; click via map click + queryRenderedFeatures (tap again = dismiss). Selection survives theme setStyle (re-applied in styledata handler).
- District info card (`.district-card` in App, CP-style: accent left border, notched corner, "PRIMARY VIBES" + tagline + spots/conquered counts via inRing).
- Filter legend = left side panel (`.legend`, notched clip-path, vertical rows, accent-bar quest chips).
- IIIT-H home base crest: `.campus-marker` in MapView init (shield-bolt `campus` glyph, rotating dashed ring).
- Theme toggle = game-logo homages (`.tt-cp` yellow notched plate / `.tt-rdr` black-red plate) — CSS-drawn, no trademarked assets.
- Known quirk: synthetic JS click events don't trigger MapLibre handlers (its DOM event manager needs real pointer input) — test district clicks with real clicks/preview_click, not dispatchEvent.

## Polish pass (2026-07-05, fourth pass)
- Theme toggle = real logos: `public/cp2077.svg` + `public/rdr2.png` (Wikimedia), `<img>` via `import.meta.env.BASE_URL`; CP logo sits on yellow `.tt-plate` (notched). Trademark note in README.
- Districts redrawn with 8–12 vertices each, loosely tracing Musi/Road No.1/ORR; added KUKATPALLY (#ff9f1c). Richer taglines.
- Malls added to places.json: inorbit, lulu, gvk-one (19 places total).

## Region-map + add-place pass (2026-07-05, fifth pass)
- Districts renamed to real areas (GACHIBOWLI/KONDAPUR/MADHAPUR/KUKATPALLY/JUBILEE HILLS/BANJARA HILLS/CITY CENTER/SECUNDERABAD/OLD CITY), contiguous tessellation. Borders traced along real roads: `scripts/trace-districts.mjs` routes each polygon edge via OSRM once, bakes to `src/districts-traced.json` (edge cache keeps shared borders identical). Re-run script if corners change. Border style: width 2/3.4, opacity .75/1, fill .015/.14.
- CP toggle plate now black (#0b0b0e). Cyber map filter removed (was too dark).
- Search: live results dropdown on map (top 6), tap opens sheet + draws path.
- YOUR PICKS: AddPlaceForm (personal → addLocalPlace, id suffix -local) + TagSection (SHA-256 gate, password TAG@GEDI, hash in App.tsx; tag submit copies JSON + opens GitHub edit of places.json). placesV state bumps to refresh getPlaces().
- Location input: single `loc` field accepts Google Maps URL (@lat,lng / ?q= / !3d!4d) or "lat, lng" via parseLocation(); short maps.app.goo.gl links can't resolve client-side (alert explains). MY LOCATION (GPS) + MARK ON MAP (picking state in App -> map tab -> click writes coords into sessionStorage draft `gedi.draft.<mode>` -> back to YOUR PICKS; form drafts persist via sessionStorage). Dup guard: same name or within ~0.0015 deg -> confirm dialog.
- QR: public/qr.png (512px, points to live URL) + regenerate: npx qrcode -o public/qr.png -w 512 <url>.

## On the books (user-requested, not built)
- **Dev login → add locations for everyone**: planned as V2 via Supabase (auth + places table + RLS: only dev role inserts; public read). Until then places.json commits are the admin flow. Keep `getPlaces()` seam.

## State (2026-07-05)
Done: full V1 loop working (map → marker → card → mark visited → XP/level/badges), quests/collections/profile tabs, search, game fonts, RDR theme toggle, glowing quest paths. All mobile-verified via preview.
Next up (user's roadmap): more places (target 60–100), real photos per place, "add your own location" UI backed by addLocalPlace, QR generation, leaderboard/social (V2, needs Supabase), transfer repo to tag-iiith.

## User preferences
- Credit-frugal: batch work, don't over-verify, no paid APIs ever.
- Push progress to the gedi repo; keep progress.html updated each milestone.
- Product voice: video-game energy (Cyberpunk/RDR), IIITH-specific flavor (Felicity, hostel, midsems).
