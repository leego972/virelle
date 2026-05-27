# VirElle Studios

  AI-powered cinematic production platform for filmmakers, directors, and content creators.

  ---

  ## Live URLs

  | Environment | URL |
  |---|---|
  | Production | https://virelle.life |
  | Production (www) | https://www.virelle.life |
  | Railway service | https://virellestudios-production.up.railway.app |
  | Staging | https://virellestudios-staging.up.railway.app |
  | Stripe webhook | https://virelle.life/api/webhooks/stripe |

  ---

  ## Visual Design Reference

  > Keep this section updated whenever CSS, fonts, assets, or themes change.
  > It is the source of truth for rebuilding or debugging the visual layer.

  ### Typography

  | Role | Font | Weight | Where |
  |---|---|---|---|
  | Display / H1 | **Cormorant Garamond** | 300–700 + italic | Google Fonts CDN (index.html) |
  | Headings / H2–H6 | **Cinzel** | 400–900 | Google Fonts CDN (index.html) |
  | Body / UI | **Inter** | 100–900 | Google Fonts CDN (index.html) |

  CSS utilities: `.font-display` (Cormorant Garamond), `.font-cinzel` (Cinzel), `.font-display-italic` (italic Cormorant).

  Cinzel letter-spacing: `0.06em` desktop → `0.04em` at ≤767px (wide tracking looks bad on phone).
  H1 `font-size`: `clamp(1.8rem, 7.5vw, 3.5rem)` on mobile (prevents overflow on 375px screens).

  #### Mobile (React Native / Expo)

  | Role | iOS | Android | Expo web |
  |---|---|---|---|
  | Display | Georgia | serif | 'Cormorant Garamond', Georgia |
  | Heading | Palatino | serif | 'Cinzel', Georgia |
  | Body | system-ui | normal | system-ui |

  Fonts exported from `apps/mobile/lib/_core/theme.ts` → `Fonts.display`, `Fonts.heading`, `Fonts.sans`.

  ---

  ### Background — Light Mode

  - **Image**: `/cinematic-light-bg.jpg` (golden film projector, warm bokeh)
  - **Fallback colour**: `oklch(0.93 0.028 80)` — warm champagne parchment
  - **desktop**: `background-attachment: fixed` — image stays pinned while content scrolls
  - **≤1024px**: overridden to `background-attachment: scroll` (iOS Safari bug — fixed breaks scroll)
  - **Palette**: CSS variables in `:root { ... }` block of `index.css`

  | Token | Value | Notes |
  |---|---|---|
  | `--background` | `oklch(0.93 0.028 80)` | Warm champagne |
  | `--primary` | `oklch(0.28 0.08 35)` | Deep sienna |
  | `--foreground` | `oklch(0.18 0.025 45)` | Warm charcoal |

  ---

  ### Background — Dark Mode

  Applied via `.dark` class on `<html>` (ThemeProvider default: `"light"`).

  - **Solid**: `oklch(0.07 0.018 65)` — very dark warm near-black (matches logo shadow)
  - **Glow layer 1**: `radial-gradient(ellipse 100% 55% at 50% -5%, oklch(0.55 0.18 75 / 0.10)...)`
  - **Glow layer 2**: `radial-gradient(ellipse 60% 35% at 50% 0%, oklch(0.78 0.18 85 / 0.06)...)`
  - `background-attachment: fixed` on desktop; `scroll` on ≤1024px

  | Token | Value | Notes |
  |---|---|---|
  | `--background` | `oklch(0.07 0.018 65)` | Warm near-black |
  | `--primary` | `oklch(0.78 0.18 85)` | Warm gold |
  | `--foreground` | `oklch(0.92 0.025 80)` | Warm off-white |

  ---

  ### VS Logo Watermark

  A faint brand watermark centred in the viewport at all times.

  | Property | Value |
  |---|---|
  | Element | `body::before` pseudo-element — no HTML changes needed |
  | Position | `position: fixed; inset: 0` — never moves regardless of scroll depth |
  | Size | `min(52vmin, 400px)` desktop · `min(72vmin, 280px)` mobile |
  | Light mode image | `/vs-wm-light.png` at `opacity: 0.11` |
  | Dark mode image | `/vs-wm-dark.png` at `opacity: 0.15` |
  | Mobile opacity | 0.08 light · 0.11 dark (smaller screen = lighter touch) |
  | Interaction | `pointer-events: none` — completely click-through |
  | Z-index | `0` — above body background, below all page content |

  Other watermark assets in `/public`: `vs-watermark.png`, `vs-watermark-tile.png`, `vs-wm-tile.png` (tiling variant).

  ---

  ### Mobile App Theme (`apps/mobile/theme.config.js`)

  The mobile app uses the same dark cinematic brand palette as the web dark mode.
  Both `light` and `dark` keys share the same values — the app is always in dark/cinematic mode.

  | Token | Hex | Notes |
  |---|---|---|
  | background | `#0c0a06` | Warm near-black |
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
  @tailwind base / components / utilities
  @custom-variant dark
  :root { }                  ← light mode CSS variables
  .dark { }                  ← dark mode CSS variable overrides
  body { }                   ← light mode background (cinematic-light-bg.jpg)
  .dark body { }             ← dark mode background (radial gold glow)
  body::before { }           ← VS logo watermark (fixed, light mode)
  .dark body::before { }     ← VS logo watermark (fixed, dark mode)
  @media (max-width:1024px)  ← bg-attachment: scroll (iOS Safari fix)
  @layer base { }            ← scrollbar, heading fonts, glass morphism, animations
  @media (max-width:767px)   ← responsive heading font sizes, input zoom fix
  ```

  ---

  ### Public Assets (`apps/web/client/public/`)

  | File | Purpose |
  |---|---|
  | `cinematic-light-bg.jpg` | Light mode background (golden film projector) |
  | `vs-wm-light.png` | VS logo watermark — light mode version |
  | `vs-wm-dark.png` | VS logo watermark — dark mode version |
  | `vs-watermark.png` | Full VS watermark (original) |
  | `vs-watermark-tile.png` | Tiling version |
  | `virelle-logo-square.png` | Square logo for og:image / app icons |
  | `virelle-favicon-192.png` | PWA icon 192px |
  | `virelle-favicon-512.png` | PWA icon 512px |
  | `apple-touch-icon.png` | iOS home screen icon |

  ---

  ### Deployment

  Railway auto-deploys from `main` branch via CI (`.github/workflows/ci.yml` → `deploy` job).

  **If the deploy job is failing**: The `RAILWAY_TOKEN` GitHub secret needs to be a **personal access token** from Railway dashboard → Account Settings → Tokens (not a project/environment token).
  Current token in secret is a project token — replace it with a personal token to fix auto-deploy.

  Manual redeploy: Railway dashboard → virellestudios-production → Deployments → Redeploy.
  