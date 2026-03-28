# Virelle Studios — Enterprise-Level Audit Report

**Date:** February 27, 2026  
**Scope:** Full codebase audit — server, frontend, database, deployment, security

---

## Executive Summary

The Virelle Studios app is a comprehensive AI-powered film production platform with 29 pages, 15+ backend router groups, and deep AI integration. After a thorough audit of every file, here is a prioritized breakdown of what's missing, broken, or needs improvement to reach enterprise level.

---

## CRITICAL — Must Fix (Breaks Functionality)

### 1. Poster `generateCopy` uses wrong parameter name
**File:** `server/routers.ts` line 2926  
**Issue:** Uses `responseFormat` (camelCase) instead of `response_format` (snake_case). The `invokeLLM` function expects `response_format`. This means the LLM call won't use structured JSON output, and the response will be unparseable — breaking the AI copy generation in the Ad & Poster Maker.  
**Fix:** Change `responseFormat` to `response_format`.

### 2. 10 unsafe `JSON.parse` calls without try-catch
**File:** `server/routers.ts` — lines 793, 973, 1404, 1472, 1582, 1765, 1824, 1951, 2021, 2136  
**Issue:** If the LLM returns malformed JSON (which happens — especially under load or with rate limits), these will throw unhandled exceptions and crash the request, returning a 500 error to the user with no useful message.  
**Fix:** Wrap each in try-catch with meaningful error messages and fallback behavior.

### 3. Many endpoints lack user ownership verification
**File:** `server/routers.ts`  
**Issue:** Multiple `mutation` and `query` endpoints accept an `id` or `projectId` but don't verify the resource belongs to `ctx.user.id`. Examples:
- `character.update` (line 264) — `async ({ input })` — no user check
- `character.delete` (line 271) — `async ({ input })` — no user check
- `scene.update` (line 525) — `async ({ input })` — no user check
- `scene.delete` (line 549) — `async ({ input })` — no user check
- `scene.reorder` (line 556) — `async ({ input })` — no user check
- `budget.delete` (line 2147) — `async ({ input })` — no user check
- `soundEffect.update/delete` — no user check
- `visualEffect.update/delete` — no user check
- `collaboration.updateRole/remove` — no user check

**Impact:** Any authenticated user can modify/delete any other user's characters, scenes, budgets, sound effects, VFX, and collaborators by guessing IDs.  
**Fix:** Add `ctx.user.id` ownership verification to every mutation that modifies user-owned resources.

---

## HIGH — Should Fix (Degrades Experience)

### 4. No error boundaries on frontend pages
**Issue:** If any page component throws a React error (e.g., undefined data, network failure), the entire app crashes with a white screen. No error boundary catches and displays a user-friendly message.  
**Fix:** Add a React ErrorBoundary component wrapping each page route.

### 5. No loading/error states on several pages
**Issue:** Several pages call tRPC queries but don't handle loading or error states gracefully. If the API is slow or fails, users see either nothing or a crash.  
**Fix:** Add consistent loading skeletons and error states across all pages.

### 6. No rate limiting on AI endpoints
**Issue:** Endpoints like `quickGenerate`, `generatePreview`, `generateTrailer`, `directorChat.send`, `poster.generateImage`, `poster.generateCopy`, `budget.generate`, `shotList.generate`, `continuity.check`, `dialogue.aiSuggest`, `dialogue.aiGenerateScene`, `script.aiGenerate`, `script.aiAssist`, `location.aiSuggest`, `character.aiGenerate`, `character.aiGenerateFromPhoto` all call external AI APIs with no rate limiting. A single user could spam these and rack up massive API costs.  
**Fix:** Add per-user rate limiting (e.g., X requests per minute per endpoint category).

### 7. No request size limits on base64 file uploads
**Issue:** Endpoints like `movie.upload`, `movie.uploadThumbnail`, `soundEffect.upload`, `directorChat.uploadAttachment` accept base64-encoded files via tRPC mutations. There's no server-side file size limit. A user could upload a 2GB file as base64 (which would be ~2.7GB in the request body), potentially crashing the server.  
**Fix:** Add `z.string().max(MAX_SIZE)` validation on base64 inputs, or switch to multipart upload.

### 8. Admin endpoint lacks proper role check
**File:** `server/routers.ts` line 125  
**Issue:** `admin.listUsers` uses `protectedProcedure` but the role check is done inside the handler (`if (ctx.user.role !== "admin")`). If the check is bypassed or the role field is manipulated, non-admins could access admin data.  
**Fix:** Create an `adminProcedure` middleware that checks role before the handler runs.

---

## MEDIUM — Should Improve (Below Enterprise Standard)

### 9. No input sanitization/XSS protection
**Issue:** User-provided strings (titles, descriptions, plot summaries, chat messages) are rendered directly in the frontend without sanitization. If a user inputs `<script>alert('xss')</script>` in a project title, it could execute in other users' browsers (especially in collaboration scenarios).  
**Fix:** Use proper HTML escaping or a sanitization library. React's JSX auto-escapes most cases, but `dangerouslySetInnerHTML` or similar patterns should be audited.

