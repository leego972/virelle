# Virelle Studios — Opener Video Behaviour Reference

This document exists so that if the opener ever breaks again it can be diagnosed and fixed
without needing to explain the intended behaviour from scratch.

---

## What the Opener Is

The **StudioOpener** (`apps/web/client/src/components/StudioOpener.tsx`) is a full-screen
cinematic splash that plays the official Virelle Studios video, or falls back to an SVG
animation if the video cannot load.

---

## When It MUST Fire — The Three Login Rules

### 1. After a successful email/password login
- **File:** `apps/web/client/src/pages/Login.tsx`
- **Trigger:** `loginMutation.onSuccess` → `setShowOpener(true)`
- The opener replaces the login form full-screen.
- On complete → navigates to `/` (dashboard).

### 2. After a successful OAuth login (Google / GitHub)
- **File:** `apps/web/server/_core/oauth.ts`
- **Trigger:** server does `res.redirect(302, '/?opener=1')` after the OAuth callback.
- `Home.tsx` reads `?opener=1` and calls `setShowOpener(true)`.
- On complete → param is cleared, dashboard shown normally.

### 3. After successful registration (new account)
- **File:** `apps/web/client/src/pages/Register.tsx`
- **Trigger:** `registerMutation.onSuccess` → `setShowWelcome(true)`
- Welcome checklist screen appears first.
- When user clicks **'Enter Your Studio'** → `setShowOpener(true)`
- Opener plays, then navigates to `/`.

---

## When It MUST Fire — Playing Content in My Movies

**File:** `apps/web/client/src/pages/Movies.tsx`

The `playMovie(movieId, movieType)` helper controls this:

| Movie type   | Opener plays? | Notes                                  |
|--------------|---------------|----------------------------------------|
| `film`       | YES           | Full generated film                    |
| `trailer`    | YES           | Generated trailer or advertisement     |
| `scene`      | NO            | Individual scene clip — plays directly |

The opener is triggered via `setShowOpenerBefore(movieId)`.
When it completes, `setShowPlayer(movieId)` opens the media player.

The condition to check/fix if this breaks:
```
const playMovie = useCallback((movieId, movieType) => {
  if (movieType === 'film' || movieType === 'trailer') {
    setShowOpenerBefore(movieId);  // opener plays first
  } else {
    setShowPlayer(movieId);        // scenes play directly, no opener
  }
}, []);
```

---

## Fallback Chain Inside StudioOpener

The opener tries three things in order:

1. **Official video** — CDN URL hardcoded in StudioOpener.tsx
   - Loads → plays the video, fires `onComplete` when it ends.
   - Fails (`onError`) OR no `canplay` within **5 seconds** → falls through.

2. **Showcase scene videos** — fetched via `trpc.showcase.opener.useQuery()`
   - If the server finds a project titled 'Opener', its scenes play sequentially.

3. **SVG animation** — fully procedural (dove, shield, gold text). Always works.
   Runs 8 seconds then fires `onComplete`.

The 5-second timeout (to prevent permanent black screen on silent CDN failure):
```
useEffect(() => {
  if (openerVideoReady || openerVideoFailed) return;
  const fallback = setTimeout(() => setOpenerVideoFailed(true), 5000);
  return () => clearTimeout(fallback);
}, [openerVideoReady, openerVideoFailed]);
```

---

## Common Breakage Scenarios

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Black screen that never clears | Video URL expired | 5s timeout will fall back to SVG — or update URL in StudioOpener.tsx |
| Opener fires before individual scene clips | playMovie condition too broad | Ensure only 'film' and 'trailer' trigger it, never 'scene' |
| Opener doesn't fire after email login | setShowOpener not called | Check loginMutation.onSuccess in Login.tsx |
| Opener doesn't fire after OAuth | Server not redirecting to /?opener=1 | Check oauth.ts — must redirect to /?opener=1 on success |
| Opener doesn't fire after registration | Button onClick broken | Check Register.tsx — button must call setShowOpener(true), not navigate('/') |

---

## Files to Check When the Opener Breaks

```
apps/web/client/src/components/StudioOpener.tsx   <- the component itself
apps/web/client/src/pages/Login.tsx               <- fires after email/password login
apps/web/client/src/pages/Register.tsx            <- fires after registration
apps/web/client/src/pages/Home.tsx                <- fires after OAuth (reads ?opener=1)
apps/web/client/src/pages/Movies.tsx              <- fires before films/trailers in My Movies
apps/web/server/_core/oauth.ts                    <- must redirect to /?opener=1 on success
```