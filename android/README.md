# Aimfun Club Android Preview Source

Prepared source, not a compiled or device-tested APK. This repository does not contain a signing key. Do not publish a debug build to production.

## Build locally

1. Install Android Studio, Android SDK Platform 35 and JDK 17.
2. Open this `android` directory in Android Studio. It uses Android Gradle Plugin 8.7.3, Gradle 8.9 and AndroidX WebKit 1.12.1.
3. If Gradle wrapper files are requested, generate them using an installed Gradle 8.9: `gradle wrapper --gradle-version 8.9`.
4. Run `gradle assembleDebug` or Android Studio's Build APK action.
5. Install and test the debug APK on a physical device. Verify every game, private handoffs, drawing, screen rotation, app exit, airplane mode and online-room reconnecting.

The APK packages the offline game assets, served through AndroidX WebViewAssetLoader using its reserved HTTPS domain. Online rooms switch to the hosted Aimfun Club origin and require internet. Local offline profiles and hosted room profiles use separate browser origins. Returning from a hosted page may remain on the hosted game library; use Android Back → Game library for the packaged library.

Before production: add a Gradle wrapper, build and test, select production Android SDK targets, implement and test native file import/download handling, configure release signing locally and review privacy/content-rating requirements. Never put signing secrets in Git. The current preview does not promise native backup import or blob-download support.

The Social Club voice/video, browser notifications, calendar files and custom-pack import/export features must be tested in an external browser. The preview WebView does not yet implement native microphone/camera permission handling or native file chooser/download integrations. This source archive is not a finished Android app.

Technical references:
- https://developer.android.com/build/releases/agp-8-7-0-release-notes
- https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader
