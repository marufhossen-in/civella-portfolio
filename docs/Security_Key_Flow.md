# Security — Environment Variable & Key Flow

> Reference diagram for the **Backend Integration Team**.
> This document describes `docs/Security_Key_Flow.png`. It shows how environment
> variables flow from `.env.example` through the Vite build pipeline to the browser,
> and where the **exposure boundary** sits — i.e. what is safe to ship vs. what must
> never leave the server.

---

## 1. The golden rule

> **If it is in a `VITE_` variable, assume it is public.**
> **If it is a secret, it must live server-side only.**

Vite inlines every `VITE_`-prefixed variable into the built JavaScript bundle
(`dist/`). Anything inlined is readable by anyone who opens the browser devtools.
Therefore `VITE_` vars are **public by design** and must never contain credentials.

---

## 2. Swim-lane flow

```
 ┌─────────────────────────── GREEN ───────────────────────────┐   ┌── AMBER ──┐   ┌──────── RED ────────┐
 │  Safe to commit / public                                    │   │ CI/Vercel │   │ NEVER in VITE_       │
 │                                                             │   │  env only │   │ (server-side only)    │
 │  .env.example (template, committed)                         │   │           │   │                      │
 │   VITE_APP_NAME="Civella"                                   │   │ VITE_API_ │   │ Supabase service-role│
 │   VITE_MAP_STYLE_URL="https://demotiles…"                   │   │   URL     │   │ DB password          │
 │   VITE_FLAG_*="true"                                        │   │ VITE_MAP_ │   │ n8n webhook secret   │
 │   VITE_BUILD_SHA="<ci>"                                     │   │   ACCESS_ │   │ Stripe secret key    │
 │                                                             │   │   TOKEN   │   │ JWT signing secret   │
 │           │                                                 │   │ VITE_ANAL │   │ SMTP password        │
 │           ▼                                                 │   │   YTICS_  │   │                      │
 │  developer .env (real values, gitignored)                   │   │   URL     │   │ These stay on the    │
 │           │                                                 │   │           │   │ server / in a secrets│
 │           ▼                                                 │   └─────┬─────┘   │ manager — NEVER      │
 │  Vite build pipeline                                        │         │         │ reach the browser.   │
 │  (only VITE_* are inlined; others dropped)                  │         │         └──────────────────────┘
 │           │                                                 │         │
 │           ▼                                                 │         ▼
 │  dist/assets/*.js  ──────────▶  BROWSER (network tab)       │
 │  • VITE_API_URL        readable ✅ (public)                  │
 │  • VITE_MAP_ACCESS_…   readable ✅ (public, low-priv)         │
 │  • service_role        ABSENT   ✅ (never inlined)            │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Zone definitions

| Zone | Examples | Where it lives | Browser-visible? |
|------|----------|----------------|------------------|
| 🟢 **Green** (safe / public) | `VITE_APP_NAME`, `VITE_MAP_STYLE_URL`, `VITE_FLAG_*`, `VITE_BUILD_SHA` | `.env` (committed template) + CI | Yes — intended |
| 🟡 **Amber** (CI/Vercel env, not in repo) | `VITE_API_URL`, `VITE_MAP_ACCESS_TOKEN`, `VITE_ANALYTICS_URL` | Vercel/dashboard env only | Yes — low-priv tokens only |
| 🔴 **Red** (NEVER `VITE_`) | Supabase service-role key, DB password, n8n secret, Stripe secret, JWT sign secret, SMTP password | Server / secrets manager | **Never** |

---

## 4. How secrets stay out of the bundle

1. The developer keeps real secrets in a server-side `.env` or secrets manager — **not** in the frontend repo.
2. Vite only exposes variables prefixed with `VITE_` to `import.meta.env`.
3. Any variable **without** the `VITE_` prefix is invisible to the build and never reaches `dist/`.
4. The frontend only ever sends a **public** bearer token (from `AuthStore` / `civella.session`) in the `Authorization` header. The backend validates it; it never receives server secrets.

```
Browser                                  Backend
  │                                        │
  │  request<T>() with Authorization:      │
  │  Bearer <public session token>         │
  ├───────────────────────────────────────▶│ validates token (server secret)
  │                                        │ uses DB / Stripe / n8w secrets HERE
  │  JSON (typed interface)                │
  │◀───────────────────────────────────────┤ never echoes secrets back
```

---

## 5. Pre-deploy checklist

- [ ] `grep -rEi "service_role|secret|password|jwt" dist/` returns **nothing**.
- [ ] Only `VITE_*` variables appear in the built bundle.
- [ ] `VITE_API_URL`, `VITE_MAP_ACCESS_TOKEN`, `VITE_ANALYTICS_URL` are set in the
      Vercel environment (amber zone), **not** committed.
- [ ] No red-zone credential is referenced anywhere in `src/`.

---

## 6. Summary

- **Public by default:** every `VITE_` var is readable in the browser — keep it low-priv.
- **Secrets stay server-side:** service-role keys, DB passwords, signing secrets, and
  payment secrets never get a `VITE_` prefix and never reach `dist/`.
- **One swap point:** `VITE_API_URL` switches the frontend between bundled mock data
  and your live API with no code changes.
