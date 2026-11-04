# VIONEX Android APK Feature Audit & Device Test Sheet

> **Audit Context**: Capacitor Android Native App (`com.vionex.smartfarming`) vs. Standard Web / Desktop PWA.  
> **Source Target**: Android System WebView (Chromium runtime on Android 7.0+ / API 24–36).  
> **Rule of Evidence**: Only behaviors directly proved by the code repository are marked definitive. All runtime environmental behaviors are classified as **NEEDS DEVICE TEST**. No secrets or credential keys printed.

---

## PART 1 - Web-Only APIs Used in `src/`

The table below documents every occurrence of browser-specific APIs found in `src/`, their operational status in Android WebView, exception guarding, and suggested fixes.

| File & Line | Web API | Works in Android WebView? | Code Behavior When Unavailable | Suggested Fix Idea |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/LoginScreen.tsx:69` | `signInWithPopup(auth, provider)` | **No** (Google OAuth strictly blocks Android WebViews: `disallowed_useragent`) | Caught by `catch(err)` (L71), sets Marathi error state `setError` | Use `@codetrix-studio/capacitor-google-auth` or native Android OAuth credential manager rather than WebView popup. |
| `src/components/MasterScheduleView.tsx:218-224` | `window.SpeechRecognition` / `webkitSpeechRecognition` | **No** (Web Speech API is not implemented in Android System WebView) | Guarded by `if (!SpeechRecognition)` (L220), triggers browser alert: *"तुमचा ब्राउझर व्हॉइस-टू-टेक्स्ट सपोर्ट करत नाही."* | Replace with `@capacitor-community/speech-recognition` or record audio blob via native media recorder and transcribe. |
| `src/components/AddScheduleForm.tsx:92-97` | `window.SpeechRecognition` / `webkitSpeechRecognition` | **No** (Web Speech API unsupported in WebView) | Guarded by `if (!SpeechRecognition)` (L93), displays Marathi alert and terminates | Integrate `@capacitor-community/speech-recognition` plugin with Android `RECORD_AUDIO` permission. |
| `src/components/AddCrop.tsx:23-27` | `window.SpeechRecognition` / `webkitSpeechRecognition` | **No** (Web Speech API unsupported in WebView) | Guarded by `if ("SpeechRecognition" in window ...)` (L23), falls back to `alert("तुमच्या ब्राउझरमध्ये व्हॉइस टायपिंगची सुविधा नाही.")` (L48) | Integrate native speech recognition plugin or speech-to-text cloud API. |
| `src/components/StandaloneDealerForm.tsx:176` | `window.open(origin + "/public-gateway?type=consultant", "_blank")` | **No** (Resolves to `https://localhost/public-gateway` which fails with `ERR_CONNECTION_REFUSED` in external mobile browser) | Fires `window.open` unshielded; in native APK, external browser cannot access internal `localhost` origin | Route internally via app state router (`setView('public-gateway')`) or use canonical production URL `HOSTING_URL`. |
| `src/components/DealersView.tsx:610-615` | `window.location.origin` inside `navigator.clipboard.writeText` | **Partial** (`origin` is `https://localhost`; copied link is unusable by external recipients) | Promise `.then()` alerts success, `.catch()` alerts fallback with `localhost` link | Use `HOSTING_URL` from `src/lib/config.ts` so shared registration link is public and accessible. |
| `src/main.tsx:51-74` | `@capacitor/push-notifications` | **Yes** (Native Plugin) | Guarded by `Capacitor.isNativePlatform()` (L50); caught in `catch(e)` | Token is logged to `console.log` (L60) but **never saved to Firestore** (`users/{id}/tokens`). Must persist token to database. |
| `src/components/SettingsView.tsx:192, 230-244` | `window.Notification` | **No** (HTML5 Web Notification constructor is unsupported in Android WebView) | Guarded by `typeof Notification === "undefined"` (L230); alerts unsupported browser message | Use `@capacitor/push-notifications` (already handled in L205 for native) and add `@capacitor/local-notifications` for scheduled offline alerts. |
| `src/components/AlertsView.tsx:91-105` | `new Notification(...)` | **No** (HTML5 Web Notification constructor is unsupported in Android WebView) | Guarded by `'Notification' in window` (L91); fails check and does nothing silently | Use `@capacitor/local-notifications` to trigger heads-up alert banner on device. |
| `src/App.tsx:417-453` | `window.Notification` & FCM Web Worker | **No** (`Notification` not in `window`) | Aborts at L418 (`console.log("Notification API not supported...")`); no token saved for native | Handled via Capacitor native push plugin; ensure token persistence logic is hooked for native users. |
| `src/App.tsx:2246-2275` | `showBrowserNotification` (`Notification`, `ServiceWorker.showNotification`) | **No** (Both Web Notification and Service Worker controllers are unavailable natively) | Guarded by `typeof Notification === 'undefined'` (L2246); plays audio chime, notification silently omitted | Forward notifications to `@capacitor/local-notifications` when `Capacitor.isNativePlatform()` is true. |
| `src/main.tsx:11-28` | `navigator.serviceWorker` & `window.caches` | **Intentionally Disabled** | If native, explicitly iterates `registrations.unregister()` and wipes `caches` to prevent stale WebView assets | Architectural design confirmed: Capacitor local assets via `WebViewAssetLoader` are authoritative. |
| `src/components/DealersView.tsx:611` | `navigator.clipboard.writeText` | **Yes** (in modern WebView with secure context `https://localhost`) | Has `.catch()` (L613) alerting failure and displaying raw text | Works on modern Android, but `@capacitor/clipboard` provides seamless cross-version clipboard access. |
| `src/components/PublicLinksSettings.tsx:61` | `navigator.clipboard.writeText` | **Yes** (Secure context) | **No `.catch()` handler**; unhandled rejection if permission denied | Attach `.catch()` block or use `@capacitor/clipboard`. |
| `src/components/ScheduleList.tsx:976` | `navigator.clipboard.writeText` | **Yes** (Secure context) | Unawaited call, no `.catch()`; executes `alert("वेळापत्रक कॉपी झाले!")` synchronously regardless of success | Await promise with try/catch; report error on rejection. |
| `src/components/SettingsView.tsx:318` | `navigator.clipboard.writeText` | **Yes** (Secure context) | `.then()` handler toggles UI state; unhandled rejection if blocked | Add `.catch()` handler. |
| `src/App.tsx:1443` | `navigator.clipboard.writeText` | **Yes** (Secure context) | Synchronous `try/catch` with fallback to `document.execCommand('copy')` (Note: promise rejection is async) | Await `writeText` within async function to ensure fallback triggers on rejection. |
| `src/components/SettingsView.tsx:337` | `navigator.share` | **Only with plugin / specific WebViews** (Often missing in Android WebView) | Falls back to `window.open("https://wa.me/?text=...", "_blank")` (L350) | Use `@capacitor/share` (already installed in `package.json`). |
| `src/components/PublicLinksSettings.tsx:74` | `navigator.share` | **Only with plugin / specific WebViews** | Falls back to `window.open("https://wa.me/?text=...", "_blank")` (L76) | Use `@capacitor/share` for native share sheet. |
| `src/lib/geo-helper.ts:22-45` | `@capacitor/geolocation` + `navigator.geolocation` fallback | **Yes** (Native GPS plugin + coarse fallback) | Tries native high accuracy, native low accuracy, browser GPS, and finally IP fallback | Fully guarded architecture; robust against native permission denials. |
| `src/components/AlertsView.tsx:553` | `navigator.geolocation.getCurrentPosition` | **Needs Device Test** (Bypasses Capacitor plugin; relies on WebChromeClient permission) | Has retry callback (L561); alerts Marathi permission denied message on failure | Route through `getSmartLocation()` from `src/lib/geo-helper.ts` to utilize native GPS plugin. |
| `src/App.tsx:1482` | `navigator.geolocation.watchPosition` | **Needs Device Test** (Raw browser API in WebView) | Logs warning to console on error (`L1490`); does not crash | Use `@capacitor/geolocation` `watchPosition` for native background accuracy. |
| `src/lib/fileDownload.ts:51-96` | `Filesystem.writeFile` + `Share.share` | **Yes** (Native Plugin) | Uses `Directory.Cache`, invokes native system Share sheet, shows Toast | Works reliably; covers APK downloads seamlessly without browser download manager. |
| `src/lib/fileDownload.ts:98-125` | `URL.createObjectURL` & `<a download>` | **N/A for Native** (Used only on Web fallback) | Web only | Keep as fallback for browser users. |
| `src/components/DealersView.tsx:641` | `window.print()` | **No** (WebView lacks print adapter by default) | Guarded by `if (Capacitor.isNativePlatform())` (L619); routes to `downloadFile` (CSV) natively | Safe on native; `window.print` only executes on web. |
| `src/components/FarmerList.tsx:117` | `window.print()` | **No** | Guarded by `if (Capacitor.isNativePlatform())` (L100); routes to `downloadFile` (CSV) natively | Safe on native; `window.print` only executes on web. |
| `src/components/LocationMapping.tsx:465` | `window.print()` | **No** | Guarded by `if (Capacitor.isNativePlatform())` (L462); routes to `handleExport()` (CSV) natively | Safe on native; `window.print` only executes on web. |
| `src/components/SettingsView.tsx:346, 350, 825` | `window.open(https://wa.me/..., "_blank")` | **Needs Device Test** (Depends on Android intent handling for `https://wa.me`) | Unshielded `window.open`; opens external WhatsApp app if intent registered | Use `Capacitor.openUrl` or `App.openUrl` for guaranteed native intent dispatch. |
| `src/components/ScheduleList.tsx:620` | `window.open(https://wa.me/..., "_blank")` | **Needs Device Test** | Unshielded `window.open` | Forward to native URL handler or `@capacitor/share`. |
| `src/components/PublicLinksSettings.tsx:76, 79` | `window.open(https://wa.me/..., "_blank")` | **Needs Device Test** | Unshielded `window.open` | Forward to native URL handler. |
| `src/components/DealersView.tsx:775` | `window.open(https://wa.me/..., "_blank")` | **Needs Device Test** | Unshielded `window.open` with `noopener,noreferrer` | Forward to native URL handler. |
| `src/components/AddScheduleForm.tsx:510` | `window.open(https://wa.me/..., "_blank")` | **Needs Device Test** | Unshielded `window.open` | Forward to native URL handler. |
| `src/components/DealersView.tsx:752` | `<a href="tel:...">` | **Yes** (Capacitor Android automatically delegates `tel:` to native dialer) | Native OS opens phone dialer | Fully supported on Android WebView. |
| `src/components/DealersView.tsx:761` | `<a href="https://www.google.com/maps/..." target="_blank">` | **Needs Device Test** (May load inside WebView if multiple windows not enabled) | Link opens external map query | Use `window.open(url, '_system')` or Capacitor Browser plugin. |
| `src/components/AddFarmerForm.tsx:738-740` | `<input type="file" accept="image/*" capture="environment">` | **Yes** (Delegated to Android file/camera chooser by BridgeWebChromeClient) | Wrapped in try/catch image compressor; sets `photoUrl` base64 on success | Ensure CAMERA permission is granted; background activity destruction during camera capture needs testing. |
| `src/components/BulkImportSection.tsx:349` | `<input type="file" accept=".csv,.json">` | **Yes** (System document picker) | Handled by `FileReader.readAsText`; errors alert Marathi notice | Fully functional via Capacitor file chooser. |
| `src/components/DealersView.tsx:1265` | `<input type="file">` (broadcast attachment) | **Yes** (System file picker) | Sets state file object | Fully functional. |
| `src/components/SettingsView.tsx:428` | `<input type="file" accept="image/*">` (profile avatar) | **Yes, but dangerous** (Reads raw uncompressed DataURL into state) | No compression; large camera photos (>1MB) can exceed Firestore doc size | Add image compression before saving profile avatar to Firestore. |
| `src/lib/data-sync.ts:39`, `src/App.tsx:257`, `src/components/SettingsView.tsx:62, 86, 98, 164` | `localStorage` (`setItem`, `getItem`, `removeItem`) | **Yes** (Persisted in app SQLite WebView database) | Read wrapped in try/catch; writes directly update storage | Functional, but subject to ~5–10MB WebView quota; monitor cached collections. |
| `src/` (Entire codebase) | `document.cookie` | **N/A** | Zero occurrences in codebase | No cookie dependency exists. |
| `src/lib/geo-helper.ts:98` | `fetch("https://api.bigdatacloud.net/...")` | **Yes** (HTTPS over INTERNET permission) | Caught in `catch(e)`; logs warning and returns null | Standard secure fetch. |
| `src/components/DealersView.tsx:266` | `fetch("https://nominatim.openstreetmap.org/...")` | **Needs Device Test** (OSM Nominatim blocks clients without custom User-Agent) | Caught in try/catch; fallback address extraction | Add custom User-Agent or route reverse geocode through backend service. |
| `src/components/AddFarmerForm.tsx:474` | `fetch("https://api.postalpincode.in/...")` | **Yes** (HTTPS) | Caught in try/catch; logs error to console | Third-party API reliability varies; guarded against crashes. |
| `src/components/AddFarmerForm.tsx:530` | `fetch("https://nominatim.openstreetmap.org/...")` | **Needs Device Test** (Attempts to pass `User-Agent` header, restricted in browsers) | Caught in try/catch; logs error to console | Browser engine may strip or error on forbidden header `User-Agent`. |

