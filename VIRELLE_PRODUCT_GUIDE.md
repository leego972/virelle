# VirElle Studios — Product & System Reference Guide

> **Last updated:** May 2026
> This is the complete reference for anyone debugging, maintaining, or onboarding to Virelle Studios.
> Covers membership tiers, credits, Stripe, database keys, environment variables, and breakage diagnosis.

---

## 1. Membership Tiers

> **Source of truth:** `apps/web/server/_core/stripeProvisioning.ts` (creates actual Stripe products on startup)
> Frontend display: `apps/web/client/src/pages/Pricing.tsx`

### Self-Serve Tiers (monthly/annual toggle on the Pricing page)

| Display Name | DB Key | Monthly (AUD) | Annual (AUD) | Credits/mo | Max Projects | Resolution |
|---|---|---|---|---|---|---|
| **Indie** | `indie` | A$149 | A$1,490 | 500 | 2 | 720p |
| **Creator** | `amateur` | A$490 | A$4,900 | 2,000 | 10 | 1080p |
| **Studio** | `independent` | A$1,490 | A$14,900 | 6,000 | 25 | 4K + ProRes |

> **Important:** The DB keys and display names are DIFFERENT. `amateur` shows as "Creator", `independent` shows as "Studio".
> If you see `amateur` in the database, that user is on the **Creator** plan. Never rename these DB keys.

### Consultative / Enterprise Tiers (no self-checkout — contact sales)

| Display Name | DB Key | Price | Credits/mo | Max Projects |
|---|---|---|---|---|
| **Production** | `studio` | From A$150,000/year | 15,500 | 100 |
| **Enterprise** | `industry` | Custom | 50,500 | Unlimited |

> These tiers are provisioned manually. The Stripe prices exist but self-checkout is disabled in the UI.

### Special Tier

| Display Name | DB Key | Notes |
|---|---|---|
| **Beta** | `beta` | Manual grant — same limits as Creator, no payment required |

---

## 2. Founding Member Offer

> **50% off the first year** on annual billing. Applied via Stripe coupon `VIRELLE_FOUNDER_50`.
> Only 50 founding spots available. Counter lives in the database.

| Tier | Normal Annual Price | Founder First Year | Second Year+ |
|---|---|---|---|
| Indie | A$1,490 | A$745 | A$1,490 |
| Creator | A$4,900 | A$2,450 | A$4,900 |
| Studio | A$14,900 | A$7,450 | A$14,900 |

**If the founding offer seems broken:**
- Check `trpc.subscription.foundingSpots` query — returns `{ spotsRemaining, isFull }`
- Check the DB `foundingMemberSlots` table (or equivalent counter)
- Verify the `VIRELLE_FOUNDER_50` coupon is still active in the Stripe dashboard

---

## 3. Credits System

> Credits are the in-app currency. Every action costs credits. Membership grants a monthly allocation.

### Credit costs per action

| Action | Credits |
|---|---|
| Create New Project | **FREE** |
| Generate Film (AI scene breakdown) | 10 |
| Generate Scene Video (≤45 s) | 10 |
| Regenerate Scene Video | 8 |
| Generate Preview Image | 3 |
| Bulk Generate All Previews (per scene) | 3 |
| Bulk Generate All Videos (per scene) | 10 |
| Virelle AI Chat (per message) | 2 |
| AI Script Writer | 8 |
| AI Storyboard Generation | 8 |
| AI Dialogue Polish | 5 |
| AI Continuity Check | 5 |
| AI Shot List Generation | 5 |
| Subtitle Generation | 8 |
| Budget Estimate AI | 5 |
| Trailer Generation | 20 |
| Ad/Poster Generation | 5 |
| Export Final Film | 8 |

> **Source:** `apps/web/client/src/pages/Pricing.tsx` (CREDIT_COSTS array) and `apps/web/server/_core/subscription.ts`

### Credit top-up packs (one-time purchases, AUD)

| Pack Name | Credits | Price | Per Credit | Saving |
|---|---|---|---|---|
| Starter Pack | 500 | A$750 | A$1.50 | — |
| Producer Pack | 1,500 | A$1,800 | A$1.20 | Save 20% |
| Director Pack | 3,000 | A$3,150 | A$1.05 | Save 30% |
| Studio Pack | 6,000 | A$5,400 | A$0.90 | Save 40% |
| Blockbuster Pack | 12,000 | A$9,000 | A$0.75 | Save 50% |
| Mogul Pack | 25,000 | A$15,000 | A$0.60 | Save 60% |

