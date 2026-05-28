# GoatCounter Dashboard — Architecture & Plan

## 1. North star

A GoatCounter dashboard that honors GoatCounter's own ethos: **lightweight, no
bloat, nothing running at rest.** Two hard, non-negotiable rules:

1. **Zero runtime server RAM.** The product is a static bundle. No Node server, no
   SSR, no API layer of our own. If a feature needs a backend, it's out of scope.
2. **Minimal code & bundle.** Fewest dependencies, fewest lines, smallest payload
   that still looks good. Every dependency must justify its bytes.

Everything below serves those two rules.

## 2. Why static SPA, not Next.js

| | Next.js (SSR) | This (static SPA, Vite) |
|---|---|---|
| Server process at rest | Node, ~80–150 MB idle | none |
| Server RAM | grows with traffic | **0 MB** |
| Deploy artifact | running service | folder of files |
| Where the work happens | server + client | GoatCounter + client |

GoatCounter already did the expensive part (ingestion, aggregation, GeoIP, UA
parsing). The dashboard is pure presentation, so it has no reason to run a server.
Vite builds to static assets served by the edge we already run (cloudflared/Caddy)
— or even by GoatCounter itself on a sibling path.

## 3. Stack (locked)

- **Vite + React + TypeScript** — static build, no runtime framework server.
- **Tailwind CSS + shadcn/ui** — shadcn components are copied into the repo (Radix +
  Tailwind), so we ship only the primitives we actually use. No component-library
  runtime.
- **Recharts** — the one time-series chart. Lazy-loaded (it's the heaviest dep).
- **react-simple-maps** — world choropleth. Lazy-loaded; map topojson fetched on
  demand, never in the main bundle.
- **No** state-management lib, **no** data-fetching lib, **no** router lib, **no**
  date lib. Hooks + native `fetch` + `URLSearchParams` + `Intl`.

## 4. RAM & bundle budget (enforced)

- **Server runtime:** 0 processes. Served as static files.
- **Build/CI:** Node only at build time, never at runtime.
- **Initial JS bundle:** target **< 150 KB gzip**. Recharts and the map are
  `React.lazy` chunks, excluded from the initial load.
- **Browser memory:** no client-side aggregation — render finished API rows as-is.
  Cap in-memory series length; no retaining raw history.
- **Caching:** hand-rolled `sessionStorage` response cache keyed by
  `(site, range, widget)` to avoid refetch on navigation. ~30 LOC, no SWR/query lib.

## 5. Data layer

GoatCounter v2 exposes everything the core dashboard needs (verified against the
`/api/v0` spec). No SQLite coupling required.

| Endpoint | Purpose |
|---|---|
| `GET /api/v0/stats/total` | KPI totals for a date range |
| `GET /api/v0/stats/hits` | pageviews time-series (main chart) |
| `GET /api/v0/stats/{page}` | metric tables: browsers / systems / locations / sizes / languages / campaigns |
| `GET /api/v0/stats/hits/{path_id}` | per-page referrers (drill-down) |
| `GET /api/v0/paths` | path list |
| `GET /api/v0/sites` | multi-site switcher |
| `GET /api/v0/me` | token validation on first load |

Auth: Bearer token from `localStorage`. Requests go directly to the user's
GoatCounter instance. CORS handled by same-origin hosting (preferred) or a
GoatCounter CORS allow-entry.

One thin typed client (`src/api.ts`) wraps these — the only place that knows about
GoatCounter's shapes. ~150–250 LOC.

## 6. Component breakdown (target ~3–5k LOC total)

- `api.ts` — typed fetchers + cache (~200 LOC)
- `App` shell — header, site switcher, date-range, theme toggle, URL state (~400)
- `KpiTiles` — total pageviews etc. (~120)
- `PageviewsChart` — lazy Recharts area/bar (~250)
- `WorldMap` — lazy choropleth (~300)
- `MetricTable` — one reusable bar-fill/% table with drill-down, wired 6–7× (~350 + ~40 each)
- shadcn primitives actually used: card, button, select, popover, tabs, skeleton, dropdown
- states: loading skeletons, empty, error, token onboarding (~300)

## 7. Milestones

- **M0 — Scaffold** *(this commit + next)*: repo, docs, license, Vite/TS/Tailwind
  config, shadcn init, lint. Runnable empty shell.
- **M1 — MVP**: token onboarding, single site, date-range, KPI tiles, pageviews
  chart, top-pages table reading the real API. Usable end-to-end.
- **M2 — Parity core**: all metric tables, referrer drill-down, world map,
  multi-site switcher, light/dark, responsive, sessionStorage cache.
- **M3 — Polish & ship**: bundle-budget CI check, deploy guide (same-origin +
  CORS), screenshots, demo against a public GoatCounter, v0.1.0 tag.

## 8. Explicit non-goals (data ceiling)

GoatCounter does not collect sessions or events, so this dashboard will **not** fabricate:
unique visitors, bounce rate, visit duration, funnels, retention, user journeys,
goals, or custom events. These need a session-based collector (Umami/PostHog).
Pretending otherwise would mean inventing numbers — explicitly out of scope.
