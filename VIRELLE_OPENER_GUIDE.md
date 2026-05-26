# VirElle Studios — StudioOpener Reference Guide

> **Last updated:** May 2026
> The StudioOpener is the branded intro animation that plays at key moments in the VirElle Studios experience.

---

## Where the opener plays

| Trigger | File | Mechanism | Skippable |
|---|---|---|---|
| Email/password login | `Login.tsx` | `loginMutation.onSuccess` → `setShowOpener(true)` | No |
| OAuth login (Google/GitHub) | `server/_core/oauth.ts` | Redirect to `/?opener=1`; `Home.tsx` reads param | No |
| Registration complete | `Register.tsx` | "Enter Your Studio" button → `setShowOpener(true)` → `navigate("/")` | No |
| Play a **film** in My Movies | `Movies.tsx` | `playMovie()` when `type === "film"` → `setShowOpenerBefore(true)` | No |
| Play a **trailer** in My Movies | `Movies.tsx` | `playMovie()` when `type === "trailer"` → `setShowOpenerBefore(true)` | No |
| Play a **scene clip** in My Movies | `Movies.tsx` | Skipped — `type === "scene"` goes straight to player | — |
| Trailer generation complete | `TrailerStudio.tsx` | `generateTrailer.onSuccess` → `setShowOpener(true)` | Yes |
| TV Commercial script generation | `TVCommercial.tsx` | `generateAIScript` success → `setShowOpener(true)` | Yes |

---

## StudioOpener component

**File:** `apps/web/client/src/components/StudioOpener.tsx`

### Props

```ts
interface StudioOpenerProps {
  onComplete: () => void;  // called when animation ends (or user skips)
  mode?: "film" | "trailer" | "default";
  skippable?: boolean;     // shows a Skip button if true
}
```

### Fallback chain

1. **Official Virelle branded video** — fetched from CDN
2. **Showcase scenes montage** — if video fails within 5 s
3. **SVG animation** — always works, 8 s, pure CSS

The 5-second timeout ensures a silent CDN/CORS failure never leaves the user on a black screen.

---

## CI / E2E Tests

**File:** `apps/web/.github/workflows/ci.yml`

- `TypeScript`, `Lint`, and `Build` must stay green at all times.
- E2E smoke tests run against the live URL (`E2E_BASE_URL` GitHub Actions variable → `https://virelle.life`).
- The E2E job has `continue-on-error: true` and a **reachability pre-check** — if the URL is unreachable, tests skip gracefully.
- If you redeploy to a new URL, update `E2E_BASE_URL` in **GitHub → Settings → Actions → Variables**.

---

## Breakage checklist

| Symptom | Likely cause | Fix |
|---|---|---|
| Opener plays before scene clips | type guard removed in `Movies.tsx` | Restore `if (type !== "scene")` check in `playMovie()` |
| Opener never shows after login | `loginMutation.onSuccess` navigates instead | Restore `setShowOpener(true)` before navigate |
| Opener hangs on black screen | CDN video 404 + timeout removed | Restore 5 s timeout in `StudioOpener.tsx` |
| Opener missing after trailer generation | `generateTrailer.onSuccess` lost setter | Add `setShowOpener(true)` back in `TrailerStudio.tsx` |
| Opener missing after ad script | `generateAIScript` lost setter | Add `setShowOpener(true)` back in `TVCommercial.tsx` |
| E2E tests block pushes | `E2E_BASE_URL` points to dead URL | Update GitHub var to new Railway/production URL |

---

## Key files

```
apps/web/client/src/
  components/StudioOpener.tsx     <- the opener component
  pages/Login.tsx                 <- login trigger
  pages/Register.tsx              <- registration trigger
  pages/Home.tsx                  <- OAuth redirect trigger (?opener=1)
  pages/Movies.tsx                <- film/trailer trigger; scene skip logic
  pages/TrailerStudio.tsx         <- post-generation trigger
  pages/TVCommercial.tsx          <- post-script-generation trigger
apps/web/server/_core/oauth.ts    <- OAuth redirect adds ?opener=1
apps/web/.github/workflows/ci.yml <- CI pipeline with E2E safety net
```