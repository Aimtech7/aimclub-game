# Aimfun Club Android test build

The GitHub `Verify and build` workflow builds `Aimfun-Club-debug-APK` after the app/browser tests pass. Download it from the workflow run’s Artifacts section and install it on an adult tester’s Android device. It is debug-signed, not a Play Store release.

## Local build

Install JDK 17, Android SDK Platform 35/build-tools 35.0.0 and Gradle 8.9. Run `node scripts/sync-android.mjs` from the repository root, then `gradle --no-daemon -p android assembleDebug lintDebug`. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio can open this project using Gradle 8.9. A Gradle wrapper is not included yet; use the specified Gradle installation.

Set optional `AIMFUN_WEB_URL` to the deployed HTTPS origin before building; its default is the existing Aimfun Sites origin. No path/query is accepted. Offline assets and hosted pages use separate origins and separate local storage.

Implemented: trusted-origin navigation, runtime camera/microphone permission checks, JSON selection through the system file picker, explicit file saves through the system document picker, and media cleanup when leaving the foreground. The app does not request general external storage access.

Test on a physical Android device: installation, all offline games, secret handoffs, room reconnecting, camera/microphone allow and deny, mute/leave/rejoin, JSON import, backup/calendar export, screen rotation, background/resume, airplane mode and app exit. Native flows and actual media are not proven by a successful APK build. Release signing, store submission and an updated production SDK policy review are separate work. Never commit signing keys.
