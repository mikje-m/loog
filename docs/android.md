# Loog for Android

## Install (you and your friends)

1. On the phone, open the latest release: https://github.com/mikje-m/loog/releases/latest
2. Tap **Loog-x.y.z.apk** to download it, then tap the downloaded file.
3. Android asks once to allow installing from this source (your browser). Allow it, then tap **Install**.

To update, install the newer APK on top of the old one. Your data stays. Never uninstall first: that erases the data in the app.

The data lives in the app's own private storage on the phone. Nothing goes online. Settings > Export data saves a backup file.

## Build it yourself

Needs Node, Android Studio (its bundled JDK) and the Android SDK.

```bash
npm run build           # web build
npx cap sync android    # copy it into the Android project
cd android
./gradlew assembleRelease   # JAVA_HOME = Android Studio's "jbr" folder
# result: android/app/build/outputs/apk/release/app-release.apk
```

Icons and splash screen: `node scripts/make-android-assets.mjs` then `npx capacitor-assets generate --android --assetPath assets`.

## The signing key

Every APK is signed with a key that is NOT in this repository. It lives next to it:
`../loog-signing/` (`loog-release.jks` and `keystore.properties`). The build picks it up from there.

If that key is lost, phones refuse to install updates over the old app. Keep a copy in your password manager or private cloud drive.

## How the app differs from the web version

- Same code and the same database (IndexedDB), stored in the app's private area, so browser updates and "clear browsing data" cannot touch it.
- The service worker is not used inside the app; every file ships in the APK.
- Edge to edge: the app draws behind the status and navigation bars; the window colour and bar icons follow the in-app theme (`LoogNativePlugin.java`).
- The Android Back button works like in the web version (closes dialogs, asks before leaving a live workout).
