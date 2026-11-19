# GitScope — GitHub Analytics Dashboard

> Portfolio project of a Senior Frontend engineer. Enter a GitHub username → get a shareable analytics dashboard:
> profile, KPIs, contribution heatmap, languages, activity, top repositories, insights. Budget: **3–4 days**.
> Constraints: free to run, **no database, no auth, no paid APIs**, no technology added just for the sake of it.

---

## 0. Rules for Claude (read first)

**General**
- Talk to the user in Ukrainian. Everything in the repo — code, comments, commits, UI copy, README — in **English**.
- The stack is fixed (section 2). Do not add libraries without a clear need; do not swap chosen ones.
- Small, meaningful commits, Conventional Commits with scope: `feat(api): ...`, `feat(web): ...`, `test(analytics): ...`.
- Git identity is set locally (`Volodymyr Ziabkin <volodymyr.ziabkin@gmail.com>`) — never change it, never use the global one.
- After every step: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`.
- Node 24 via nvm: prefix shell commands with
  `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"` (pnpm lives in the v22 dir).
- Context7 quota may be exhausted — then verify library APIs from `node_modules/<pkg>` (README, `.d.ts`).

**Contract and data**
- `packages/shared` is the single source of truth for the API contract (Zod schemas + `z.infer` types). The API validates its
  responses with these schemas (Fastify serializer); the web app imports the same types.
- Every upstream (GitHub) response is parsed with Zod — "parse, don't validate" at every boundary.
- Errors are RFC 9457 `application/problem+json` with a machine-readable `code` (see `packages/shared/src/problem.ts`).
- Analytics are **pure functions** with unit tests (`apps/api/src/modules/analytics`). No I/O, no `Date.now()` inside — pass time in.
- Contribution dates are calendar strings (`YYYY-MM-DD`) from GitHub — never convert them through `Date` with a time zone.

**API (Fastify)**
- `buildApp(deps)` is a factory: tests build the app with fakes and call `app.inject()` — no network in tests.
- `GithubClient` has two implementations: `GraphqlGithubClient` (token) and `FixtureGithubClient` (no token → recorded data).
- The token never leaves the API. Cache: LRU + TTL + in-flight request coalescing; `X-Cache: HIT|MISS` header.
- Rate limit keys on the real client IP: requests from the Next server carry `x-internal-key` + `x-client-ip`;
  the client IP header is trusted **only** with a valid internal key (timing-safe compare).

**Web (Next.js 16)** — added on Day 2
- Read `node_modules/next/dist/docs/` of the installed version before writing Next code (see `apps/web/AGENTS.md`).
- `params` / `searchParams` are Promises. Expected errors (404, 429) are values rendered as UI states;
  `error.tsx` is only for unexpected failures (production strips server error messages).
- Feature-Sliced Design in `apps/web/src` (app → pages → widgets → features → entities → shared), checked by `steiger`.
  Next routing lives in `apps/web/app` and only re-exports pages; an empty `apps/web/pages/` keeps Next from treating
  `src/pages` as the Pages Router.
- Server Components by default; `'use client'` only for interactive parts (filters, charts, year switch).
- The browser talks to the API only through the Next proxy route (`app/api/[...path]/route.ts`).

---

## 1. Product

**Pages:** `/` (hero, search, example profiles, recent searches) · `/u/[username]` (dashboard) · `/compare?users=a,b` (P1) · not-found.

**Dashboard:** profile header → KPI tiles → contribution heatmap with year switch → monthly activity chart →
languages donut → repositories table (search, language filter, sort — state in the URL, filtered on the client) → insights.

**Sharing:** `generateMetadata` + `opengraph-image.tsx` (`next/og`) — avatar, stars, top language; generic image on failure.

**UX states for every widget:** skeleton, empty, error. Distinct states for "user not found" and "rate limited, retry in N s".
Dark mode (system default), responsive down to 375px, keyboard-accessible heatmap, `/` focuses the search.
The home page pings `GET /health` on load to wake the free-tier API while the user types.

| Feature | Priority |
|---|---|
| API: user report, contributions (rolling year + by year), health, Swagger | P0 |
| Fixture mode (runs without a token) | P0 |
| Home + search, dashboard widgets, all UX states | P0 |
| Contribution year switch (TanStack Query hydration) | P0 |
| OG image + metadata | P0 |
| Compare two users | P1 |
| Playwright E2E, CI, Docker, deploy (Vercel + Render) | P1 |
| SVG stats card for READMEs, Storybook | P2 |

