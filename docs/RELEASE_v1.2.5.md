# VIONEX Release v1.2.5 — Release Notes & Audit Summary

> **Build Target**: Android Signed Release APK & Web Production Bundle  
> **Package Identifier**: `com.vionex.smartfarming`  
> **Version**: `1.2.5` (`versionCode: 6`)  
> **Release Date**: October 25, 2026  
> **Artifacts**: `releases/VIONEX-v1.2.5.apk`, `releases/VIONEX-v1.2.4.apk` (Rollback)

---

## 1. Overview
Version 1.2.5 delivers major reliability, agronomy calculation accuracy, and Android WebView parity improvements identified during the Capacitor APK audit. It resolves schedule date drift across leap/timezones, replaces broken voice recognition with rock-solid text inputs, guarantees valid public web links, prevents cold-start server timeout failures, and safely compresses profile avatars.

---

## 2. Key Improvements & Fixes

### 2.1 Schedule & Date Calculation Overhaul — Day 1 = Planting Day
* **Day 1 = Planting Day Rule**: As per the owner's agronomy source of truth, in master templates Day 1 represents the planting day itself.
  * Forward calculation: `date = plantation date + (dayNo - 1)` calendar days when `dayNo >= 1`.
  * Pre-planting / non-positive days: for `dayNo <= 0`, offset = `dayNo` (e.g. Day 0 = planting day, Day -3 = 3 days before planting).
  * Reverse calculation (date -> day): picking the planting date gives Day 1, the next day gives Day 2 (`diffDays >= 0 ? diffDays + 1 : diffDays`), ensuring bidirectional consistency in `AddScheduleForm.tsx`.
  * Bidirectional sync: entering or changing the Day number in `AddScheduleForm.tsx` now immediately auto-calculates the Schedule Date when a plot's plantation date is present.
* **Stored Schedules Unchanged**: Previously applied and saved schedules in Firestore are strictly untouched. They keep their existing dates without retroactive recalculation.
* **Calendar Arithmetic**: Replaced imprecise millisecond timestamp additions (`+ day * 86,400,000`) with calendar day arithmetic `new Date(year, monthIndex, dayOfMonth + offset)`. This eliminates day-offset bugs across daylight saving, IST timezone boundaries, and leap periods.
* **No More "Today" Guesses**: When a farmer's plot has no plantation date specified, `calculateDateForDay()` now returns an explicit blank string `""` rather than guessing "today".
* **Apply-to-Plot Protection**: In `MasterScheduleView.tsx`, the "Apply to Farmer Plot" button is strictly disabled if the selected plot lacks a plantation date or if the custom date is empty, displaying an explicit bilingual warning banner: *"या प्लॉटची लागवड तारीख भरलेली नाही / Plantation date is missing for this plot"*.
* **Day 1 Clarification Hint**: Updated visual helper hints to `💡 Day 1 = planting day (दिवस 1 = लागवडीचा दिवस)` across `AddScheduleForm.tsx` and `MasterScheduleView.tsx` so consultants and farmers clearly understand stage offsets.
* **Robust Schedule Sorting**: Introduced `toDateKey()` and `toMillis()` helpers in `ScheduleList.tsx`. The schedule list cleanly compares dates formatted as `YYYY-MM-DD`, `DD-MM-YYYY`, or `DD/MM/YYYY` without throwing `NaN` comparator corruptions.
* **Plantation Date Edit Confirmation**: Editing a plot's plantation date in `AddFarmerForm.tsx` triggers a confirmation warning notifying staff that existing schedules retain their established dates unless modified separately.

### 2.2 Voice Input Removal (TS-02, TS-03, TS-04)
* The Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) is unsupported in standard Android System WebView, causing silent crashes or error popups.
* Completely removed the mic buttons, speech listeners, audio state, and unused voice UI strings from `AddCrop.tsx`, `AddScheduleForm.tsx`, and `MasterScheduleView.tsx`.
* Text fields, typing ergonomics, layout integrity, and autocomplete remain 100% operational on both Web and Android.

### 2.3 Public & Shareable Links (TS-05, TS-14)
* Replaced `window.location.origin` (which evaluated to unreachable `https://localhost` inside the native Android APK) with the production `HOSTING_URL` (`https://vionex-4woy.onrender.com`).
* Affected links:
  * Dealer registration share link and WhatsApp broadcast messages (`DealersView.tsx`).
  * Public portal settings links for dealers, consultants, and farmers (`PublicLinksSettings.tsx`).
  * App invitation share message (`SettingsView.tsx`).
* In `StandaloneDealerForm.tsx`, clicking the consultant portal switch now changes in-app portal tabs via state rather than firing a `window.open` call to localhost.

### 2.4 Android WebView Native Guarding (TS-07, TS-01)
* **Install App**: The "Install App / ॲप इन्स्टॉल करा" PWA card in `SettingsView.tsx` is automatically hidden on native Android (`!Capacitor.isNativePlatform()`), avoiding confusing redundant install prompts inside the installed APK.
* **Google OAuth Sync**: The Google Sync button in `LoginScreen.tsx` is hidden on Android native to prevent Google OAuth's `disallowed_useragent` blocking error. Core staff, consultant, and farmer authentication flows remain fully functional via ID/password and mobile login.