### 10. No pagination on list endpoints
**Issue:** Endpoints like `project.list`, `character.list`, `movie.list`, `soundEffect.list`, etc. return ALL records for a user with no pagination. As users create more content, these queries will get slower and the frontend will receive increasingly large payloads.  
**Fix:** Add cursor-based or offset pagination to all list endpoints.

### 11. No caching strategy
**Issue:** Every page load re-fetches all data from the server. There's no stale-while-revalidate, no optimistic updates (except a few mutations), and no cache invalidation strategy.  
**Fix:** Configure tRPC/React Query with proper `staleTime`, `cacheTime`, and selective invalidation.

### 12. No logging/monitoring
**Issue:** No structured logging, no error tracking (Sentry, etc.), no performance monitoring. If something fails in production, there's no way to diagnose it without SSH-ing into the server.  
**Fix:** Add structured logging (winston/pino), error tracking (Sentry), and basic APM.

### 13. No database connection pooling configuration
**Issue:** The database connection is created once in `db.ts` but there's no explicit connection pool configuration, no retry logic, and no graceful shutdown handling.  
**Fix:** Configure connection pool size, add retry logic, and handle SIGTERM gracefully.

### 14. No email sending for password reset
**File:** `server/routers.ts` line 78-95  
**Issue:** The `requestPasswordReset` endpoint generates a reset token and saves it to the database, but the actual email sending is commented out or missing. The token is returned in the API response (which is a security issue — it should only be sent via email).  
**Fix:** Integrate an email service (SendGrid, SES, Resend) and send the reset link via email instead of returning it in the response.

### 15. Password reset token returned in API response
**File:** `server/routers.ts`  
**Issue:** The reset token is returned directly to the client. This defeats the purpose of email-based password reset — anyone who calls the API can reset any account.  
**Fix:** Only send the token via email, return a generic "if the email exists, we sent a reset link" message.

---

## LOW — Nice to Have (Polish & Completeness)

### 16. ComponentShowcase page has grid-cols-3 without mobile breakpoint
**File:** `client/src/pages/ComponentShowcase.tsx` line 894  
**Fix:** Change to `grid-cols-1 sm:grid-cols-3` (low priority since this is a dev-only page).

### 17. 21 backend endpoints are never called from the frontend
**Unused endpoints:** `generation.getJob`, `generation.pauseJob`, `generation.resumeJob`, `scene.get`, `soundtrack.get`, `soundtrack.listByScene`, `soundtrack.update`, `credit.update`, `location.get`, `location.update`, `moodBoard.update`, `subtitle.get`, `soundEffect.presets`, `soundEffect.listByScene`, `visualEffect.listByScene`, `collaboration.accept`, `collaboration.decline`, `movie.get`, `movie.update`  
**Impact:** Dead code that increases maintenance burden. Some of these (like `movie.update`, `collaboration.accept/decline`) suggest features that were planned but never wired up in the UI.  
**Fix:** Either wire them up in the frontend or remove them.

### 18. No favicon or proper meta tags
**Issue:** Missing proper `<meta>` tags for SEO, social sharing (Open Graph), and mobile viewport optimization.  
**Fix:** Add proper meta tags, favicon, and Open Graph images.

### 19. No PWA support
**Issue:** For an enterprise film production tool, Progressive Web App support (offline access, installability, push notifications) would significantly improve the user experience.  
**Fix:** Add a service worker, manifest.json, and offline fallback.

### 20. No automated tests
**Issue:** Zero test files in the entire project. No unit tests, no integration tests, no E2E tests.  
**Fix:** Add at minimum: unit tests for critical server logic (LLM parsing, image generation), integration tests for tRPC endpoints, and E2E tests for the main user flows.

### 21. No CI/CD pipeline
**Issue:** No GitHub Actions, no automated testing, no automated deployment checks. Changes go straight to production.  
**Fix:** Add GitHub Actions for TypeScript checking, linting, and automated deployment.

---

## Summary Table

| Priority | Count | Category |
|----------|-------|----------|
| CRITICAL | 3 | Broken functionality, security vulnerabilities |
| HIGH | 5 | Degraded experience, cost risks, security gaps |
| MEDIUM | 7 | Below enterprise standard |
| LOW | 6 | Polish, completeness, best practices |
| **TOTAL** | **21** | |

---

## Recommended Action Plan

**Phase 1 (Immediate):** Fix #1 (poster responseFormat), #2 (JSON.parse safety), #3 (ownership checks)  
**Phase 2 (This week):** Fix #4-8 (error boundaries, rate limiting, file size limits, admin middleware)  
**Phase 3 (This sprint):** Fix #9-15 (XSS, pagination, caching, logging, email, password reset)  
**Phase 4 (Next sprint):** Fix #16-21 (dead code cleanup, meta tags, PWA, tests, CI/CD)
