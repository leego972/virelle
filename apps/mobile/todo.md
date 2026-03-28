# Virelle Studios Mobile App — TODO

## Setup & Config
- [x] Generate Virelle Studios app logo
- [x] Configure theme (dark cinematic palette)
- [x] Configure API client to connect to Virelle Studios backend
- [x] Set up auth token storage (SecureStore)

## Auth Screens
- [x] Login screen (email + password + Google OAuth)
- [x] Register screen
- [x] Forgot Password screen

## Tab Navigation
- [x] Tab bar with 5 tabs: Home, Projects, Chat, Movies, Profile
- [x] Icon mappings for all tabs

## Home / Dashboard
- [x] Welcome header with user name
- [x] Credit balance chip
- [x] Recent projects (horizontal scroll)
- [x] Quick action buttons (New Project, Director Chat, Browse Movies)
- [x] Stats (total projects, total scenes, total videos)

## Projects
- [x] Projects list (FlatList with cards)
- [x] Search / filter projects
- [x] Create new project (modal sheet)
- [x] Project Detail screen with all tools grid
- [x] Script Writer screen
- [x] Storyboard screen
- [x] Characters screen
- [x] Shot List screen
- [x] Dialogue Editor screen
- [x] Budget Estimator screen
- [x] Subtitles screen
- [x] Continuity Check screen
- [x] Scene Builder screen
- [x] Full Film Generator screen

## Director Chat
- [x] Chat interface with message bubbles
- [x] AI Director responses via tRPC
- [x] Project context selection

## Movies
- [x] Video gallery grid
- [x] Video player screen
- [x] Video generation (AI clips, trailers, full films)

## Profile / Settings
- [x] Account info screen
- [x] Credits & Subscription screen (6 tiers: Free → Industry)
- [x] Referrals screen (share code, earn credits)
- [x] Team Collaboration screen
- [x] All Tools browser
- [x] Privacy Policy screen
- [x] Terms of Service screen
- [x] Logout

## Database & Backend
- [x] Full schema (projects, scenes, characters, scripts, storyboards, videos, chat, shot lists, budgets, team, referrals, credits)
- [x] 20+ tRPC server endpoints
- [x] AI text generation helper
- [x] Subscription upgrade endpoint

## TypeScript
- [x] Zero TypeScript errors across all files

## Film Post-Production Screen (Mobile)
- [x] Post-Production screen with ADR, Foley, Score, Mix, SFX tabs
- [x] ADR tab: record dialogue takes, playback, sync to scene
- [x] Foley tab: browse SFX library, layer sounds onto scene
- [x] Score tab: AI music generation prompt → generate cue
- [x] Mix tab: per-track volume sliders, master export
- [x] Link from Project Detail tools grid

## Funding Directory (Mobile)
- [x] Funding Directory screen with search and country/type filters
- [x] Funding source cards (organization, country, type, amount)
- [x] Application form flow (draft creation → complete in web app)
- [x] Professional working-pack disclaimer banner
- [x] Link to funder's official site
- [x] Link from Project Detail tools grid

## Push Notifications
- [x] Request notification permissions on app launch (iOS + Android)
- [x] Register Expo push token with backend
- [x] Handle incoming notifications (foreground + background)
- [x] Notification settings screen in Profile

## Offline Draft Mode
- [x] Cache scripts and storyboards locally with AsyncStorage
- [x] Show offline indicator when no network connection
- [x] Sync local drafts to server when connection restored
- [x] Conflict resolution (server wins on sync)

## Onboarding Induction Flow
- [x] Mobile: Post-login onboarding screen (movie pipeline walkthrough, 6 steps, do-not-show-again)

## Next Steps (Mar 2026)
- [x] Notification settings screen in Profile
- [x] Set RESEND_API_KEY secret
