# Civella — Frontend

**RSP-FE-BP-2026 · v1.0.0 · Industry 05 — Real Estate & PropTech**
A premium property-discovery & agent-intelligence frontend on React 19 + Vite + Tailwind v4.

> Frontend only. No backend, database, server routes, n8n, or payment processing.
> The typed interfaces in `src/types/` are the handoff contract for the backend team.

---

## Projects

| # | Name | Route base | Description |
|---|------|-----------|-------------|
| 1 | Property Listing Platform | `/` · `/listings` · `/agent/*` | Map-first search + agent portal (this build) |

This repository ships the Property Listing Platform (Card 5A). The architecture
and contracts are shared so Projects 2 (CRM) and 3 (Mortgage) can reuse the
design system, stores, and API layer.

---

## Prerequisites

- Node.js ≥ 20 (LTS)
- npm ≥ 10

---

## Local setup

```bash
# 1. Clone
git clone https://github.com/your-org/civella-frontend.git
cd civella-frontend

# 2. Install
npm install

# 3. Configure environment (optional — defaults to mock mode)
cp .env.example .env
# Edit .env — see "Environment variables" below

# 4. Start the dev server
npm run dev
# → http://localhost:5173

# 5. Build for production
npm run build
# 6. Preview the production build
npm run preview
```

**Mock mode (default):** `VITE_API_URL=""` → the app reads from `src/data/*.ts`.
No server required. **Live mode:** set `VITE_API_URL` and every service call hits
real endpoints with zero code changes.

---

## Environment variables

All variables use the `VITE_` prefix and are **public by definition** (inlined at
build time). Copy `.env.example` → `.env`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_NAME` | No | `"Civella"` | App display name |
| `VITE_APP_TAGLINE` | No | `"Premium Property Discovery"` | Marketing tagline |
| `VITE_API_URL` | No | `""` | API base URL — empty = mock mode |
| `VITE_MAP_STYLE_URL` | No | demo tiles | MapLibre GL style URL |
| `VITE_MAP_ACCESS_TOKEN` | No | `""` | MapLibre access token |
| `VITE_FLAG_SAVED_SEARCHES` | No | `"true"` | Enable saved-search UI |
| `VITE_FLAG_VIRTUAL_TOUR` | No | `"false"` | Enable tour slot |
| `VITE_ANALYTICS_URL` | No | `""` | Analytics endpoint |

> ⚠️ Never put secrets in `VITE_` variables. See `docs/Security_Key_Flow.md`.

---

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Vite production build → `dist/` |
| `npm run preview` | Preview the production build locally |

Governance configs (`.eslintrc.json`, `.prettierrc`, `tsconfig.json`) are provided
for when the team adds `lint`, `format`, `test`, and `type-check` scripts.

---

## Architecture

```
src/
├── app/           (providers + router mount)
├── router/        Route config + ProtectedRoute + PlanGuard
├── store/         Context + useReducer (Auth, UI, Leads, SavedSearch)
├── pages/         Route-level pages
├── components/    ui/ · shared/ · layout/
├── lib/           api.ts · format.ts · validation.ts · gsap.ts
├── hooks/         usePersistedReducer · useCountUp · useMediaQuery · ...
├── types/         Domain interfaces (the API contract)
└── data/          Mock datasets (listings, agents, neighborhoods, …)
```

**Data flow:** `Page` → feature components (props) → `services` →
`lib/api.ts` (`request<T>()` / `mockFetch<T>()`) → `src/data/*`.
State flows through Context stores with `localStorage` persistence.

---

## API integration guide (backend team)

The frontend contracts are the TypeScript interfaces in `src/types/`.

1. Implement REST endpoints matching the interface shapes below.
2. Set `VITE_API_URL=https://your-api.com/v1` in your Vercel/host environment.
3. Deploy — no frontend code changes required.

### Endpoints expected

| Endpoint | Method | Returns | Mock source |
|----------|--------|---------|-------------|
| `/listings` | GET | `{ listings: ListingSummary[] }` | `src/data` |
| `/listings/:id` | GET | `Listing` | derived |
| `/leads` | GET | `Lead[]` | `src/data` |
| `/leads` | POST | `void` | logs in demo |
| `/showings` | POST | `void` | — |
| `/agents` | GET | `Agent[]` | `src/data` |
| `/agents/:id` | GET | `Agent` | derived |
| `/neighborhoods` | GET | `Neighborhood[]` | `src/data` |
| `/market-stats` | GET | `MarketStat[]` | `src/data` |
| `/valuation` | POST | `ValuationEstimate` | mock range |

**Auth:** protected endpoints expect `Authorization: Bearer <token>`. The frontend
sends the token from `AuthStore` (persisted at `civella.session`).

**Plans:** the session carries `plan: 'starter' | 'pro' | 'enterprise'`. The backend
should set this on signup/login and after a verified webhook payment. The frontend's
`SET_PLAN` is mock-only; treat the backend as the source of truth.

See `docs/Parameter_Schema.md` for the full prop/store/fetch data-flow map.

---

## Vercel deployment

```bash
npm i -g vercel
vercel link
vercel          # preview
vercel --prod   # production
```

`vercel.json` already configures:
- **SPA rewrites** — all client routes serve `index.html`.
- **Immutable asset cache** — `/assets/*` cached 1 year.
- **Security headers** — nosniff, DENY framing, XSS protection, referrer + permissions policy.

Set environment variables in the Vercel dashboard (or `vercel env add …`):
```bash
vercel env add VITE_API_URL production
vercel env add VITE_MAP_ACCESS_TOKEN production
```

---

## Documentation artifacts

- **`docs/Parameter_Schema.md`** — component tree + data-flow map (API contract reference).
- **`docs/Security_Key_Flow.md`** — environment-variable exposure boundary (what's safe vs. secret).

---

## Out of scope (backend team's responsibility)

- ❌ Backend / API implementation
- ❌ Database schemas (Supabase or otherwise)
- ❌ n8n workflow automation
- ❌ Real payment processing
- ❌ Server-side rendering / SSR
- ❌ Email sending

---

*Civella Frontend · RSP-FE-BP-2026 · v1.0.0 · Generated 2026-08-22*