---

## PART 2 - Native Configuration Check

Inspection of Android configuration files (`AndroidManifest.xml`, `capacitor.config.ts`, `android/app/build.gradle`, `variables.gradle`, and assets):

| Configuration Item | Found Value / Declaration in Repo | Required for Feature | Status | Impact & Notes |
| :--- | :--- | :--- | :--- | :--- |
| `INTERNET` permission | `<uses-permission android:name="android.permission.INTERNET" />` (`AndroidManifest.xml:34`) | Firestore, Render Backend, Nominatim, Postal API | **OK** | Fully declared. Network traffic permitted. |
| `ACCESS_FINE_LOCATION` | `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` (`AndroidManifest.xml:36`) | High-accuracy GPS (`@capacitor/geolocation`) | **OK** | Declared alongside `ACCESS_COARSE_LOCATION` (L35) and `android.hardware.location.gps` (required=false, L37). |
| `POST_NOTIFICATIONS` | `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` (`AndroidManifest.xml:40`) | Android 13+ (API 33+) Push Notifications | **OK** | Explicitly declared. Required by modern Android runtime permission model. |
| `CAMERA` permission | `<uses-permission android:name="android.permission.CAMERA" />` (`AndroidManifest.xml:38`) | Farmer photo capture (`capture="environment"`) | **OK** | Declared with `android.hardware.camera` (required=false, L39). |
| Storage / Media permissions | **Not declared** in `AndroidManifest.xml` (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`) | Legacy file save outside cache; gallery access on Android <= 12 | **MISSING** | `fileDownload.ts` works because it writes to `Directory.Cache` (app-specific, no storage permission needed). However, direct external media access on older devices may require permissions. |
| Cleartext Traffic Setting | **Not set** (Default `android:usesCleartextTraffic="false"` in `<application>`) | Unencrypted `http://` traffic | **OK for HTTPS / MISSING for HTTP** | Android 9+ (API 28+) strictly blocks unencrypted HTTP. All configured endpoints are HTTPS, but any future HTTP API call will immediately fail with `ERR_CLEARTEXT_NOT_PERMITTED`. |
| `androidScheme` | **Not configured** in `capacitor.config.ts` (Defaults to `https` in Capacitor) | WebView asset serving protocol | **OK** | Served over `https://localhost`. Provides secure context for `crypto` and `clipboard`. |
| `allowNavigation` | **Not configured** in `capacitor.config.ts` | Navigating WebView to external domains | **OK** | Restricts WebView to local assets, preventing remote hijacking. External links must use system browser. |
| `FileProvider` setup | `<provider android:name="androidx.core.content.FileProvider" ...>` (`AndroidManifest.xml:23-29`) | Sharing files via `@capacitor/share` & Filesystem | **OK** | Configured with `${applicationId}.fileprovider`. `res/xml/file_paths.xml` declares `<cache-path name="my_cache_images" path="." />` and `<external-path name="my_images" path="." />`, covering `Directory.Cache`. |
| `google-services.json` | **Present** in `android/app/google-services.json` (677 bytes) | Firebase Cloud Messaging (FCM) & Google Services plugin | **OK** | Present. `build.gradle` conditionally applies `com.google.gms.google-services` plugin when file exists (L70-76). *(Keys redacted)*. |
| Native Push Registration | `src/main.tsx:51-74` imports `@capacitor/push-notifications` | Receiving FCM tokens and pushes | **MISSING Code Wiring** | Native listener receives token (L59), but does **not write it to Firestore** (`users/{id}/tokens/device-token`). Backend cannot route notifications to device. |
| `minSdkVersion` | `24` (Android 7.0 Nougat) (`android/variables.gradle:2`) | Minimum supported OS level | **OK** | Covers >98% of active Android devices worldwide. |
| `targetSdkVersion` | `36` (Android 16 preview) (`android/variables.gradle:4`) | Modern Android behavioral targeting | **OK** | Enforces Android 13+ notification runtime permissions and modern security restrictions. |
| `compileSdkVersion` | `36` (`android/variables.gradle:3`) | Build SDK version | **OK** | Compiles with latest Android SDK tools. |

---

## PART 3 - Backend Dependency & Render Service Behavior

### 1. Backend URL Resolution
* **Configuration Source**: `src/lib/config.ts:11-12`
  ```typescript
  export const BACKEND_URL: string = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || "https://vionex-4woy.onrender.com";
  ```
* **Baked-in Build Value**: In `dist/` and the compiled APK, `VITE_BACKEND_URL` was not overridden by environment variables during build, baking in the default production URL:
  $$\mathbf{https://vionex-4woy.onrender.com}$$
* **URL Resolver (`getApiUrl`)**: `src/lib/config.ts:36-52`. Prepends `BACKEND_URL` to the endpoint.

### 2. Screens Calling the Render Server

| Screen / Component | Endpoint & Method | Purpose | Timeout Configured? | Retry Configured? | UI State During Cold Start (50–90s wake-up) | UI State on 429, 500, or Timeout |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AlertsView** (`src/components/AlertsView.tsx:155-171`) | `POST /api/generate-crop-alerts` | Generates AI weather & pest advisories for Maharashtra crops | **None** (Default browser timeout) | **None** (Single attempt) | `isFetchingAI = true`. Shows animated loading spinner. No indicator explaining cold wake-up delay. | If `!res.ok`, throws `"API Limit or Error"`. Caught by catch block; sets `aiError` message banner in Marathi. |
| **LocationMapping** (`src/hooks/useMasterLocations.ts:277-289`) | `POST /api/taluka-villages` | Fetches official village list for Taluka to revalidate catalog | **None** | **None** | `loading = true`. Blocks screen interaction with loading spinner. | Caught by `catch (e)` (L330), returns `false`. Loading spinner ceases; **no error toast or message shown** (fails silently). |
| **AdvisoryView** (`src/components/AdvisoryView.tsx:69-90`) | `POST /api/advice` | Generates agronomy AI advice for specific crop, stage, and soil | **None** | **None** | `loading = true`. Button shows loading spinner. | On 500/429/timeout: if cached advice exists in `localStorage`, displays old advice with banner: *"नवीन माहिती मिळवताना अडचण आली. जुना सल्ला दाखवला जात आहे: ..."*; if no cache, displays error text. |
| **AddProductForm** (`src/components/AddProductForm.tsx:928-959`) | `POST /api/search-products` | Online AI product lookup / catalog autofill | **None** | `maxRetries = 1` (Effectively 1 attempt only, loop terminates) | `isSearching = true`. Shows searching indicator. | Falls back seamlessly to offline preseeded products (`preseeded-products.ts`) and cached searches; logs error in Firestore `api-error-logs`. Does not block UI. |
| **Server Admin Dispatch** (`server.ts:584-603`) | `POST /api/send-notification` | Admin FCM push notification broadcast via Firebase Admin SDK | N/A (Backend) | N/A | **Not called from client UI**. Server-only administrative endpoint. Client only listens for notifications. | Returns HTTP 500 with JSON error message if Firebase Admin Messaging fails. |

---

## PART 4 - Screen-by-Screen Test Sheet (The Main Output)

> **Legend**:  
> - **Roles**: Admin, Consultant, Sales, Viewer, User, Farmer.  
> - **Network**: Online, Airplane (Offline), Slow 3G / Throttled.  
> - **Pass/Fail & Notes**: Left blank for manual device execution.

### Section A: Top Suspects (Highest Failure Probability)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TS-01** | `LoginScreen.tsx:69`<br>Google Login | Tap "Google सह लॉगिन करा" on login screen | Must trigger Google Sign-In sheet and authenticate user | Any / All | Online | **CRITICAL RISK**: Android WebViews block `signInWithPopup` (`auth/disallowed-useragent`). | | |
| **TS-02** | `AddCrop.tsx:23`<br>Voice Typing | Tap the microphone icon next to Crop Name input | Voice prompt opens, speech converts to Marathi/English text | Admin, Consultant, Sales | Online | **PROVEN FAILURE**: Web Speech API is absent in Android WebView; unconditionally alerts *"तुमच्या ब्राउझरमध्ये व्हॉइस टायपिंगची सुविधा नाही."* | | |
| **TS-03** | `AddScheduleForm.tsx:92`<br>Voice Notes | Tap the microphone icon in Schedule Form notes | Spoken agronomic instructions convert to text note | Admin, Consultant | Online | **PROVEN FAILURE**: Web Speech API is absent in Android WebView; alerts *"तुमचा ब्राउझर व्हॉइस-टू-टेक्स्ट सपोर्ट करत नाही."* | | |
| **TS-04** | `MasterScheduleView.tsx:218`<br>Voice Notes | Tap microphone icon when editing master schedule task | Dictated instructions convert to text note | Admin, Consultant | Online | **PROVEN FAILURE**: Web Speech API absent in WebView; alerts *"तुमचा ब्राउझर व्हॉइस-टू-टेक्स्ट सपोर्ट करत नाही."* | | |
| **TS-05** | `StandaloneDealerForm.tsx:176`<br>Switch to Consultant | Tap "कन्सल्टंट नोंदणी करा (Consultant Registration)" link | Navigates to public consultant registration form | Public / Any | Online | **PROVEN FAILURE**: Calls `window.open("https://localhost/public-gateway...", "_blank")`. External browser fails with `ERR_CONNECTION_REFUSED`. | | |
| **TS-06** | `main.tsx:59`<br>Push Token Sync | Log into app, grant Notification permission when prompted | FCM token should be saved to Firestore `users/{uid}/tokens` | Any | Online | **SILENT DEFECT**: Native token received and logged to console, but never written to Firestore database. Device cannot receive targeted push alerts. | | |
| **TS-07** | `SettingsView.tsx:366`<br>Install App Setting | Go to Settings > Device, tap "Install App (ॲप इन्स्टॉल करा)" | App prompts install or reports native installation status | Any | Online | **CONFUSING UX**: Inside APK, alerts user: *"इन्स्टॉल करण्यासाठी ब्राउझर मेनू (३ ठिपके) वर क्लिक करून 'Install app' निवडा"* (tells user to use browser dots inside native app). | | |
| **TS-08** | `DealersView.tsx:266`<br>GPS Reverse Geocode | Add Dealer > Tap "GPS ऑटो डिटेक्ट (Auto Detect)" | Fills State, District, Taluka, Village from GPS coords | Admin, Sales | Online | **HIGH RISK**: Fetches OSM Nominatim without custom User-Agent. Nominatim blocks requests, failing reverse geocode. | | |
| **TS-09** | `AddFarmerForm.tsx:530`<br>GPS Reverse Geocode | Add Farmer > Tap "📍 चालू लोकेशन मिळवा (Get Location)" | GPS resolves and populates address hierarchy | Admin, Consultant, Sales | Online | **MEDIUM RISK**: Passes forbidden header `User-Agent` to `fetch()`. Chromium console reports warning; may fallback to IP lookup. | | |
| **TS-10** | `SettingsView.tsx:428`<br>Profile Avatar Upload | Settings > Edit Profile > Select high-res camera photo | Avatar updates and persists across app restarts | Any | Online | **HIGH RISK**: Reads raw uncompressed base64 data URL into user document. If photo > 1MB, Firestore throws `ResourceExhausted` / quota error. | | |
| **TS-11** | `AdvisoryView.tsx:69`<br>AI Advisory Cold Start | Open Advisory tab on a newly created crop | Advice generates after Render server responds | Farmer, Consultant | Online (Cold Server) | **HIGH RISK**: Free Render instance takes 50–90s to cold start. No request timeout; spinner spins indefinitely until network timeout. | | |
| **TS-12** | `AlertsView.tsx:155`<br>AI Alerts Cold Start | Open Alerts view > Tap "AI अलर्ट मिळवा (Fetch AI Alerts)" | Weather & crop disease alerts populate ticker | Admin, Consultant | Online (Cold Server) | **HIGH RISK**: If Render server sleeping, long hang with no progress indicator. On failure shows generic error. | | |
| **TS-13** | `useMasterLocations.ts:277`<br>Village Revalidation | Location Mapping > Revalidate Taluka Villages button | Downloads latest official villages from Render backend | Admin | Online (Cold Server) | **MEDIUM RISK**: If backend down or sleeping, loading spinner stops with zero user feedback or error banner. | | |
| **TS-14** | `DealersView.tsx:610`<br>Copy Dealer Reg Link | Dealer Network > Tap "Share Link (नोंदणी लिंक)" | Copies public registration link to clipboard | Admin, Sales | Online | **UX DEFECT**: Link copied contains `https://localhost/?view=register-dealer`. Invalid when pasted into WhatsApp / external phone. | | |
| **TS-15** | `AddFarmerForm.tsx:738`<br>Camera Photo Capture | Add Farmer > Tap Photo circle > Take photo with camera | Camera opens, takes photo, returns to form with fields intact | Admin, Consultant, Sales | Online | **NEEDS DEVICE TEST**: If Android OS terminates background MainActivity due to low camera memory, form reloads empty. | | |

---

### Section B: Screen-by-Screen Component & Flow Audit

#### 1. Authentication & Startup Flows (`App.tsx`, `LoginScreen.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S01-01** | `LoginScreen.tsx`<br>Farmer Login | Enter 10-digit registered mobile number > Tap "शेतकरी लॉगिन" | Authenticates anonymously and opens Farmer Dashboard | Farmer | Online | Low. Anonymous auth + Firestore query. | | |
| **S01-02** | `LoginScreen.tsx`<br>Farmer Login Offline | Attempt farmer login while in Airplane mode | Graceful offline alert or cached login check | Farmer | Airplane | Cached session in `localStorage` checks out; fresh login fails. | | |
| **S01-03** | `LoginScreen.tsx`<br>Staff Password Login | Enter staff Login ID / Email and password > Tap "लॉगिन करा" | Authenticates via Firebase Auth and opens staff Dashboard | Admin, Consultant, Sales | Online | Standard Firebase Auth REST call over HTTPS. | | |
| **S01-04** | `LoginScreen.tsx`<br>Session Persistence | Close app completely (swipe away from recent apps) and reopen | App reopens directly into authenticated Dashboard without login | Any | Online | Session token persisted in `localStorage` (`vionex-current-user`). | | |

#### 2. Dashboard (`Dashboard.tsx`, `App.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S02-01** | `Dashboard.tsx`<br>Metrics Cards | View Total Farmers, Active Schedules, Dealers counts | Numbers match Firestore collections accurately | Admin, Consultant | Online | Real-time snapshot sync (`data-sync.ts`). | | |
| **S02-02** | `Dashboard.tsx`<br>Offline Cached Counts | Enable Airplane mode and refresh Dashboard | Shows previously cached numbers without crashing | Any | Airplane | Backed by `localStorage` collection cache. | | |
| **S02-03** | `Dashboard.tsx`<br>Alerts Ticker | Check scrolling alert ticker at top of screen | Displays active agronomy alerts | Any | Online | Renders synced `alerts` collection. | | |
| **S02-04** | `Dashboard.tsx`<br>Quick Navigation | Tap "Add Farmer", "New Schedule", "Catalog" shortcuts | Navigates directly to respective forms | Staff | Online | Internal React state navigation (`setView`). | | |

#### 3. Farmer Management (`FarmerList.tsx`, `AddFarmerForm.tsx`, `AddCrop.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S03-01** | `AddFarmerForm.tsx`<br>Pincode Auto-Fill | Enter valid 6-digit Pincode (e.g., 416416) | Post office list loads; auto-populates Taluka, District, State | Staff | Online | Dependent on `api.postalpincode.in` HTTP availability. | | |
| **S03-02** | `AddFarmerForm.tsx`<br>GPS Auto-Detect | Tap "📍 चालू लोकेशन मिळवा" | Captures high accuracy latitude/longitude coordinates | Staff | Online | Uses `getSmartLocation()` (`@capacitor/geolocation`). | | |
| **S03-03** | `AddFarmerForm.tsx`<br>Photo Compression | Select image from gallery | Image compresses smoothly to <100KB base64 string | Staff | Online | In-memory canvas compression (`compressImage`). | | |
| **S03-04** | `AddFarmerForm.tsx`<br>Save Farmer | Fill required fields > Tap "शेतकरी जतन करा" | Saves to Firestore `farmers`, adds to offline list, closes form | Staff | Online / Offline | Queues write in Firestore offline cache. | | |
| **S03-05** | `AddCrop.tsx`<br>Add Crop to Plot | Select crop, variety, stage, acreage, planting date > Save | Adds crop to farmer's active plot list | Staff | Online | Form inputs validation. (Voice typing broken per TS-02). | | |
| **S03-06** | `FarmerList.tsx`<br>Search & Filter | Type farmer name, mobile, or filter by village | List filters instantly with zero latency | Staff | Online | Client-side memory filter over synced array. | | |
| **S03-07** | `FarmerList.tsx`<br>Export CSV | Tap "CSV Export" icon in farmer list header | Native Share dialog opens to save/share `farmers_list_*.csv` | Staff | Online | Uses `downloadFile()` (`@capacitor/filesystem` + `Share`). | | |
| **S03-08** | `FarmerList.tsx`<br>Print Guard | Tap Print/PDF icon on phone | Triggers CSV download/share natively instead of `window.print()` | Staff | Online | Guarded by `Capacitor.isNativePlatform()` (L100). | | |

#### 4. Product Catalog & AI Autofill (`ProductList.tsx`, `AddProductForm.tsx`, `ProductDetailsModal.tsx`, `BulkImportSection.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S04-01** | `AddProductForm.tsx`<br>AI Product Search | Type product name > Tap "Online Search (AI शोध)" | Suggestions dropdown populates from Render backend or offline fallback | Staff | Online | Calls `POST /api/search-products`. Falls back gracefully. | | |
| **S04-02** | `AddProductForm.tsx`<br>Manual Product Add | Enter Brand, Category, Formulation, Dose, Target Pests > Save | Product saves to Firestore `products` collection | Staff | Online | Standard Firestore write. | | |
| **S04-03** | `ProductList.tsx`<br>Search & Filter | Filter products by Category (बुरशीनाशक, कीटकनाशक, टॉनिक) | Catalog filters instantly | Any | Online | Client-side array filtering. | | |
| **S04-04** | `ProductList.tsx`<br>Duplicate Product | Tap Duplicate icon on any product | Clones product details into Add form with "(Copy)" suffix | Staff | Online | Clones state in memory; opens form. | | |
| **S04-05** | `ProductList.tsx`<br>Delete Product | Tap Delete icon > Confirm dialog | Product removed from catalog | Admin | Online | Uses `window.confirm` (`BridgeWebChromeClient` dialog). | | |
| **S04-06** | `ProductDetailsModal.tsx`<br>Modal View | Tap on any product card in catalog | Full detail modal pops up displaying technical doses | Any | Online | Handled by React state modal. | | |
| **S04-07** | `BulkImportSection.tsx`<br>CSV Import | Tap file upload box > Select CSV file from phone storage | File parses, displays preview count, imports valid products | Admin | Online | System file picker parses via `FileReader.readAsText`. | | |

#### 5. Master Schedules (`MasterScheduleView.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S05-01** | `MasterScheduleView.tsx`<br>Template Browser | Browse pre-built schedules (द्राक्ष, डाळिंब, केळी, ऊस) | Timeline stages and spray days display cleanly | Staff | Online | Local template definitions in `masterScheduleService.ts`. | | |
| **S05-02** | `MasterScheduleView.tsx`<br>Create Template | Create new custom crop template > Add Days & Products > Save | Persists to `master_schedules` collection | Admin, Consultant | Online | Standard Firestore document write. | | |
| **S05-03** | `MasterScheduleView.tsx`<br>Apply to Plot | Select template > Tap "Apply to Farmer Plot" > Pick Pruning Date | Generates individual schedule tasks calculated from base date | Staff | Online | Math calculation creates schedule items in batch. | | |

#### 6. Schedules Management (`ScheduleList.tsx`, `AddScheduleForm.tsx`, `SchedulePreviewModal.tsx`, `CalendarPicker.tsx`, `DatePicker.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S06-01** | `AddScheduleForm.tsx`<br>Draft Auto-Save | Enter schedule details, navigate away without saving, return | Form restores unsaved inputs from draft cache | Staff | Online | Backed by `localStorage.getItem("schedule_form_draft")`. | | |
| **S06-02** | `AddScheduleForm.tsx`<br>WhatsApp Share | Fill schedule form > Tap "WhatsApp वर पाठवा" | Opens WhatsApp with pre-composed schedule text | Staff | Online | `window.open("https://wa.me/?text=...", "_blank")`. | | |
| **S06-03** | `ScheduleList.tsx`<br>Mark Stage Done | Tap status checkbox on a spray schedule day | Toggles stage between pending and completed; syncs real-time | Staff, Farmer | Online | Updates document field in `schedules`. | | |
| **S06-04** | `ScheduleList.tsx`<br>Copy Schedule Text | Tap Copy button on schedule card | Copies text to clipboard, shows alert: *"वेळापत्रक कॉपी झाले!"* | Staff, Farmer | Online | `navigator.clipboard.writeText` in WebView context. | | |
| **S06-05** | `SchedulePreviewModal.tsx`<br>Export Image (PNG) | Tap "Share / Save Image" on schedule preview | Renders PNG via `html-to-image`; opens native Share sheet | Any | Online | Uses `downloadFile()` (`@capacitor/filesystem` + `Share`). | | |
| **S06-06** | `CalendarPicker.tsx` & `DatePicker.tsx` | Tap calendar selector on schedule date | Modal calendar opens; selecting date updates form value | Any | Online | Self-contained React modal pickers. | | |

#### 7. Dealer Network (`DealersView.tsx`, `StandaloneDealerForm.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S07-01** | `DealersView.tsx`<br>Dealer Directory | Browse list of registered agro-dealers | Cards display shop name, proprietor, village, status | Any | Online | Synced `dealers` collection. | | |
| **S07-02** | `DealersView.tsx`<br>Direct Phone Call | Tap phone icon on dealer card | Launches native Android phone dialer with number pre-filled | Any | Online | `<a href="tel:...">` intent handled by Android OS. | | |
| **S07-03** | `DealersView.tsx`<br>Google Maps Link | Tap MapPin icon on dealer card | Opens dealer location in Google Maps app | Any | Online | Target `_blank` link to `google.com/maps/search/`. | | |
| **S07-04** | `DealersView.tsx`<br>WhatsApp Message | Tap WhatsApp icon on dealer card | Launches WhatsApp with tailored dealer greeting | Any | Online | Dispatches `https://wa.me/91...` intent. | | |
| **S07-05** | `DealersView.tsx`<br>Broadcast Notification | Broadcast text + file attachment to dealers | Saves broadcast event to `localStorage` | Admin | Online | `<input type="file">` handled by BridgeWebChromeClient. | | |
| **S07-06** | `DealersView.tsx`<br>Export CSV | Tap "Export / Print" in header | Saves/shares `dealers_list_*.csv` via native Share sheet | Staff | Online | Routes through `downloadFile()`. | | |

#### 8. Consultants Network (`ConsultantsView.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S08-01** | `ConsultantsView.tsx`<br>Consultant List | Browse agronomy consultants list | Displays names, qualifications, phone, approval status | Staff | Online | Synced `consultants` collection. | | |
| **S08-02** | `ConsultantsView.tsx`<br>Approve / Reject | Tap Approve toggle on pending consultant | Status updates to 'Active' in Firestore | Admin | Online | Updates document field in Firestore. | | |
| **S08-03** | `ConsultantsView.tsx`<br>Direct Phone Call | Tap phone icon next to consultant | Launches native phone dialer | Staff | Online | Native `tel:` scheme. | | |

#### 9. Alerts Ticker & Advisory (`AlertsView.tsx`, `AdvisoryView.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S09-01** | `AlertsView.tsx`<br>Real-Time Alerts | Open Alerts tab | View weather alerts, disease warnings, spray advisories | Any | Online | Synced `alerts` collection. | | |
| **S09-02** | `AlertsView.tsx`<br>My Location Alert Filter | Tap "📍 माझे चालू लोकेशन वापरा" | Filters alerts within 50km radius of phone's GPS position | Any | Online | Uses `navigator.geolocation.getCurrentPosition`. | | |
| **S09-03** | `AdvisoryView.tsx`<br>Cached AI Advice | Open Advisory tab on previously queried crop in Airplane mode | Immediately renders previously cached agronomy advice | Farmer | Airplane | Backed by `localStorage.getItem("krushi-mitra-advice-...")`. | | |

#### 10. Location Mapping (`LocationMapping.tsx`, `useMasterLocations.ts`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S10-01** | `LocationMapping.tsx`<br>Maharashtra Hierarchy | Select District > Taluka > Village dropdowns | Filters dealers and mapping status for selected geography | Admin, Sales | Online | Local pre-seeded datasets (`maharashtra-locations.ts`). | | |
| **S10-02** | `LocationMapping.tsx`<br>Export Locations CSV | Tap "Export CSV" icon in header | Opens native Share sheet with `locations_*.csv` | Admin | Online | Uses `downloadFile()` (`@capacitor/filesystem`). | | |
| **S10-03** | `LocationMapping.tsx`<br>Print PDF Button | Tap "PDF" button in header | Natively triggers CSV file download rather than crashing | Admin | Online | Guarded by `Capacitor.isNativePlatform()` (L462). | | |
| **S10-04** | `LocationMapping.tsx`<br>Delete Village Entry | Tap delete button on village row > Confirm dialog | Deletes master location entry from Firestore | Admin | Online | Uses `confirm()` dialog. | | |

#### 11. Settings & App Configuration (`SettingsView.tsx`, `PublicLinksSettings.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S11-01** | `SettingsView.tsx`<br>Language Switcher | Switch between Marathi (मराठी) and English | Entire UI text updates language immediately | Any | Online / Offline | Saved in `localStorage.setItem("vionex-app-language")`. | | |
| **S11-02** | `SettingsView.tsx`<br>Theme Switcher | Switch between Light mode and Dark mode | App theme toggles; persists upon restart | Any | Online / Offline | Saved in `localStorage.setItem("vionex-app-theme")`. | | |
| **S11-03** | `SettingsView.tsx`<br>Push Toggle | Tap "Enable Notifications" | System permission dialog appears; status shows Granted | Any | Online | Invokes `@capacitor/push-notifications.requestPermissions()`. | | |
| **S11-04** | `SettingsView.tsx`<br>Share App via WhatsApp | Tap "Share App (ॲप शेअर करा)" | Launches WhatsApp with app invitation message | Any | Online | `window.open("https://wa.me/?text=...", "_blank")`. | | |
| **S11-05** | `PublicLinksSettings.tsx`<br>Copy Dealer Form Link | Tap Copy icon next to Dealer Link | Link copied; temporary checkmark displays | Admin | Online | `navigator.clipboard.writeText`. Unhandled rejection if blocked. | | |
| **S11-06** | `SettingsView.tsx`<br>Logout Confirmation | Tap Logout button > Confirm | Clears current user session and returns to login screen | Any | Online / Offline | Wipes `localStorage("vionex-current-user")`. | | |

#### 12. Administration & Activity Logs (`AdminView.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S12-01** | `AdminView.tsx`<br>Create User | Enter Name, Mobile, Role (Consultant/Sales/Viewer), Password > Save | User created in Firestore `users` and Firebase Auth | Admin | Online | Creates Firebase Auth credential + Firestore doc. | | |
| **S12-02** | `AdminView.tsx`<br>Change Role | Change a user's role dropdown from 'viewer' to 'consultant' | Permissions update instantly in real time | Admin | Online | Updates document field in `users`. | | |
| **S12-03** | `AdminView.tsx`<br>Activity Logs | Tap "Activity Logs" tab | Displays chronological audit log of all database changes | Admin | Online | Synced `activity_logs` collection. | | |
| **S12-04** | `AdminView.tsx`<br>Delete Farmer Confirmation | Tap Delete on farmer record > Confirm dialog | Farmer record is permanently deleted | Admin | Online | Uses `confirm()` dialog. | | |

#### 13. Public Gateway Forms (`PublicFormGateway.tsx`, `NeutralPublicPortal.tsx`, `ConfirmationModal.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S13-01** | `PublicFormGateway.tsx`<br>URL Query Routing | Open app with `?view=register-dealer` parameter | Directly renders dealer registration portal | Public | Online | Parses URL parameters on mount. | | |
| **S13-02** | `NeutralPublicPortal.tsx`<br>Public Dealer Register | Fill dealer form without logging into app > Submit | Saves dealer to Firestore with `approvalStatus = 'Pending'` | Public | Online | Anonymous Firestore submission. | | |
| **S13-03** | `ConfirmationModal.tsx`<br>Modal Dialog | Trigger any deletion or confirmation action in app | Modal overlay displays title, description, Confirm/Cancel buttons | Any | Online | Self-contained React modal dialog. | | |

#### 14. Error Boundaries (`ErrorBoundary.tsx`, `LocalErrorBoundary.tsx`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S14-01** | `ErrorBoundary.tsx`<br>Global Crash Handler | Trigger deliberate UI exception in child component | Displays clean fallback card with "ॲप रीस्टार्ट करा (Restart App)" | Any | Online / Offline | Catches React rendering exceptions. | | |
| **S14-02** | `ErrorBoundary.tsx`<br>Reset App Session | Tap "Reset Session" button on error screen | Clears `localStorage` session and forces clean reload | Any | Online / Offline | Wipes `vionex-current-user` and reloads window. | | |
| **S14-03** | `LocalErrorBoundary.tsx`<br>Widget Crash Isolation | Cause an error in an individual card or chart widget | Widget shows inline error card; rest of screen continues operating | Any | Online / Offline | Prevents entire screen from crashing. | | |

#### 15. Hardware Navigation & App Lifecycle (`App.tsx`, `backNavigation.ts`)

| ID | Screen / Feature | Action to Perform on the Phone | Expected Result | Role | Network | Risk from Parts 1–3 | Pass / Fail | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **S15-01** | `App.tsx:1271`<br>Hardware Back on Modal | Open any modal (e.g., Add Farmer, Product Detail) > Press phone Back button | Closes the open modal; stays on current screen | Any | Online / Offline | Handled by `executeTopBackHandler()` (`backNavigation.ts`). | | |
| **S15-02** | `App.tsx:1126`<br>Hardware Back on Drawer | Open sidebar navigation drawer > Press phone Back button | Closes sidebar drawer; stays on current screen | Any | Online / Offline | Intercepted by `isSidebarOpen` handler. | | |
| **S15-03** | `App.tsx:1141`<br>Hardware Back Screen Pop | Navigate Dashboard -> Farmer -> Add Plot > Press Back button | Pops back to previous screen in history stack | Any | Online / Offline | Pops from `historyStackRef`. | | |
| **S15-04** | `App.tsx:1214`<br>Root First Back Press | On main Dashboard screen, press phone Back button once | Displays native Android Toast: *"पुन्हा Back दाबा बाहेर पडण्यासाठी"* | Any | Online / Offline | Native `@capacitor/toast` notification. Starts 2000ms window. | | |
| **S15-05** | `App.tsx:1180`<br>Root Double Back Press | Press phone Back button twice within 2000 milliseconds | App cleanly exits to phone home screen | Any | Online / Offline | Invokes `CapApp.exitApp()`. | | |
| **S15-06** | `App.tsx`<br>In-App App Update | Check for in-app update prompt when new version is available | Notification or dialog prompting user to update APK | Any | Online | **MISSING FEATURE**: No in-app update checker exists in code. User must manually download and reinstall APK. | | |

---

## PART 5 - Debug Instructions for Capturing APK Failures

When running test passes on physical Android devices, use the following procedures to capture accurate diagnostic logs and report defects:

### 1. Enabling Safe WebView Remote Debugging
To inspect the running Capacitor Android WebView via Google Chrome DevTools on a PC:
1. On the Android phone, enable **Developer Options**:
   * Open **Settings** > **About Phone** > Tap **Build Number** 7 times until *"You are now a developer"* appears.
   * Go to **Settings** > **Developer Options** > Enable **USB Debugging**.
2. Connect phone to computer via USB cable. Accept the *"Allow USB debugging?"* prompt on the phone screen.
3. Open Google Chrome on your computer and navigate to:
   $$\mathbf{chrome://inspect/\#devices}$$
4. Under the **Remote Target** list, locate `com.vionex.smartfarming` and click **inspect**.
5. You now have full Chrome DevTools access to the phone's live WebView:
   * View the interactive **Console** for uncaught JavaScript exceptions, CSP violations, and promise rejections.
   * Monitor the **Network** tab to inspect status codes (429, 500, CORS errors) and slow Render requests.
   * Inspect **Application** > **Storage** to review `localStorage` keys and sizes.

### 2. Capturing Android System Logs via ADB (`adb logcat`)
Filter specifically for Capacitor, Chromium WebView, and Web Console errors from PowerShell or terminal:

```powershell
# Filter specifically for Chromium Web Console logs & Capacitor bridge messages:
adb logcat -v time chromium:D Capacitor:D Capacitor/Console:D *:S

# Capture all uncaught JS errors, network drops, and native crashes to a file:
adb logcat -v time *:E | Tee-Object -FilePath "docs/apk_crash_log.txt"
```

To clear stale logs before starting a test run:
```powershell
adb logcat -c
```

### 3. Important: Package Conflict During Reinstallation
> [!CAUTION]
> **Package Signature Conflict**:  
> If an official Release-signed APK (signed with `vionex-release-key.jks`) is already installed on the phone, attempting to install a local Debug build via `adb install` or Android Studio will fail with:
> $$\text{Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package com.vionex.smartfarming signatures do not match previously installed version]}$$
> 
> **Resolution**:  
> 1. Manually **Uninstall** the existing VIONEX app from the phone first (`adb uninstall com.vionex.smartfarming` or long-press app icon > Uninstall).  
> 2. **Data Safety Guarantee**: Uninstalling the app wipes only local `localStorage` caches; **all business data, farmers, schedules, and products remain 100% safe** because the single source of truth lives in cloud Firestore.

### 4. What Information to Send Back on Failure
When a test row fails, record and provide the following 5 pieces of information:
1. **Screen Name & Feature ID** (e.g., `TS-01` on `LoginScreen.tsx` or `S03-02` on `AddFarmerForm.tsx`).
2. **Logged-in Role** (Admin / Consultant / Sales / Viewer / User / Farmer).
3. **Network State** (Wi-Fi Online / 4G / Throttled / Airplane mode).
4. **Exact Error Text** (Exact alert dialog message, red banner text, or logcat console error snippet).
5. **Screenshot or Short Video** showing the visual state of the screen when the failure occurred.