### 2.5 Resilient Timeouts & Cold-Start Wakeup (TS-11, TS-12, TS-13)
* Introduced a shared `fetchWithTimeout()` utility with a 45-second `AbortController` timeout for backend requests (`/api/advice`, `/api/generate-crop-alerts`, `/api/search-products`, and `/api/taluka-villages`).
* **3-Second Waking Notice**: If a backend request on free/serverless hosting takes longer than 3 seconds to respond, a non-intrusive bilingual message appears: *"सर्व्हर सुरू होत आहे, यास एक मिनिट लागू शकतो (Server is waking up, this can take up to a minute)"*.
* **User-Facing Retry**: If a timeout occurs, clear error cards with "पुन्हा प्रयत्न करा (Retry)" buttons allow immediate re-triggering without reloading the entire application.
* **Non-Blocking Location Notice**: In `useMasterLocations.ts`, revalidation failures display a non-blocking banner at most once per session (and never when offline), preserving full IndexedDB/local cache fallbacks.

### 2.6 Profile Avatar Canvas Compression (TS-10)
* Implemented client-side canvas image compression (`compressImage`) in `SettingsView.tsx`.
* User profile pictures are compressed to <100 KB before saving to Firestore, preventing document bloat.
* Payloads exceeding 700 KB are strictly rejected with an informative Marathi/English error notice.

### 2.7 Reverse Geocoding Multi-Provider Fallback (TS-08, TS-09)
* Removed the forbidden `User-Agent` HTTP header from reverse geocode fetch requests in `AddFarmerForm.tsx`.
* Added `reverseGeocodeWithFallback()` in `geo-helper.ts`: attempts high-accuracy BigDataCloud reverse geocoding first, falling back to OpenStreetMap Nominatim, with user-friendly alerts if both fail.

### 2.8 Clipboard Async Reliability
* Added `await` and `try-catch` blocks around all `navigator.clipboard.writeText` calls in `PublicLinksSettings.tsx`, `ScheduleList.tsx`, `SettingsView.tsx`, and `App.tsx` with user-facing fallback alerts when clipboard permissions are denied.

### 2.9 Embedded APK Packaging Fix
* Fixed historical build artifact nesting where the previous release APK residing in `public/vionex.apk` was copied by Vite into `dist/` and bundled into `assets/public/vionex.apk` by Capacitor. Added permanent Vite build asset exclusion and AAPT asset filter `:!*.apk`, reducing total APK size by ~49.27 MB.

### 2.10 Calendar Export (Spray Schedules)
* **Per-Schedule Google Calendar Link**: Added a small bilingual "Add to Google Calendar / Google कॅलेंडरमध्ये जोडा" button on each schedule row that generates an all-day Google Calendar link with title (`VIONEX: <crop> - <product names>`) and description (Day, Method, Products with doses, Notes).
* **Visible List .ics Download**: Added a "Download calendar file (.ics) / कॅलेंडर फाइल डाउनलोड करा" button for the visible list that exports schedules with valid dates to a standard RFC 5545 iCalendar (`.ics`) file.
* **One-Day Reminder**: Included a built-in `VALARM` reminder configured 1 day before the scheduled application date (`TRIGGER:-P1D`).
* **Zero Auth & No OAuth/API**: Operates entirely client-side in the browser/app without Google sign-in, OAuth scopes, or Google Calendar API dependencies.
* **Strict Privacy**: Farmer mobile numbers and personal phone records are strictly excluded from all calendar event fields.
* **Android Native Support**: Reuses the app's existing universal `downloadFile` mechanism (`@capacitor/filesystem` + `@capacitor/share`). Marked as **NEEDS DEVICE TEST** for opening the link and saving the file on Android.

---

## 3. Package Verification & Technical Metrics

| Metric | Details |
| :--- | :--- |
| **Package Name** | `com.vionex.smartfarming` |
| **Version Code** | `6` |
| **Version Name** | `1.2.5` |
| **Signing Certificate SHA-256** | `16a9201aa57a75b597583adddfb69ef73dea7e09a464be847d39ae21d277bd93` |
| **Certificate Issuer** | `CN=Shrenika Patil, OU=Unknown, O=VIONEX, L=SANGLI, ST=Maharashtra, C=IN` |
| **Cert Match vs v1.2.4** | **100% Identical** (Seamless update without uninstall) |
| **App Permissions** | `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`, `POST_NOTIFICATIONS` |
| **APK File Size** | 8,916,350 bytes (~8.50 MB; reduced from 57.77 MB after stripping embedded APK) |
| **Rollback APK** | `releases/VIONEX-v1.2.4.apk` (53,187,860 bytes, untouched) |

---

## 4. Phone Verification Checklist (NEEDS DEVICE TEST)

The following items should be tested on an actual Android handset running the v1.2.5 APK:

1. **In-Place App Update**: Install `VIONEX-v1.2.5.apk` over existing `v1.2.4` without uninstalling to verify keystore signature continuity and local SQLite data preservation.
2. **External Link Intents**: Tap WhatsApp (`wa.me`) share buttons and Google Maps dealer location links to verify Android OS intent handling.
3. **Camera Chooser & Memory**: Capture a crop or farmer photo using the native camera under low-memory conditions to verify that background activity destruction does not drop unsaved form data.
4. **GPS Auto-Detect**: Tap "चालू लोकेशन मिळवा" in `AddFarmerForm` and `DealersView` to verify prompt permissions and reverse geocode address resolution.
5. **Backend Cold-Start**: Trigger AI Advisory or live alerts after backend idle period; verify the 3-second waking banner and subsequent successful display or retry button on failure.
6. **Calendar Export (NEEDS DEVICE TEST)**: Tap "Google कॅलेंडरमध्ये जोडा" to verify `window.open` navigation to Google Calendar, and tap "कॅलेंडर फाइल डाउनलोड करा (.ics)" to verify native cache write and system Sharesheet save on Android.