**Cut order if behind schedule:** compare → year switch (rolling year only) → E2E down to 1 test → steiger. Never cut the OG image.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) — no Turbo/Nx |
| Runtime / language | Node 24 LTS, TypeScript 5 strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` |
| Contract | Zod 4 (`packages/shared`) |
| API | Fastify 5, `fastify-type-provider-zod`, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/etag`, `@fastify/swagger(-ui)`, pino, `lru-cache` |
| GitHub | GraphQL API v4 via `fetch` (contributions are GraphQL-only) |
| API build | `tsx` (dev), `tsup` (bundle for Docker) |
| Web | Next.js 16 (App Router, RSC, streaming), React 19, TanStack Query (server prefetch → `HydrationBoundary`) |
| UI | Tailwind v4 + shadcn/ui, `next-themes`, Recharts; heatmap — own SVG component |
| Tests | Vitest; RTL + MSW (client components); `app.inject` (API); Playwright (E2E, covers RSC) |
| Quality | ESLint 9 flat (typescript-eslint strict type-checked), Prettier (120), GitHub Actions |
| Deploy | Web → Vercel Hobby; API → Render free (Docker). Check free-tier terms before deploying |

**Deliberately not used:** database, Redis, auth/OAuth, NestJS, tRPC, GraphQL server, Storybook (P2).

---

## 3. Architecture

```
Browser ──► Next.js (Vercel) ── RSC fetch / proxy route ──► Fastify API (Render) ──► GitHub GraphQL
              │  SSR + streaming, OG images                   │  LRU cache + coalescing, rate limit,
              │  TanStack Query on the client                 │  Zod contract, problem+json errors
              └── x-internal-key + x-client-ip ───────────────┘
```

```
gitscope/
├─ apps/api/src/
│  ├─ app.ts · server.ts · config/env.ts
│  ├─ lib/                 # cache (LRU + coalescing), errors (AppError)
│  ├─ plugins/             # error-handler, rate-limit, swagger
│  └─ modules/
│     ├─ github/           # GithubClient interface, graphql + fixture clients, queries, upstream schemas
│     ├─ users/            # routes → service (cache) → mapper (upstream → DTO)
│     ├─ analytics/        # pure functions: languages, repo stats, streaks, activity, insights
│     └─ health/
├─ apps/api/fixtures/      # recorded GitHub data for fixture mode (`pnpm --filter @gitscope/api fixtures:record <logins>`)
├─ apps/web/               # Next.js: app/ (routing only), src/ (FSD)
├─ packages/shared/src/    # username, user-report, contributions, problem
└─ e2e/                    # Playwright
```

### API endpoints
| Method | Returns |
|---|---|
| `GET /users/:username` | profile, stats, languages, repositories (owned, non-fork, by stars, ≤ 300), insights, contribution years |
| `GET /users/:username/contributions?year=YYYY` | days, totals, breakdown, monthly, weekdays, streaks, best day; no `year` → rolling last year |
| `GET /health` | status, mode (`live`/`fixtures`), GitHub quota |
| `GET /docs` | Swagger UI generated from the Zod schemas |

Cache TTL: report 10 min; contributions — current period 10 min, past years 24 h; "user not found" 1 min.
HTTP: `Cache-Control: public, max-age=300, stale-while-revalidate=600` + ETag.

---

## 4. Plan

- **Day 1 — foundation + API:** monorepo tooling, shared schemas, Fastify app, GitHub clients, analytics + tests, cache, rate limit, Swagger.
- **Day 2 — web skeleton:** Next.js, Tailwind + shadcn, theme, FSD + steiger, API proxy, home, dashboard header/KPIs/repos table, states.
- **Day 3 — visualisation:** heatmap (SVG) in Suspense, year switch, activity, languages, insights; responsive, dark, a11y; component tests → tag `v0.1`.
- **Day 4 — sharing + delivery:** OG image, compare (P1), Playwright, Dockerfile, deploy, README with screenshots → tag `v1.0`.

## 5. Status (update after every step)

- [ ] Day 1 · [ ] Day 2 · [ ] Day 3 · [ ] Day 4
