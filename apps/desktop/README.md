# Virelle Studios — Desktop App

Electron wrapper for the Virelle Studios AI film production platform. Loads the production web app (`virellestudios.com`) in a native window with:

- **Auto-updater** via GitHub Releases
- **Deep-link protocol** (`virelle://`) for Stripe checkout returns and OAuth callbacks
- **System tray** with quick access to Projects, New Project, and Billing
- **Single instance lock** — clicking the dock/taskbar icon brings the existing window to focus
- **macOS hidden titlebar** with traffic lights inset into the window chrome

## Architecture

The desktop app is a thin Electron shell that loads the Virelle web app. This means:

- **100% feature parity** with the web app at all times — no separate UI to maintain
- Stripe checkout opens in the system browser and returns via the `virelle://` deep link
- Auth sessions are shared via cookies (same domain, persistent session)

## Development

```bash
pnpm install
pnpm dev          # Starts Electron pointing at localhost:5173 (run web app separately)
```

## Building

```bash
pnpm dist:mac     # macOS DMG + ZIP (arm64 + x64)
pnpm dist:win     # Windows NSIS installer (x64)
pnpm dist:linux   # Linux AppImage + deb (x64)
pnpm dist:all     # All platforms
```

## Code Signing

### macOS
Set the following environment variables before building:
```
CSC_LINK=<path-to-certificate.p12>
CSC_KEY_PASSWORD=<certificate-password>
APPLE_ID=<your-apple-id>
APPLE_APP_SPECIFIC_PASSWORD=<app-specific-password>
APPLE_TEAM_ID=<team-id>
```

### Windows
```
CSC_LINK=<path-to-certificate.pfx>
CSC_KEY_PASSWORD=<certificate-password>
```

See `build/CODE_SIGNING.md` for detailed instructions.

## Auto-Updates

Updates are published to GitHub Releases on the `virelle` monorepo. The `publish` config in `package.json` points to `github.com/leego972/virelle`. 

When a new release is tagged (e.g. `desktop-v1.1.0`), electron-builder will pick it up on the next update check.

## Deep-Link Protocol

The app registers the `virelle://` protocol. The web server should redirect Stripe checkout success/cancel to:
```
virelle://billing/success?session_id=...
virelle://billing/cancel
```

The Electron main process forwards these to the renderer via the `deep-link` IPC channel.
