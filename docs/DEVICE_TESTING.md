# Physical-device release checklist

Status: NOT YET PHYSICALLY VERIFIED. Browser emulation, DOM mocks and HTTP tests are separate evidence.

Use two adult testers, phone A on Wi-Fi and phone B on a different connection (cellular if available). Repeat on Android Chrome and iPhone Safari, then the Android debug APK.

- Open `/diagnostics/`: check secure context, backend reachability and media allow/deny behavior. Save a diagnostic report if needed; it excludes names, room IDs, tokens, IP addresses and relay credentials.
- Create a room on A, share its link and join on B. Try duplicate names, spectator entry, lock/unlock and readiness. Verify both screens show the same prompt and correct turn.
- Play every online mode, including a full mixed tournament. Check private answers and Undercover words stay hidden from spectators. Check passes and skipped rounds.
- Type chat while polls refresh; make sure text/focus remains. Send reactions, reconnect after airplane mode, recover an inactive host and close the room.
- Grant/deny microphone and camera, mute, disable camera, leave/rejoin and background the app. Confirm media indicators stop on exit. Test both-way speech/video with and without a relay. Note device, OS, browser, network and outcome.
- Install PWA, wait for offline readiness, enable airplane mode and launch each shared-device game. Reconnect and apply an update while preserving saved profiles/packs. Check portrait/landscape, text wrapping, large font and exit controls.
- Android APK: install, open all offline games, join hosted rooms, test runtime permission allow/deny, JSON import, calendar/backup saving via the system picker, file-picker cancel, screen rotation, app restart and background/foreground behavior.

Do not claim these cases passed without actually performing them. Record failures and screenshots locally without exposing private room credentials. The CI report covers mobile-sized browser engines and APK compilation/lint only.
