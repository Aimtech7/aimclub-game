# Local development

Use Node.js 24 and Git. Clone `https://github.com/Aimtech7/aimclub-game.git`, then:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8080`. The frontend and actual room API run together. The SQLite database is `.local/aimfun.sqlite`, excluded from Git. `npm test` includes a real HTTP two-client test and restart-persistence check. Stop the server before copying its database for a backup; do not commit player data. The first local launch applies the room schema transactionally.

## Two devices on your LAN

Copy `.env.example` to `.env`, set `AIMFUN_HOST=0.0.0.0`, and restart. Allow the chosen port through the PC firewall for your private LAN only. Use your PC's LAN address on both devices, for example `http://192.168.1.20:8080`. Sharing a localhost link does not work on another phone; create the room from the LAN-address page instead. The PC must remain on and both devices must reach it. The local server is a development tool, not an internet-facing production host.

HTTP on a LAN supports room/chat requests but is not a secure browser context. Camera/microphone, installation and service workers on a phone require trusted HTTPS. Use a trusted development certificate covering the PC hostname/IP, install its local CA on each test device, and configure `AIMFUN_TLS_CERT` and `AIMFUN_TLS_KEY`. Keep keys under `.local/` or outside the repository. Node does not create or silently trust certificates for you. Alternatively use the published HTTPS site for phone testing.

## Checks

```sh
npm run build
npm test
npx playwright install --with-deps chromium webkit
npm run test:browser
```

Browser tests use desktop, Android-sized Chromium and iPhone-sized WebKit contexts. They test layout width, two independent players, shared chat and offline navigation. Emulation is not physical-phone verification. GitHub runs these tests and publishes a report artifact. Finish device checks in `DEVICE_TESTING.md` before a release.

The Android job syncs web assets then runs Gradle build and lint. Local Android requirements are documented in `android/README.md`.