> **Source of truth:** `apps/web/server/_core/stripeProvisioning.ts` (CREDIT_PACK_PRICES array)

---

## 4. Stripe Setup

### How Stripe is initialised

- On server startup, `stripeProvisioning.ts` auto-creates all Stripe Products and Prices if they don't exist.
- If `STRIPE_<TIER>_<INTERVAL>_PRICE_ID` env vars are set, it uses those. Otherwise it creates new ones.
- After creation, the IDs are cached in memory (`resolvedPriceIds`) and used for checkout.

### Required Stripe environment variables

```
STRIPE_SECRET_KEY             # Stripe secret key (sk_live_... or sk_test_...)
STRIPE_PUBLISHABLE_KEY        # Stripe publishable key (pk_live_... or pk_test_...)
STRIPE_WEBHOOK_SECRET         # Stripe webhook signing secret (whsec_...)

# Optional — if set, these are used instead of auto-creating new prices:
STRIPE_INDIE_MONTHLY_PRICE_ID
STRIPE_INDIE_ANNUAL_PRICE_ID
STRIPE_CREATOR_MONTHLY_PRICE_ID
STRIPE_CREATOR_ANNUAL_PRICE_ID
STRIPE_STUDIO_MONTHLY_PRICE_ID
STRIPE_STUDIO_ANNUAL_PRICE_ID
STRIPE_PRODUCTION_MONTHLY_PRICE_ID
STRIPE_PRODUCTION_ANNUAL_PRICE_ID
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
```

### Stripe webhook events handled

| Event | What it does |
|---|---|
| `checkout.session.completed` | Activates subscription, grants credits |
| `customer.subscription.updated` | Updates tier/billing in DB |
| `customer.subscription.deleted` | Downgrades user to free/no plan |
| `invoice.payment_succeeded` | Tops up monthly credits |
| `invoice.payment_failed` | Flags payment failure |

> **Webhook URL:** `https://virelle.life/api/webhooks/stripe`

---

## 5. Full Environment Variable Reference

```
# Core
DATABASE_URL                  # PostgreSQL connection string
JWT_SECRET                    # Cookie/session signing secret
NODE_ENV                      # 'production' or 'development'

# Auth / OAuth
OAUTH_SERVER_URL              # OAuth provider URL
OWNER_OPEN_ID                 # Admin owner's Open ID (grants admin access)
VITE_APP_ID                   # App ID for Replit OAuth

# Email
GMAIL_USER                    # Gmail address used for transactional email
GMAIL_APP_PASSWORD            # Gmail app password (not your Google password)
EMAIL_FROM                    # From address, default: noreply@virelle.life

# AI / Generation (BYOK — user provides their own keys in Settings)
BUILT_IN_FORGE_API_URL        # Internal AI generation proxy URL
BUILT_IN_FORGE_API_KEY        # Internal AI generation proxy key

# Stripe (see Section 4)
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
# ...plus per-tier price IDs listed in Section 4
```

---

## 6. Key Features Per Tier

