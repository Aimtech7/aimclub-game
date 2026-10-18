# Aimfun Club 18+

A collection of 26 party, couples, solo and puzzle games with offline PWA support and private online rooms.

Live site: https://truth-dare-social.aimventures.chatgpt.site

## Included source

- `public/`: web interface, games, prompt banks, social rooms, custom-pack editor, profiles and service worker.
- `worker/`: Cloudflare Worker API and static delivery. Online rooms use a D1 binding named `DB`.
- `drizzle/`: room database schema.
- `scripts/`: build and static-preview scripts.
- `tests/`: automated game, room, social, DOM and offline-cache tests.
- `android/`: Android preview source and bundled offline assets. This is not a compiled APK.
- `docs/SOCIAL_CLUB.md`: features, architecture, scoring, operational requirements and known limits.
- `.openai/hosting.json`: original Sites hosting configuration. The project ID identifies the existing hosted Site; it is not a credential.

## Run on Windows, macOS or Linux

Install Node.js 24 or newer (tested with Node.js 24), then open this folder in VS Code or Antigravity. Install the pinned development dependencies with npm ci.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:8080. npm run dev runs the full app with a persistent local SQLite database, including rooms/chat/multiplayer. The database is saved in .local/aimfun.sqlite. Stop with Ctrl+C. npm run preview:static remains available for frontend-only preview.

## Online hosting

This snapshot is deployed through ChatGPT Sites as a Cloudflare Worker with a D1 database. GitHub runs automated tests and a debug APK build on pushes. An opt-in Cloudflare deployment workflow is included; enable it only after configuring your own Cloudflare account, database and GitHub secrets. It does not update the original Sites publication automatically. To move hosting, configure a Worker entrypoint from `dist/server/index.js`, bind a D1 database as `DB`, and apply `drizzle/0000_rooms.sql` using your chosen deployment tooling. Do not reuse an existing database without reviewing migrations.

Voice/video is beta. A public STUN server is configured by default, but no TURN relay is provisioned. `RTC_ICE_SERVERS` can be supplied as a runtime secret with provider-issued ICE configuration. Do not put relay credentials or other secrets in source control. Real-device media, browser installation/layout and Android APK verification remain outstanding. Profiles are browser-local; calendar reminders are not background push notifications.

## GitHub development

Repository: https://github.com/Aimtech7/aimclub-game

```sh
git clone https://github.com/Aimtech7/aimclub-game.git
cd aimclub-game
npm ci
npm run build
npm test
npm run dev
```

Open this folder in VS Code or Antigravity. Commit your verified changes and push normally. GitHub source updates do not automatically redeploy the existing Sites publication.

This export contains source files, not private player data, room reconnect tokens, API credentials or the original Sites Git history.

## Source snapshot

Original application snapshot: `908b94e11b65e5b7491a37b35f3fad3ca42c0ef4` (Social Club 3.0). This export adds this README, `.gitignore`, a local static-preview script. The live application is unchanged.

All automated game/social tests and the production smoke test passed for this snapshot. Actual microphone/camera and real-phone testing have not been claimed.

## Development and release workflow

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for local/LAN/HTTPS setup, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for GitHub/Cloudflare/TURN activation, and [docs/DEVICE_TESTING.md](docs/DEVICE_TESTING.md) for physical-phone checks. Open `/diagnostics/` on each phone for capability and permission checks.

GitHub Actions produces a debug APK artifact after the browser tests pass. It is a test build, not a signed production/Play Store release. Android runtime media permission and file chooser/save flows are implemented but still need physical-device validation.
