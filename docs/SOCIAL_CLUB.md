# Aimfun Club 3.0 — Social Club

## Player flow

Open `/online/`, create a room with a nickname and adult confirmation, copy/share its invitation link, and wait for guests. Guests can join as players or spectators. Select a game and boundaries, save settings, then ask all players to press Ready. The host starts the game. Changes to lobby settings reset readiness. Use chat, reactions and optional voice/video without leaving the room.

Online games: Friends Truth or Dare, Spicy Couples, Quick Pick, Have You Ever, Undercover, and uploaded custom packs. A room supports 12 players plus 20 spectators. Undercover requires three players. Spectators do not receive secret words, cannot answer/vote or become host, and never block results. Shared-device modes remain available for the other games.

## Packs and boundaries

`/club/#packs` creates, edits, imports, exports and deletes packs. A pack contains 2–100 unique prompts of up to 400 characters. Every prompt has a type, intensity and topic labels. Select the saved pack in room settings and choose Custom Pack. Imported JSON is validated before persistence. Loading a pack uploads it into the room; saved personal packs otherwise stay on the browser.

Hosts set a maximum intensity and excluded topics for online social prompts. Built-in metadata uses conservative text rules; custom packs rely partly on author labels. Empty filtered decks return an explicit error before a game starts. Anyone can pass; social scoring does not penalize passes. Filters do not alter unrelated shared-device game banks.

## Tournaments and profiles

A mixed-game night rotates through 2–10 selected game modes for 2–30 rounds. Scores reset on tournament start. Completed Truth/Dare/custom challenge: +1; Have You Ever Yes/No: +1; correct quiz: +2; Undercover civilian success: +2, spy escape: +3. A tie declares all top scorers winners. This is casual mixed scoring, not a normalized competitive ladder.

Nickname profiles in My Club show rounds observed on this browser, tournament wins, daily streaks, earned badges and favourite games. A completed round is recorded once even across repeated polls/reloads. Spectators and skipped rounds earn no profile progress. Profiles are local, nickname-based and not verified account identities or global rankings. Clearing browser storage removes profiles and saved packs.

## Scheduled nights and installation

Hosts may name a room and schedule it within its existing 24-hour lifetime. The room shows a countdown and downloads a calendar invitation with a 10-minute alarm. Visited scheduled rooms appear in My Club. Optional notification checks run only while My Club is open; there is no server-push reminder service. Calendar apps handle reminders after the site closes. The host starts the game when everyone is ready; scheduling does not auto-start it.

The install/update centre reports connection, offline cache readiness, standalone installation and available updates. Installation falls back to browser-specific instructions. Applying updates preserves browser storage. All shared-device game files, Club pages and room shell assets are precached. Room APIs, call settings and downloads bypass cache; online functions need internet.

## Voice/video beta

Calls support up to six consenting participants. Camera/microphone access is requested only on Join Voice/Video. Mute, camera toggle, leave, page exit, removed participants and room closure clean up media tracks. Audio-only participants can leave/rejoin with video. No media is recorded by the app.

Signaling is authenticated by room tokens, recipient-only, session-scoped, time-bounded and size-limited. UUID ordering prevents simultaneous offer collisions. Complete ICE gathering is included with SDP offers/answers. Browser-only WebRTC media connections need real-device/network verification.

Default ICE configuration is Google's public STUN server. No TURN relay is provisioned. Direct calls may fail on restrictive NAT/mobile networks. Operators can supply a `RTC_ICE_SERVERS` runtime secret containing a JSON array of RTCIceServer objects, including TURN URLs and provider-issued credentials. Use scoped, short-lived credentials; do not commit them. The endpoint only returns this configuration to authenticated room members. Configuring a production relay/provider and testing on mobile networks remains an operational prerequisite for reliable calling across networks.

## Validation

`node scripts/build.mjs` builds the Worker. `npm test` runs room authorization/concurrency tests; social feature tests; simulated DOM interactions and two-client SDP exchange; Worker/static/security/offline-cache tests; 13 original hub game flows; ten advanced party games; both Truth/Dare deck cycles; and all 150 Have You Ever questions.

`node tests/live.mjs https://your-published-origin` explicitly runs a production smoke test with synthetic host, two guests and one spectator, verifies synchronization, privacy boundaries, chat/reactions, call signaling, uploaded packs and a complete tournament, then deletes the room in `finally`. It does not use real cameras or microphones.

Managed preview is unavailable for the current Worker project (no supported dev entrypoint). No browser visual, real microphone/camera, phone installation or Android APK test has been claimed. DOM/WebRTC mocks verify app control flow, not browser rendering, permissions UI or actual media traversal. The Android source remains a preview requiring native permission/file integration and a real build/device test.
