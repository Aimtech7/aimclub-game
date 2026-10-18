# Hosting and call relay activation

## Current boundary

The existing `https://truth-dare-social.aimventures.chatgpt.site` publication is managed through Sites. GitHub cannot automatically update that publication using the short-lived interactive credentials. The included Cloudflare workflow deploys a separate Worker in **your own Cloudflare account** after you configure it. No provider account, database, custom domain or TURN relay has been provisioned by this source change.

## Enable Cloudflare deployment

1. Create a D1 database for this app in your Cloudflare account. Use a new database unless you have reviewed/adopted the migration history of an existing one. Do not point this at an unrelated database.
2. In GitHub repository Settings → Secrets and variables → Actions, add secrets `CLOUDFLARE_API_TOKEN` (scoped Workers Scripts Edit and D1 Edit for your account) and `CLOUDFLARE_ACCOUNT_ID`. Do not send these in chat or commit them.
3. Add repository variables `CLOUDFLARE_D1_DATABASE_ID` (the database UUID), `CLOUDFLARE_D1_DATABASE_NAME`, `CLOUDFLARE_WORKER_NAME`, and `CLOUDFLARE_DEPLOY_ENABLED=true`. Configure the `production` GitHub environment if you want approval gates.
4. Push a verified commit to main. `Verify and build` runs first. If it succeeds, `Deploy Cloudflare` checks out that exact SHA, builds, applies reviewed D1 migrations and deploys. Deployment stays skipped until explicitly enabled. Pull-request workflows cannot trigger the production job.
5. Open the resulting HTTPS Workers URL and `/api/health`, then test room creation and two-phone play. Set `AIMFUN_WEB_URL` as a GitHub variable to this HTTPS origin before the next APK build if you want the APK to use the new host.

For local deployment after setting environment variables:

```sh
npm ci
npm run build
npm run configure:cloudflare
npx wrangler d1 migrations apply DB --remote --config .local-wrangler.json
npx wrangler deploy --config .local-wrangler.json
```

`.local-wrangler.json` is generated and ignored. The repository includes original Sites configuration for provenance; it does not contain transferable Cloudflare credentials or the original managed D1 database ID. Hosting continuity, DNS and data migration require an explicit provider setup.

## TURN relay

Calls already support relay settings. The backend now issues member-specific credentials that expire in one hour when `TURN_URLS` and `TURN_SHARED_SECRET` are configured. The shared secret never leaves the server; clients receive only their temporary username/password. Credential generation and authentication are tested. Actual network traversal is not proven by those tests.

For a coturn-compatible relay, generate a strong random shared secret (at least 32 characters), deploy coturn on a Linux host with a public address, DNS and valid TLS certificate, and open UDP/TCP 3478, TCP 5349 and relay UDP ports 49160–49200. `deployment/turn-compose.yml` is a deployment template; it is not a running service. Review public/private address routing and firewall rules for your host. The template denies private-network relay targets and sets quotas.

Use the same secret on coturn and the app server. Set Worker runtime secrets interactively using Wrangler:

```sh
npx wrangler secret put TURN_SHARED_SECRET --config .local-wrangler.json
npx wrangler secret put TURN_URLS --config .local-wrangler.json
```

`TURN_URLS` is a comma-separated list, for example `turn:relay.your-domain:3478?transport=udp,turns:relay.your-domain:5349?transport=tcp`. Provider-managed relays may instead supply short-lived `RTC_ICE_SERVERS` JSON configuration. Do not expose a shared relay secret or commit long-lived provider credentials.

On the app's Device check page, join a room first and request a relay-candidate test. Then perform a real voice/video call between different networks, including cellular. A relay candidate alone is not proof of two-way audio/video reliability.

## Android artifact

After successful app/browser tests, the Android job builds and lints a debug APK and uploads `Aimfun-Club-debug-APK` for 14 days. Download it from the workflow run's Artifacts area. A successful build does not mean it is device-tested. Production signing, distribution and Play Store publication are not configured. Do not add signing material to the repository.
