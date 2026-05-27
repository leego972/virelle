# VirElle Studios

  AI-powered cinematic film production platform. Create, direct, and produce Hollywood-quality movies, trailers, screenplays, and marketing assets with AI.

  **Live:** https://virelle.life · https://www.virelle.life
  **Railway:** https://virellestudios-production.up.railway.app
  **Staging:** https://virellestudios-staging.up.railway.app
  **Inquiries / alerts → studiosvirelle@gmail.com**

  ---

  ## Stack

  | Layer | Technology |
  |---|---|
  | Frontend | React 19 + Vite + wouter (routing) + Tailwind CSS v4 |
  | Backend | Express + tRPC (type-safe RPC, no REST boilerplate) |
  | Database | PostgreSQL + Drizzle ORM |
  | Auth | Session cookies + bcrypt, Google + GitHub OAuth |
  | Payments | Stripe (subscriptions + credits) |
  | AI — LLM | OpenAI GPT-4o / Claude via `server/_core/llm.ts` |
  | AI — Image | Pollinations, NanoBanana · `server/_core/imageGeneration.ts` |
  | AI — Video | Runway, fal.ai, Sora, unified engine · `server/_core/unifiedVideoEngine.ts` |
  | AI — Voice | ElevenLabs (35 emotion states) · `server/_core/voiceActingEngine.ts` |
  | AI — Music | Suno AI, MusicGen · `server/_core/soundtrackEngine.ts` |
  | Storage | AWS S3 · `server/_core/s3Upload.ts` |
  | Email | Nodemailer · `server/email.ts` |
  | Error tracking | Sentry (client + server) |
  | Deployment | Railway via Docker · `railway.toml` + `Dockerfile` |
  | Mobile | Expo SDK 54, React Native, NativeWind |
  | Desktop | Electron · `apps/desktop/` |

  ---

  ## Repository Structure

  ```
  apps/
    web/
      client/src/          ← React frontend
        App.tsx            ← Route definitions (wouter Switch/Route)
        pages/             ← One file per page/screen (70+ pages)
        components/        ← Shared UI components
        components/ui/     ← shadcn/ui primitives (50+ components)
        contexts/          ← ThemeContext, auth contexts
        hooks/             ← useMobile, useSubscription, useComposition
        _core/hooks/       ← useAuth (session management)
        lib/               ← trpc client, utils, sentry init
        index.css          ← ALL theme CSS variables, fonts, watermark
      client/public/       ← Static assets (images, icons, watermarks)
      client/index.html    ← Google Fonts links, SEO meta, viewport
      server/
        _core/             ← Core engine files (LLM, video, image, auth, etc.)
        routers.ts         ← Main tRPC router (all procedures)
        db.ts              ← Drizzle DB instance
        email.ts           ← Email sending via nodemailer
        storage.ts         ← S3 file upload helpers
        *.ts               ← Feature-specific routers (seo, marketing, etc.)
      shared/
        types.ts           ← Shared TypeScript types (Project, Scene, User, etc.)
        const.ts           ← Shared constants (cookie name, etc.)
        feature-registry.ts← Feature flags per subscription tier
      drizzle/             ← DB migrations
      e2e/                 ← Playwright end-to-end tests
    mobile/               ← Expo React Native app
    desktop/              ← Electron wrapper
  packages/               ← Shared packages (if any)
  ```

  ---

  ## Website Layout

  ### Shell / Chrome

  **File:** `components/DashboardLayout.tsx`

  Every authenticated page renders inside this shell:

  ```
  ┌──────────────────────────────────────────────┐
  │  [≡] Sidebar trigger   Logo   🔔 [Avatar ▾]  │  ← Top bar
  ├──────────┬───────────────────────────────────┤
  │          │                                   │
  │  Sidebar │   <page content>                  │
  │  (left)  │                                   │
  │          │   [GlobalRenderQueue bar]         │
  │          │   [LeegoFooter]                   │
  └──────────┴───────────────────────────────────┘
  ```

  **Sidebar navigation groups:**

  | Group | Items |
  |---|---|
  | Studio | Dashboard, Projects, Characters, My Movies, Director's Assistant |
  | Tools | Script Writer, Storyboard, Shot List, Scene Editor, Continuity, Color Grading, Location Scout, Mood Board, Dialogue Editor, Budget Estimator, Sound Effects, Visual Effects, NLE Export, Multi-Shot Sequencer, VFX Suite, Live Action Plate, Screener Generator, AI Casting, Director's Cut, Trailer Studio, TV Commercial, Beat Board |
  | Marketing | Ad Poster Maker, Campaigns, Content Creator |
  | Distribution | Marketplace, Funding Directory, Festival Calendar, Referrals |
  | Production | Production Board, Crew Management, Call Sheet, Script Breakdown, Shooting Schedule, Production Reports, Activity Log, Collaboration |
  | Account | Credits, Settings |
  | Admin (admin only) | Users, Security, Autonomous, Advertising, SEO, Outreach |

  **Sidebar collapses** to icon-only on mobile (uses `useIsMobile()` hook + shadcn Sidebar component).
  Theme toggle (Sun/Moon) is in the sidebar footer — writes to `ThemeContext`, adds/removes `.dark` on `<html>`.

  **GlobalRenderQueue** (`components/GlobalRenderQueue.tsx`): floating bottom bar that shows active AI video generation jobs with progress.

  ---

  ## Pages / Routes

  ### Public pages (no auth required)

  | Route | File | Description |
  |---|---|---|
  | `/welcome` | `Landing.tsx` | Marketing landing page — hero, features (FULL_FILM_FEATURES, VFX_FEATURES, ALL_TOOLS), testimonials, pricing preview |
  | `/login` | `Login.tsx` | Email + password login; Google + GitHub OAuth; StudioOpener on success |
  | `/register` | `Register.tsx` | Name, email, password, terms; StudioOpener on success |
  | `/pricing` or `/subscription` | `Pricing.tsx` | Plan cards (Free→Starter→Pro→Studio→Enterprise), Stripe checkout |
  | `/contact` | `Contact.tsx` | Contact form → studiosvirelle@gmail.com |
  | `/blog` | `Blog.tsx` | AI-generated blog posts |
  | `/blog/:slug` | `BlogArticle.tsx` | Single blog post |
  | `/showcase` | `Showcase.tsx` | Example films / generated content gallery |
  | `/how-it-works` | `HowItWorks.tsx` | Step-by-step explainer |
  | `/about` | `About.tsx` | Company / mission page |
  | `/faq` | `FAQ.tsx` | Frequently asked questions |
  | `/solutions` | `Solutions.tsx` | Use-case landing pages (indie, enterprise, education) |
  | `/download` or `/app` | `DownloadApp.tsx` | Mobile + desktop app download links |
  | `/forgot-password` | `ForgotPassword.tsx` | Password reset email |
  | `/reset-password` | `ResetPassword.tsx` | New password form (token in URL) |
  | `/terms` | `legal/TermsOfService.tsx` | Terms of Service |
  | `/privacy` | `legal/PrivacyPolicy.tsx` | Privacy Policy |
  | `/acceptable-use` | `legal/AcceptableUsePolicy.tsx` | Acceptable Use Policy |
  | `/ai-content-policy` | `legal/AIContentPolicy.tsx` | AI Content Policy |
  | `/ip-policy` or `/dmca` | `legal/IPPolicy.tsx` | IP / DMCA Policy |

  ### Dashboard pages (auth required)

  | Route | File | Description |
  |---|---|---|
  | `/` or `/dashboard` | `Home.tsx` | Dashboard — welcome, recent projects, quick actions, credit balance. Plays StudioOpener if `?opener=1` in URL (OAuth callback) |
  | `/projects` | `Projects.tsx` | Projects list with search/filter, create new |
  | `/projects/new` | `NewProject.tsx` | Project creation form (title, genre, logline) |
  | `/projects/greenlight` | `GreenlightFlow.tsx` | Greenlight workflow — pitch deck builder |
  | `/projects/:id` | `ProjectDetail.tsx` | Project overview — scenes list, tool grid, metadata |
  | `/projects/:id/scenes` | `SceneEditor.tsx` | Scene list, add/edit scenes, generate video per scene |
  | `/projects/:id/board` | `ProductionBoard.tsx` | Kanban-style production board |
  | `/movies` | `Movies.tsx` | My Movies gallery — play films/trailers/scenes; plays StudioOpener before film/trailer |
  | `/assistant` | `AssistantPage.tsx` | Director's AI assistant with streaming chat |
  | `/characters` | `Characters.tsx` | Global character library (across projects) |
  | `/poster-maker` | `AdPosterMaker.tsx` | AI movie poster / ad poster generation |
  | `/campaigns` | `CampaignManager.tsx` | Ad campaign management |
  | `/content-creator` | `ContentCreatorPage.tsx` | AI content generation for socials |
  | `/samples` | `ProjectSamples.tsx` | Sample / demo projects |
  | `/referrals` | `Referrals.tsx` | Referral programme — invite links, rewards |
  | `/credits` | `Credits.tsx` | Credit balance, purchase credits |
  | `/marketplace` | `AssetMarketplace.tsx` | Downloadable film assets marketplace |
  | `/settings` | `Settings.tsx` | Account settings, subscription, BYOK API keys |
  | `/funding` | `FundingDirectory.tsx` | 94 funders across 73 countries |
  | `/festivals` | `FestivalCalendar.tsx` | Film festival calendar (Pro+) |

  ### Per-project tool pages (auth + subscription gated)

  All live at `/projects/:projectId/<tool>`. Each is wrapped in a `SubscriptionGate` — accessing without the required plan shows an upgrade prompt.

  | Route suffix | File | Plan |
  |---|---|---|
  | `/script` or `/script/:scriptId` | `ScriptWriter.tsx` | Starter+ |
  | `/storyboard` | `Storyboard.tsx` | Starter+ |
  | `/shot-list` | `ShotList.tsx` | Starter+ |
  | `/continuity` | `ContinuityCheck.tsx` | Pro+ |
  | `/color-grading` | `ColorGrading.tsx` | Pro+ |
  | `/locations` | `LocationScout.tsx` | Starter+ |
  | `/mood-board` | `MoodBoard.tsx` | Starter+ |
  | `/subtitles` | `Subtitles.tsx` | Starter+ (130+ languages) |
  | `/dialogue` | `DialogueEditor.tsx` | Starter+ |
  | `/budget` | `BudgetEstimator.tsx` | Starter+ |
  | `/sound-effects` | `SoundEffects.tsx` | Starter+ |
  | `/visual-effects` | `VisualEffects.tsx` | Pro+ |
  | `/collaboration` | `Collaboration.tsx` | Studio+ |
  | `/multi-shot` or `/multi-shot/:sceneId` | `MultiShotSequencer.tsx` | Pro+ |
  | `/nle-export` | `NLEExport.tsx` | Pro+ |
  | `/vfx-suite` or `/vfx-suite/:sceneId` | `VFXSuite.tsx` | Pro+ |
  | `/live-action-plate` | `LiveActionPlate.tsx` | Studio+ |
  | `/ai-casting` | `AICasting.tsx` | Pro+ |
  | `/director-cut` | `DirectorCut.tsx` | Pro+ |
  | `/trailer-studio` | `TrailerStudio.tsx` | Starter+; StudioOpener on success |
  | `/tv-commercial` | `TVCommercial.tsx` | Starter+; StudioOpener on success |
  | `/memory` | `ProductionMemory.tsx` | Starter+ |
  | `/activity` | `ActivityLog.tsx` | All plans |
  | `/crew` | `CrewManagement.tsx` | Pro+ |
  | `/beat-board` | `BeatBoard.tsx` | Pro+ |
  | `/production-reports` | `ProductionReports.tsx` | Studio+ |
  | `/screener` | `ScreenerGenerator.tsx` | Pro+ |
  | `/call-sheet` | `CallSheetGenerator.tsx` | Starter+ |
  | `/script-breakdown` | `ScriptBreakdown.tsx` | Starter+ |
  | `/schedule` | `ShootingSchedule.tsx` | Starter+ |

  ### Admin pages (admin role required)

  | Route | File | Description |
  |---|---|---|
  | `/admin/users` | `AdminUsers.tsx` | User management, flagged accounts, lock/unlock |
  | `/admin/security` | `SecurityDashboard.tsx` | Security events, audit log, threat monitoring |
  | `/admin/autonomous` | `AdminAutonomous.tsx` | Autonomous AI pipeline control |
  | `/admin/advertising` | `AdvertisingDashboard.tsx` | Ad campaign overview |
  | `/admin/seo` | `SeoDashboard.tsx` | SEO content engine dashboard |
  | `/admin/outreach` | `AdminOutreach.tsx` | Outreach / WhatsApp / LinkedIn automation |

  ---

  ## Key Components

  | Component | File | Description |
  |---|---|---|
  | `DashboardLayout` | `components/DashboardLayout.tsx` | App shell — sidebar, topbar, auth guard, theme toggle |
  | `StudioOpener` | `components/StudioOpener.tsx` | Full-screen cinematic intro animation. Props: `onComplete`, `mode` (film/trailer/default), `skippable`. Triggers: login, register, OAuth, film play, trailer play, trailer/commercial generation |
  | `GoldWatermark` | `components/GoldWatermark.tsx` | VS logo watermark component (CDN image). Used inside page wrappers. See also CSS `body::before` for the always-on version |
  | `SubscriptionGate` | `components/SubscriptionGate.tsx` | Wraps Pro/Studio features; shows `UpgradePrompt` if tier insufficient |
  | `DirectorChat` | `components/DirectorChat.tsx` | AI chat with streaming, voice input, scene generation |
  | `MediaPlayer` | `components/MediaPlayer.tsx` | Video playback for generated scenes/films |
  | `GlobalRenderQueue` | `components/GlobalRenderQueue.tsx` | Floating progress bar for active AI video jobs |
  | `NotificationBell` | `components/NotificationBell.tsx` | In-app notification bell (top bar) |
  | `ErrorBoundary` | `components/ErrorBoundary.tsx` | React error boundary — wraps entire app |
  | `OnboardingModal` / `OnboardingOverlay` | `components/` | First-run user onboarding |
  | `ProjectWorkspaceSidebar` | `components/ProjectWorkspaceSidebar.tsx` | Right-side context panel inside project views |
  | `LeegoFooter` | `components/LeegoFooter.tsx` | Footer rendered inside dashboard layout |
  | `AIChatBox` | `components/AIChatBox.tsx` | Reusable AI chat input with streaming |

  ---

  ## Server — Core Engines (`server/_core/`)

  | File | Purpose |
  |---|---|
  | `trpc.ts` | tRPC init — `publicProcedure`, `protectedProcedure`, `creationProcedure`, `adminProcedure` |
  | `context.ts` | Request context — session parsing, user lookup, session token creation |
  | `subscription.ts` | Tier limits (Free/Starter/Pro/Studio/Enterprise), credit costs, Stripe integration, `requireFeature()`, `requireGenerationQuota()` |
  | `llm.ts` | `invokeLLM()` — unified OpenAI/Claude call with retries |
  | `imageGeneration.ts` | `generateImage()` — Pollinations + fallback |
  | `videoGeneration.ts` | `generateVideo()` — base video generation |
  | `unifiedVideoEngine.ts` | Multi-provider video: Runway, fal.ai, Sora — auto-selects best provider |
  | `byokVideoEngine.ts` | Bring-Your-Own-Key video: user supplies their own Runway/fal/Sora API key |
  | `cinematicPromptEngine.ts` | `buildVisualDNA()`, `buildScenePrompt()`, `buildTrailerPrompt()` — Hollywood-quality AI prompts |
  | `voiceActingEngine.ts` | ElevenLabs voice with 35 emotion states |
  | `soundtrackEngine.ts` | AI film score generation |
  | `filmPipeline.ts` | Full-film pipeline orchestration (90-min film) |
  | `videoJobWorker.ts` | Background job queue for video generation |
  | `videoStitcher.ts` | Stitches individual scene clips into full film |
  | `securityEngine.ts` | Fraud detection, rate limiting, audit log, user flagging |
  | `contentModerationEngine.ts` | AI content safety checks |
  | `minorProtectionEngine.ts` | Age-appropriate content enforcement |
  | `oauth.ts` | Google + GitHub OAuth flow; redirects to `/?opener=1` on success |
  | `notification.ts` | `notifyOwner()` — emails studiosvirelle@gmail.com on key events |
  | `s3Upload.ts` | AWS S3 upload helpers |
  | `rateLimit.ts` | `rateLimitAI`, `rateLimitHeavyAI`, `rateLimitUpload` middleware |
  | `sanitize.ts` | `sanitizeText()` — strip XSS/injection from user input |
  | `logger.ts` | Pino logger singleton — use `logger.info()` in non-request code |
  | `env.ts` | Typed env variable access (`ENV.DATABASE_URL`, etc.) |

  ---

  ## Subscription Tiers

  Defined in `server/_core/subscription.ts` → `TIER_LIMITS`:

  | Tier | Key features |
  |---|---|
  | **Free** | Limited generations, no video export |
  | **Starter** | Script, Storyboard, basic video generation |
  | **Pro** | VFX, Color Grading, Continuity, NLE Export, Multi-Shot |
  | **Studio** | Collaboration, Live Action Plate, Production Reports |
  | **Enterprise** | Custom limits, priority queue, dedicated support |

  Credits are the in-app currency for AI generations. Cost per operation defined in `CREDIT_COSTS`.

  ---

  ## Visual Design

  ### Typography

  | Role | Font | Weights | Source |
  |---|---|---|---|
  | Display / H1 | **Cormorant Garamond** | 300, 400, 500, 600, 700 + italic | Google Fonts (`index.html`) |
  | Headings H2–H6 | **Cinzel** | 400, 600, 700, 900 | Google Fonts (`index.html`) |
  | Body / UI | **Inter** | 100–900 | Google Fonts (`index.html`) |

  CSS utilities: `.font-display` (Cormorant), `.font-cinzel` (Cinzel), `.font-display-italic`.
  H2–H6 letter-spacing: `0.06em` desktop → `0.04em` at ≤767px.
  H1 font-size: `clamp(1.8rem, 7.5vw, 3.5rem)` on mobile (overflow protection).

  #### Mobile Native Fonts

  | Role | iOS | Android | Expo Web |
  |---|---|---|---|
  | Display | Georgia | serif | 'Cormorant Garamond', Georgia, serif |
  | Heading | Palatino | serif | 'Cinzel', Georgia, serif |
  | Body | system-ui | normal | system-ui |

  Exported from `apps/mobile/lib/_core/theme.ts` as `Fonts.display`, `Fonts.heading`, `Fonts.sans`.

  ---

  ### Light Mode Background

  - **Image:** `/cinematic-light-bg.jpg` — golden film projector, warm bokeh
  - **Fallback:** `oklch(0.93 0.028 80)` — warm champagne parchment
  - **Desktop:** `background-attachment: fixed` — image stays pinned while content scrolls over it
  - **≤1024px:** `background-attachment: scroll` — iOS Safari fix (fixed breaks on iPhone)
  - Defined in `body { }` block of `index.css`

  **Light mode CSS variable palette (`:root`):**

  | Token | Value | Role |
  |---|---|---|
  | `--background` | `oklch(0.93 0.028 80)` | Warm champagne |
  | `--foreground` | `oklch(0.18 0.025 45)` | Warm charcoal text |
  | `--primary` | `oklch(0.28 0.08 35)` | Deep sienna |
  | `--card` | `oklch(0.96 0.018 80)` | Card surface |
  | `--muted` | `oklch(0.82 0.022 75)` | Muted background |

  ---

  ### Dark Mode Background

  Activated by `.dark` class on `<html>` (ThemeProvider in `contexts/ThemeContext.tsx`).

  - **Base colour:** `oklch(0.07 0.018 65)` — deep warm near-black (matches logo shadow)
  - **Glow layer 1 (top):** `radial-gradient(ellipse 100% 55% at 50% -5%, oklch(0.55 0.18 75 / 0.10)...)`
  - **Glow layer 2 (tight top):** `radial-gradient(ellipse 60% 35% at 50% 0%, oklch(0.78 0.18 85 / 0.06)...)`
  - **Desktop:** `background-attachment: fixed` · **≤1024px:** `scroll` (iOS fix)
  - Defined in `.dark body { }` block of `index.css`

  **Dark mode CSS variable palette (`.dark`):**

  | Token | Value | Role |
  |---|---|---|
  | `--background` | `oklch(0.07 0.018 65)` | Warm near-black |
  | `--foreground` | `oklch(0.92 0.025 80)` | Warm off-white |
  | `--primary` | `oklch(0.78 0.18 85)` | Warm gold |
  | `--card` | `oklch(0.10 0.018 65)` | Card surface |

  ---

  ### VS Logo Watermark

  Two implementations — both should remain in sync:

  #### 1. CSS `body::before` (always-on, no HTML needed)
  Defined in `index.css` between the `.dark body` block and `@layer base`:

  | Property | Value |
  |---|---|
  | Position | `fixed; inset: 0` — locked to viewport centre, never scrolls |
  | Size | `min(52vmin, 400px)` desktop · `min(72vmin, 280px)` ≤767px |
  | Light image | `/vs-wm-light.png` · `opacity: 0.11` |
  | Dark image | `/vs-wm-dark.png` · `opacity: 0.15` (more visible on dark) |
  | Mobile opacity | 0.08 light · 0.11 dark |
  | Interaction | `pointer-events: none` (fully click-through) |
  | Z-index | `0` — above body background, below all page content |

  #### 2. `GoldWatermark` React component
  **File:** `apps/web/client/src/components/GoldWatermark.tsx`
  Uses a CDN image URL (`files.manuscdn.com`). Add `<GoldWatermark />` inside any page wrapper for an additional per-page watermark.
  ⚠️  **If the CDN URL breaks**, the component will silently show nothing — the CSS `body::before` watermark is the reliable fallback. Consider switching the component to use `/vs-wm-dark.png` (local file) if the CDN becomes unreliable.

  ---

  ### Mobile App Theme (`apps/mobile/theme.config.js`)

  | Token | Hex | Notes |
  |---|---|---|
  | background | `#0c0a06` | Warm near-black (matches web dark mode) |
  | surface | `#1a1409` | Elevated card |
  | surface2 | `#241e0e` | Secondary surface |
  | primary | `#c9a84c` | 18k warm gold |
  | primaryLight | `#e0c870` | Lighter gold |
  | accent | `#e8c855` | Bright gold CTA |
  | foreground | `#eadfc0` | Warm cream |
  | muted | `#8a7850` | Muted gold-brown |
  | border | `#2e2410` | Warm dark border |

  ---

  ### CSS File Structure (`apps/web/client/src/index.css`)

  ```
  Line   1–10   @tailwind base / components / utilities
  Line  11–15   @custom-variant dark  ← tells Tailwind .dark class = dark mode
  Line  16–171  :root { }             ← ALL light mode CSS variables
  Line 112–171  .dark { }             ← ALL dark mode variable overrides
  Line 172–205  body { }              ← light mode background (cinematic-light-bg.jpg, fixed)
  Line 190–205  .dark body { }        ← dark mode background (radial gold glow, fixed)
  Line 206–240  body::before { }      ← VS logo watermark (fixed, light)
                .dark body::before {} ← VS logo watermark (fixed, dark)
                @media ≤767px         ← mobile watermark size/opacity
  Line 241+     @media ≤1024px        ← bg-attachment: scroll (iOS Safari fix)
                @layer base { }       ← scrollbar styles, heading font assignments,
                                         glass morphism, animations, utilities
                @media ≤767px         ← responsive heading font sizes, input zoom fix
  ```

  ---

  ### Public Assets (`apps/web/client/public/`)

  | File | Purpose |
  |---|---|
  | `cinematic-light-bg.jpg` | Light mode background — golden film projector bokeh |
  | `vs-wm-light.png` | VS logo watermark for light mode (CSS `body::before`) |
  | `vs-wm-dark.png` | VS logo watermark for dark mode (CSS `body::before`) |
  | `vs-watermark.png` | Original VS watermark (full quality) |
  | `vs-watermark-tile.png` | Tiling version |
  | `vs-wm-tile.png` | Tiling variant (smaller) |
  | `virelle-logo-square.png` | Square logo — og:image / social sharing |
  | `virelle-favicon-192.png` | PWA manifest icon 192×192 |
  | `virelle-favicon-512.png` | PWA manifest icon 512×512 |
  | `apple-touch-icon.png` | iOS home screen icon |
  | `leego-logo-transparent.png` | Leego sub-brand logo (transparent) |
  | `leego-logo.png` | Leego sub-brand logo |
  | `manifest.json` | PWA manifest |
  | `robots.txt` | Search engine crawl rules |
  | `sitemap.xml` | Primary XML sitemap |
  | `sitemap-main.xml` | Main pages sitemap |

  ---

  ## Deployment

  ### Railway (production)

  - **Builder:** Dockerfile (`apps/web/Dockerfile`)
  - **Health check:** `GET /` — 300s timeout
  - **Restart policy:** ON_FAILURE, max 10 retries
  - **Config:** `apps/web/railway.toml`
  - **Auto-deploy:** CI job `deploy` in `.github/workflows/ci.yml` triggers after `build-web` succeeds on `main`

  > ⚠️  **Deploy job currently uses `continue-on-error: true`** because `RAILWAY_TOKEN` in GitHub Secrets is a project token, not a personal access token. To enable true auto-deploy: go to Railway dashboard → Account Settings → Tokens → create a new personal token → update the `RAILWAY_TOKEN` GitHub secret.
  > Until then, **trigger manual deploys** from: Railway dashboard → virellestudios-production → Deployments → Redeploy.

  ### CI (`.github/workflows/ci.yml`)

  | Job | Runs on | Notes |
  |---|---|---|
  | TypeScript Check | every push | `pnpm turbo typecheck` |
  | Lint | every push | `pnpm turbo lint` |
  | Build Web | every push | `pnpm --filter @virelle/web build` |
  | Mobile TypeScript Check | every push | `tsc --noEmit` in mobile app |
  | E2E Tests (Web) | main + staging | `continue-on-error: true` — always fails in CI (no live browser), expected |
  | EAS Build (iOS + Android) | main only | `continue-on-error: true` — queues Expo build |
  | Build Desktop | main only | Builds Electron for macOS + Windows + Linux |
  | Deploy to Railway | main only | `continue-on-error: true` — see note above |

  ---

  ## Email

  All contact form submissions and owner notifications → **studiosvirelle@gmail.com**

  Functions:
  - `sendContactEmailToStudio()` — Contact page form
  - `sendShowcaseWaitlistNotification()` — Showcase waitlist signup
  - `notifyOwner()` — Triggered by key server events (new registration, large generation, etc.)

  ---

  ## Known Issues / Gotchas

  - `background-attachment: fixed` breaks on iOS Safari — overridden to `scroll` at ≤1024px in `index.css`
  - E2E tests always fail in CI (no `E2E_BASE_URL` secret set) — this is expected, `continue-on-error: true`
  - Railway auto-deploy needs a personal token — see Deployment section above
  - `GoldWatermark.tsx` uses a CDN URL that could become unavailable — CSS `body::before` is the reliable fallback
  - `maximum-scale=1.0, user-scalable=no` in viewport meta prevents iOS zoom on input focus — intentional
  