# Virelle Studios Mobile App — Design Document

## Brand Identity
Virelle Studios is an AI-powered cinematic production platform for filmmakers, directors, and content creators. The mobile app should feel like a professional filmmaker's tool — dark, cinematic, premium.

## Color Palette
- **Background**: `#0a0a0f` — near-black, deep space
- **Surface**: `#12121a` — elevated cards
- **Surface2**: `#1a1a26` — secondary surfaces
- **Primary**: `#7c3aed` — electric violet (Virelle brand)
- **Primary Light**: `#a855f7` — lighter violet for highlights
- **Accent**: `#e879f9` — fuchsia accent for CTAs
- **Foreground**: `#f1f0ff` — near-white text
- **Muted**: `#8b8ba7` — secondary text
- **Border**: `#2a2a3e` — subtle borders
- **Success**: `#22d3ee` — cyan for success
- **Warning**: `#f59e0b` — amber
- **Error**: `#f43f5e` — rose red

## Screen List

### Auth Flow
1. **Splash / Onboarding** — Animated logo + tagline, Get Started / Sign In buttons
2. **Login** — Email + password, Google OAuth, forgot password link
3. **Register** — Name, email, password, terms agreement
4. **Forgot Password** — Email input, send reset link

### Main App (Tab Bar)
5. **Home / Dashboard** — Welcome, recent projects, quick actions, credit balance
6. **Projects** — List of user projects, create new, search/filter
7. **Director Chat** — AI chat interface with streaming, voice input, scene generation
8. **Movies** — Generated video gallery, playback, share
9. **Profile / Settings** — Account info, subscription, credits, referrals, settings

### Project Screens (pushed from Projects tab)
10. **Project Detail** — Overview, scenes list, tools grid (Script, Storyboard, Characters, etc.)
11. **Scene Editor** — Scene list, add/edit scenes, generate video per scene
12. **Script Writer** — Full screenplay editor with AI assist
13. **Storyboard** — Visual storyboard with AI-generated panels
14. **Characters** — Character library, create/edit characters
15. **Shot List** — Scene-by-scene shot planning
16. **Dialogue Editor** — AI-polished dialogue per scene
17. **Budget Estimator** — AI budget breakdown
18. **Subtitles** — Auto-generated subtitles
19. **Mood Board** — Visual mood/tone reference board
20. **Color Grading** — Color palette for the film
21. **Sound Effects** — AI sound effect suggestions
22. **Continuity Check** — AI continuity analysis
23. **Credits Editor** — Film credits roll editor

### Account Screens
24. **Credits & Subscription** — Credit balance, top-up, plan comparison, upgrade
25. **Referrals** — Referral code, share link, earned credits, leaderboard
26. **Settings** — API keys, notifications, theme, account management

## Key User Flows

### New User Flow
Splash → Register → Home (with 5 free credits shown) → Create Project → Director Chat → Scene Generated

### Project Creation Flow
Projects tab → "+" button → New Project form (title, genre, logline) → Project Detail → Choose tool

### Director Chat Flow
Director Chat tab → Type or speak message → AI asks clarifying questions → AI generates scene → Scene appears in project → Tap to view/play video

### Video Generation Flow
Scene Editor → Select scene → "Generate Video" → Credit deduction confirmation → Progress indicator → Video ready → Play / Share / Download

### Subscription Flow
Credits tab → "Upgrade" → Plan comparison → Stripe payment sheet → Success → Credits updated

## Primary Content Per Screen

| Screen | Primary Content |
|--------|----------------|
| Home | Recent projects (cards), credit balance chip, quick action buttons |
| Projects | FlatList of project cards (title, genre, scene count, status) |
| Director Chat | Chat bubbles, streaming text, voice input FAB, scene generation cards |
| Movies | Video grid with thumbnails, play button, duration badge |
| Project Detail | Hero image, metadata, tools grid (12 tools), scenes count |
| Scene Editor | Scene cards with thumbnail, title, status, generate button |
| Script Writer | Scrollable screenplay with act markers, AI suggestions |
| Storyboard | Horizontal scroll of panels, AI generate per panel |
| Characters | Character cards with portrait, name, role |
| Credits | Balance card, transaction history, top-up packages |

## Navigation Architecture
- **Root Stack**: Auth screens (not in tabs) + Main tabs
- **Tab Bar** (5 tabs): Home, Projects, Chat, Movies, Profile
- **Project Stack**: Project Detail → Scene Editor / Script / Storyboard / etc.
- **Modal Sheets**: New Project, Credit Top-up, Subscription upgrade

## Typography
- **Display**: SF Pro Display (iOS) / Roboto (Android) — bold, large
- **Body**: System font — regular weight
- **Mono**: Courier (screenplay text)

## Interaction Patterns
- Haptic feedback on primary actions
- Skeleton loading states (not spinners)
- Pull-to-refresh on lists
- Swipe-to-delete on projects/scenes
- Long-press for context menu (rename, delete, share)
- Streaming chat text appears character-by-character
