# Contributing

Thanks for your interest! This project has a deliberately small surface — keep
changes lean.

## Dev setup

```sh
pnpm install
pnpm dev          # local dev server
pnpm build        # type-check + production build
pnpm lint
```

## Ground rules

- **Mind the bundle.** The initial JS bundle has a budget (see [PLAN.md](./PLAN.md)).
  Heavy things (charts, the map) must be `React.lazy` chunks, never on the initial
  path. New dependencies need to earn their bytes — prefer the platform (`fetch`,
  `Intl`, `URLSearchParams`) over libraries.
- **No backend.** This is a static client. If a feature needs a server, it's out
  of scope for the core (fork it).
- **Only what GoatCounter measures.** No invented metrics — see *Non-goals* in the
  [README](./README.md).
- Run `pnpm lint` and `pnpm build` before opening a PR; CI runs both.

## Project layout

```
src/
  api.ts              typed GoatCounter client + connections + cache
  hooks/useDashboard  parallel, rate-limit-aware data fetching
  components/         App shell, metric tables, chart, map, dialogs
  components/ui/      shadcn/ui primitives
  lib/                formatting + helpers
```
