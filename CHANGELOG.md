# Changelog — Civella Frontend

All notable changes to this frontend are documented here.
Format: [Keep a Changelog](https://keepachangelog.com) · Versioning: [SemVer](https://semver.org)

---

## [1.0.0] — 2026-08-22

### Added — Property Listing Platform (Card 5A · RSP-FE-BP-2026)

**Landing & marketing**
- Homepage with a GSAP-staggered hero entrance, image search bar, and trust badges.
- Market stats band with animated count-up counters (median price, DOM, inventory, sold).
- Featured properties row, interactive neighborhood guide, and an "Find your agent" grid.
- Valuation widget (mock estimate service) and a newsletter subscription band.
- "Platform technology" section and a cinematic **3D listing tour** (12 viewpoints, light/dark aware, auto-advance + manual nav).
- `/features`, `/about`, `/help` (FAQ accordion with search).

**Property search & discovery**
- `/listings` — map-first search with filter bar (type, beds, price, area), sort control, and **URL-persisted filters**.
- `/listings/:id` — photo gallery, spec grid, SVG price-history chart, virtual-tour slot, contact + showing forms.
- `/neighborhoods` + `/neighborhoods/:areaId` — area stats + filtered listings.
- `/valuation` — address → estimate flow with confidence range.
- `/agents` + `/agents/:agentId` — photo grid + bio/stats/active listings.

**Authentication & conversion flow**
- `/auth/login` + `/auth/signup` — Zod validation, password show/hide, **strength meter**, **confirm-password**, Google + Enterprise SSO (UI-ready for backend).
- **Enforced plan flow:** Free signups go to the dashboard (Free only); Pro/Enterprise signups must complete payment first, then unlock.
- `/pricing` — **dynamic** hover/click plan selection (never locked to a default), monthly/annual toggle, feature comparison table.
- `/payment` (protected, UI-only, no processing) + `/payment/success` (GSAP check-draw + order summary) → promotes the session plan.

**Agent portal (protected)**
- `/agent/dashboard` — KPI cards, recent leads, my listings, pipeline snapshot, **performance chart**, quarterly goals, AI lead intelligence, scheduler, team, quick actions — **fully plan-aware** (Pro features locked for Free).
- `/agent/listings` — management table with status cycling + **Free-plan 10-listing cap** enforcement.
- `/agent/listings/:id` — create/edit draft with virtual-tour URL.
- `/agent/leads` — master-detail inbox with tabs, reply, assign, status control.
- `/agent/profile` — **full-screen** profile editing with an **enterprise image uploader** (drag-drop, validation, progress, full-screen preview).
- `/agent/settings` — **full-screen, enterprise-grade** 8-section settings (Account, Notifications, Security, Privacy, Appearance, Integrations, Billing, Danger Zone) with **plan-aware billing & upgrade**.
- `/agent/notifications` and `/admin` (oversight + roster).

**Design system**
- Royal-blue accent system (#0D47A1 light / #2F6BFF dark) via CSS custom properties — **zero hardcoded hex** in components.
- Poppins typography, 4px spacing scale, restrained radii (6–20px).
- Light + dark mode via `data-theme` on `<html>`, no-flash inline script, system detection, persistence.
- ThemeToggle with a bounded `translateX` indicator (overflow:hidden).
- Dropdown / surface text-contrast guarantee for both themes.

**Component library**
- Button, Input (+right slot), Textarea, Select, Toggle, RadioCard, Checkbox, Badge, Avatar, Modal, ConfirmDialog, EmptyState, LoadingState, ErrorState, Tabs, Breadcrumb, Tooltip, SectionLabel.
- Logo (JPEG mark + wordmark), ThemeToggle, ToastViewport, StatTile (count-up), ListingCard, KpiCard, Stars, ImageUploader.

**State management**
- Context + useReducer stores: AuthStore (with `SET_PLAN`), UIStore (theme + toasts), LeadStore, SavedSearchStore.
- `usePersistedReducer` with cross-tab sync; transient toasts cleared on reload.

**API layer**
- `request<T>()` + `mockFetch<T>()` — single `VITE_API_URL` swap point.
- Typed datasets: 12 listings, 6 agents, 4 neighborhoods, market stats, 9 leads.
- Zero `any`, `noUncheckedIndexedAccess`-compliant.

**3D & animation**
- Three.js: `Hero3D` particle grid, `BuildingHero` (orbiting architectural towers), `BuildingTour` (12-stop interactive tour) — all lazy, IntersectionObserver-gated, WebGL-fallback, full GPU disposal on unmount.
- GSAP Core + ScrollTrigger: scroll reveals, page transitions, hero entrance, count-ups, payment-success sequence — all reduced-motion aware and cleaned on unmount.

**Governance**
- `.eslintrc.json` (TS strict, no-explicit-any, import/order), `.prettierrc`, `.gitignore`, `.env.example`, `vercel.json` (SPA rewrites + security headers + immutable asset cache), `tsconfig.json` (strict, noUncheckedIndexedAccess, bundler resolution).
- `docs/Parameter_Schema.md` and `docs/Security_Key_Flow.md` for the backend integration team.

### Fixed
- Pricing no longer routes the Free plan to checkout.
- Login no longer grants Pro — Free only until checkout completes.
- `/payment` and `/payment/success` redirect to `/pricing` when reached without a selected plan (no free Pro).
- Dropdown/menus now read clearly in both light and dark modes.
