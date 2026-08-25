# Parameter Schema — Component Tree & Data Flow

> Reference diagram for the **Backend Integration Team**.
> This document describes `docs/Parameter_Schema.png`. It maps the full data flow
> from React components → Context stores → typed service functions → the fetch
> layer → mock JSON, with the prop/action/shape annotated at every hop.

---

## 1. High-level data flow

```
 ┌────────────┐   props     ┌──────────────────┐  call   ┌──────────────────┐
 │  Page      │ ─────────▶ │ Feature component│ ──────▶ │ services.ts      │
 │ (route)    │             │ (ListingCard…)   │         │ listingService   │
 └────────────┘             └──────────────────┘         │ agentService     │
        ▲                          ▲   dispatch          │ leadService      │
        │ reads                    │ ──────────────┐     │ referenceService │
        │                          │               │     └────────┬─────────┘
 ┌──────┴─────────────┐    ┌───────┴────────┐    │              │ request<T>()
 │ Context stores     │    │ UI interaction │    │              ▼
 │  AuthStore         │◀───│ (button/form)  │    │     ┌──────────────────┐
 │  UIStore           │    └────────────────┘    │     │ lib/api.ts       │
 │  LeadStore         │                          │     │ request<T>()     │
 │  SavedSearchStore  │ persist (localStorage)   │     │ mockFetch<T>()   │
 └────────────────────┘                          │     └────────┬─────────┘
                                                 │              │
                                                 │     ┌────────▼─────────┐
                                                 └────▶│  src/data/*.ts    │
                                                       │  (mock JSON)      │
                                                       └──────────────────┘
```

---

## 2. Component tree (top-down)

```
AppProviders                                  (src/App.tsx)
├── UIProvider        theme, toasts           persist: civella.theme
├── AuthProvider      user, plan, status      persist: civella.session
├── LeadProvider      leads[]                 persist: civella.leads
└── SavedSearchProvider saved[]               persist: civella.savedSearches
      │
      └── RouterProvider
            ├── PublicLayout  (Navbar + Footer + Outlet)
            │     ├── HomePage
            │     │     ├── HeroSearch ─────────▶ navigate('/listings?q=')
            │     │     ├── StatTile (count-up) ◀ MarketStat[]
            │     │     ├── ListingCard × N     ◀ ListingSummary[]
            │     │     ├── NeighborhoodGuide   ◀ Neighborhood[]
            │     │     ├── BuildingTour (Three.js)
            │     │     └── ValuationWidget ───▶ listingService.estimate()
            │     ├── ListingsPage ───────────▶ listingService.list(filters)
            │     ├── ListingDetailPage ───────▶ listingService.get(id)
            │     │     ├── PhotoGallery
            │     │     ├── SpecGrid                ◀ Listing
            │     │     ├── PriceHistoryChart       ◀ PricePoint[]
            │     │     ├── LeadForm ───────────▶ listingService.submitLead()
            │     │     └── ShowingForm ────────▶ listingService.submitShowing()
            │     ├── NeighborhoodsPage / NeighborhoodPage
            │     ├── AgentsPage / AgentProfilePage ─▶ agentService.get(id)
            │     ├── ValuationPage ─────────────▶ listingService.estimate()
            │     ├── PricingPage (dynamic selection) ─▶ continueToPayment()
            │     └── Features / About / Help / NotFound
            │
            ├── Auth: LoginPage · SignupPage (plan-aware routing)
            │
            └── Protected (ProtectedRoute + PlanGuard)
                  ├── PaymentPage ───────────▶ (UI-only) ─▶ /payment/success
                  ├── PaymentSuccessPage ────▶ AuthStore.SET_PLAN
                  ├── AgentProfilePage (full-screen, ImageUploader)
                  ├── AgentSettingsPage (full-screen, 8 sections)
                  └── AgentLayout (sidebar + topnav)
                        ├── AgentDashboardPage (plan-aware KPIs)
                        ├── AgentListingsPage (10-listing Free cap)
                        ├── ListingEditorPage
                        ├── LeadInboxPage ──▶ LeadStore
                        ├── NotificationsPage
                        └── AdminPage
```

---

## 3. Boundary contracts (what each hop must satisfy)

| Boundary | Flows down (data) | Flows up (action) |
|----------|-------------------|-------------------|
| Page → Feature | `ListingSummary[]`, `Listing`, `Agent`, `MarketStat[]`, `Neighborhood[]` | `onOpen(id)`, `onSearch(filters)`, `onToggleSave(id)` |
| Feature → Service | `ListingFilters`, `id`, `LeadInput`, `ShowingRequestInput`, `address` | `Promise<T>` |
| Service → API | `path`, `RequestInit` | `request<T>()` resolves `T` |
| Component → Store | — | `LOGIN_SUCCESS`, `SET_PLAN`, `SET_THEME`, `ADD`/`SET_STATUS`/`ASSIGN` (leads), `ADD`/`REMOVE` (saved) |
| Store → localStorage | serialized state | `storage` event (cross-tab) |

---

## 4. Mock-to-live swap point

```
lib/api.ts
├── request<T>(path, init?)
│     ├── if (!VITE_API_URL)  →  mockFetch<T>(path)   ← DEFAULT (demo)
│     └── else                →  fetch(`${BASE}${path}`, …)
└── mockFetch<T>(path)
      ├── '/listings'      → listingSummaries
      ├── '/agents'        → agents
      ├── '/neighborhoods' → neighborhoods
      ├── '/market-stats'  → marketStats
      └── '/leads'         → leads
```

`VITE_API_URL=""` → mock. `VITE_API_URL="https://api/v1"` → live. **Zero code changes.**

---

## 5. Persistence keys

| Store | Key | Shape |
|-------|-----|-------|
| Auth | `civella.session` | `{ user: SessionUser, status, error }` |
| UI | `civella.theme` | `{ theme: 'light'\|'dark'\|'system', toasts: [] }` |
| Leads | `civella.leads` | `Lead[]` |
| Saved | `civella.savedSearches` | `SavedSearch[]` |

All stores sync across tabs via the `storage` event (`usePersistedReducer`).

---

## 6. Source-of-truth interface files

- `src/types/index.ts` — `Listing`, `ListingSummary`, `Agent`, `Lead`, `MarketStat`,
  `Neighborhood`, `ValuationEstimate`, `SessionUser` (incl. `plan`), `Plan`, `…`
- `src/lib/api.ts` — `applyFilters`, `request<T>`, `mockFetch<T>`, service objects.
- `src/data/index.ts` — mock datasets (12 listings, 6 agents, 4 neighborhoods, 9 leads).

The backend must return JSON matching these interfaces exactly.
