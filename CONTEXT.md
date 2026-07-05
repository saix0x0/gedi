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

## State (2026-07-05)
Done: full V1 loop working (map → marker → card → mark visited → XP/level/badges), quests/collections/profile tabs, search, game fonts, RDR theme toggle, glowing quest paths. All mobile-verified via preview.
Next up (user's roadmap): more places (target 60–100), real photos per place, "add your own location" UI backed by addLocalPlace, QR generation, leaderboard/social (V2, needs Supabase), transfer repo to tag-iiith.

## User preferences
- Credit-frugal: batch work, don't over-verify, no paid APIs ever.
- Push progress to the gedi repo; keep progress.html updated each milestone.
- Product voice: video-game energy (Cyberpunk/RDR), IIITH-specific flavor (Felicity, hostel, midsems).