| Feature | Indie | Creator | Studio | Production | Enterprise |
|---|---|---|---|---|---|
| AI Script Writer | Yes | Yes | Yes | Yes | Yes |
| AI Chat (Director's Assistant) | Yes | Yes | Yes | Yes | Yes |
| Character Creator & DNA Lock | Yes | Yes | Yes | Yes | Yes |
| Location Scout & Mood Board | Yes | Yes | Yes | Yes | Yes |
| Shot List Generator | Yes | Yes | Yes | Yes | Yes |
| Video Generation | No | Yes | Yes | Yes | Yes |
| AI Voice Acting | No | Yes | Yes | Yes | Yes |
| AI Film Score | No | Yes | Yes | Yes | Yes |
| Trailer Studio | No | Yes | Yes | Yes | Yes |
| TV Commercial / Ad Tools | No | Yes | Yes | Yes | Yes |
| Film Post-Production (ADR, Foley, Mix) | No | No | Yes | Yes | Yes |
| Subtitles (130+ languages) | No | No | Yes | Yes | Yes |
| VFX Suite & Bulk Generation | No | No | Yes | Yes | Yes |
| Ad & Poster Maker | No | No | Yes | Yes | Yes |
| Multi-Shot Sequencer | No | No | No | Yes | Yes |
| NLE / DaVinci Resolve Export | No | No | No | Yes | Yes |
| AI Casting Tool | No | No | No | Yes | Yes |
| White-Label Exports | No | No | No | Yes | Yes |
| API Access & Pipeline Integration | No | No | No | Yes | Yes |
| Custom AI Model Fine-Tuning | No | No | No | No | Yes |
| Dedicated Account Manager | No | No | No | No | Yes |
| Resolution | 720p | 1080p | 4K + ProRes | 4K + ProRes | 4K + ProRes |
| Max projects | 2 | 10 | 25 | 100 | Unlimited |
| Max film duration | 90 min | 90 min | 90 min | 150 min | 180 min |
| Team members | 1 | 1 | 5 | 25 | Unlimited |
| BYOK support | Yes | Yes | Yes | Yes | Yes |

---

## 7. BYOK (Bring Your Own Key)

> Users connect their own third-party API keys in **Settings**. Virelle routes generation through their key.
> This keeps costs transparent and gives users full quality control.

| Service | Used For | Where to get key |
|---|---|---|
| Runway | Video generation | app.runwayml.com |
| Sora (OpenAI) | Video generation | platform.openai.com |
| Kling | Video generation | klingai.com |
| Veo (Google) | Video generation | deepmind.google |
| fal.ai | Video / image generation | fal.ai |
| Replicate | Video / image generation | replicate.com |
| Luma AI | Video generation | lumalabs.ai |
| ElevenLabs | AI Voice Acting | elevenlabs.io |
| Suno v4 | AI Film Score | suno.com |
| OpenAI | AI Chat / Script | platform.openai.com |
| Anthropic | AI Chat / Script | console.anthropic.com |
| Google Gemini | AI Chat / Script | aistudio.google.com |

> **If video/voice generation is broken:** Check the user's BYOK keys in Settings first before assuming server bug.

---

## 8. How Generation Works (Film Pipeline)

1. **User creates a project** → free, no credits used
2. **AI Script Writer** generates screenplay → 8 credits
3. **AI breaks film into scenes** (Generate Film) → 10 credits
4. **Storyboard / Shot List generated** per scene → 8 credits / 5 credits
5. **Preview images generated** per scene → 3 credits each
6. **Scene videos generated** via BYOK video engine → 10 credits each
7. **Voice acting, film score, subtitles** layered on → 5-8 credits each
8. **Trailer Studio** generates trailer from scenes → 20 credits
9. **Export** final film → 8 credits

Key server files:
- `server/_core/filmPipeline.ts` — orchestrates film generation
- `server/_core/videoGeneration.ts` — routes video gen to BYOK provider
- `server/_core/unifiedVideoEngine.ts` — unified interface across Runway/Kling/Sora/etc.
- `server/_core/voiceActingEngine.ts` — ElevenLabs voice acting
- `server/_core/soundtrackEngine.ts` — Suno music generation
- `server/_core/videoStitcher.ts` — stitches scenes into final film

---

## 9. Database — Key Tables & Schema Files

> **Schema location:** `apps/web/drizzle/schema.ts`
> **Migrations:** `apps/web/drizzle/` (auto-migrated on server start via `autoMigrate.ts`)

| Table / Field | Purpose |
|---|---|
| `users.subscriptionTier` | The DB key string: `indie`, `amateur`, `independent`, `studio`, `industry`, `beta` |
| `users.credits` | Current credit balance |
| `users.stripeCustomerId` | Links user to their Stripe customer |
| `users.stripeSubscriptionId` | Active Stripe subscription ID |
| `users.billingInterval` | `monthly` or `annual` |
| `users.subscriptionStatus` | `active`, `past_due`, `canceled`, etc. |

> **Admin panel:** `/admin/users` — view/edit user tiers and credits directly

---

## 10. Breakage Diagnosis Checklist

### Subscription / Payments

| Symptom | First place to check | Fix |
|---|---|---|
| Checkout button does nothing | Browser console for tRPC error | Check `STRIPE_SECRET_KEY` env var is set |
| Payment succeeds but tier not upgraded | Stripe dashboard → Webhooks → Recent deliveries | Verify `STRIPE_WEBHOOK_SECRET` is correct |
| Credits not refreshing monthly | `invoice.payment_succeeded` webhook | Check webhook handler in `server/_core/subscription.ts` |
| Founding offer not showing | `spotsRemaining` returns 0 | Check founding spots counter in DB or reset via `/admin` |
| Wrong price shown | Mismatch between `Pricing.tsx` and `stripeProvisioning.ts` | `stripeProvisioning.ts` is source of truth — update `Pricing.tsx` to match |
| User can't access a feature | Tier limit check failing | Check `getTierLimits()` in `subscription.ts` for that tier key |

### Video / Generation

| Symptom | First place to check | Fix |
|---|---|---|
| Video generation fails | User's BYOK keys in Settings | Ask user to re-enter API keys |
| All video gen fails (not just one user) | `server/_core/unifiedVideoEngine.ts` logs | Check `BUILT_IN_FORGE_API_KEY` env var |
| Film export hangs | `server/_core/videoStitcher.ts` | Check S3/storage credentials in env vars |
| Trailer not generating | `generateTrailer` tRPC mutation | Check `server/_core/filmPipeline.ts` |

### Auth / Login

| Symptom | First place to check | Fix |
|---|---|---|
| Can't log in | `/api/auth/login` returns error | Check `JWT_SECRET` env var is set |
| OAuth login fails | `/api/auth/oauth` redirect | Check `OAUTH_SERVER_URL` and `VITE_APP_ID` |
| Admin panel inaccessible | `OWNER_OPEN_ID` check | Verify `OWNER_OPEN_ID` matches your user's openId in DB |
| Email verification not sending | Email service logs | Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars |

### CI / Deployment

| Symptom | First place to check | Fix |
|---|---|---|
| E2E tests fail with DNS error | `E2E_BASE_URL` GitHub var | Update to current Railway URL (`https://virelle.life`) |
| Build fails | TypeScript errors in CI logs | Run `pnpm run typecheck` locally |
| Deployed app crashes on start | Railway deployment logs | Check all required env vars are set in Railway |

---

## 11. Key Files Quick-Reference

```
apps/web/
  client/src/pages/
    Pricing.tsx             <- Tier display, credit cost table, FAQ, checkout flow
    Movies.tsx              <- Film/trailer/scene player (opener logic)
    TrailerStudio.tsx       <- Trailer generation (opener fires on complete)
    TVCommercial.tsx        <- Ad script generation (opener fires on complete)
    Login.tsx               <- Login (opener fires on success)
    Register.tsx            <- Registration (opener fires on complete)
    Settings.tsx            <- User BYOK key management
    AdminUsers.tsx          <- Admin: view/edit users, tiers, credits
  client/src/components/
    StudioOpener.tsx        <- Branded intro animation (see VIRELLE_OPENER_GUIDE.md)
  server/
    _core/
      subscription.ts       <- Tier definitions, credit limits, Stripe integration
      stripeProvisioning.ts <- Auto-creates Stripe products/prices on startup (PRICING SOURCE OF TRUTH)
      env.ts                <- All environment variable declarations
      filmPipeline.ts       <- Orchestrates film generation
      videoGeneration.ts    <- Routes video gen to BYOK provider
      unifiedVideoEngine.ts <- Unified interface: Runway, Kling, Sora, Veo, fal.ai
      voiceActingEngine.ts  <- ElevenLabs voice acting
      soundtrackEngine.ts   <- Suno music generation
      videoStitcher.ts      <- Final film stitching
      oauth.ts              <- OAuth login, adds ?opener=1 on success
    routers.ts              <- tRPC router tree
  drizzle/
    schema.ts               <- Database schema (users, projects, scenes, credits)
  .github/workflows/
    ci.yml                  <- CI pipeline (typecheck, lint, build, e2e)
```

---

## 12. Production URLs

| Environment | URL |
|---|---|
| Production | https://virelle.life |
| Production (www) | https://www.virelle.life |
| Railway service | https://virellestudios-production.up.railway.app |
| Staging | https://virellestudios-staging.up.railway.app |
| Stripe webhook endpoint | https://virelle.life/api/webhooks/stripe |

> **Railway project ID:** `5645be0d-ee5b-4b95-824e-c8894305c794`
