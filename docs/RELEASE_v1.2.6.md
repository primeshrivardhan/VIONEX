# VIONEX Release v1.2.6 — Release Notes & Audit Summary

> **Build Target**: Android Signed Release APK & Web Production Bundle  
> **Package Identifier**: `com.vionex.smartfarming`  
> **Version**: `1.2.6` (`versionCode: 7`)  
> **Release Date**: November 7, 2026  
> **Artifacts**: `releases/VIONEX-v1.2.6.apk`, `releases/VIONEX-v1.2.5.apk` (Rollback), `releases/VIONEX-v1.2.4.apk` (Rollback)

---

## 1. Overview
Version 1.2.6 introduces the full **Schedule Share → Preview → Download (PDF / PNG)** capability, responsive sheet scaling matching phone screens without horizontal scroll, synchronized gap-day calculations between list view and export sheet, linked dealer owner/contact badges, product details fallback consistency (`N/A`), and safety guards against canvas overflow for 30+ schedule entries.

---

## 2. What Is New in v1.2.6

### 2.1 Schedule Share → Full-Screen Preview & Download (PDF / PNG)
* **Camera Icon on Farmer Card**: Opens a full-screen, high-fidelity schedule sheet preview formatted for A4 printing and mobile viewing.
* **Dual Format Download**: Allows farmers and consultants to download the schedule either as an **A4 Multi-Page PDF** or as a **Full-Sheet PNG image** via a native bottom sheet modal.
* **Native Browser Rendering Engine**: Switched rendering to `html-to-image` (lazy-loaded), fully compatible with modern Tailwind CSS 4 color functions (`oklch(...)`), avoiding `html2canvas` color-parsing failures.
* **Entry-Safe PDF Pagination**: Slices multi-page schedules strictly along block boundaries (`data-sheet-block`), ensuring no schedule entry or gap card is awkwardly sliced across page folds. Each page includes an `n / N` footer.
* **Canvas Limit Safeguard**: Auto-downgrades capture `pixelRatio` (2.0 → 1.5 → 1.0) when rendering extremely tall schedules (30+ entries) to prevent exceeding browser canvas texture memory limits (~16,384 px).

### 2.2 Responsive Preview (No Horizontal Scroll)
* Sheet preview scales smoothly to mobile screen widths (360 px, 412 px, 768 px) using CSS transforms calculated via `ResizeObserver` and window resize listeners (`scale = Math.min(1, availableWidth / 794)`).
* Export automatically clears scaling temporarily to generate crisp, unscaled 794 px A4 standard output regardless of phone screen dimension.

### 2.3 Synchronized Gap-Day Calculation (`computeGap`)
* Standardized gap-day terminology across both `ScheduleList.tsx` and `SchedulePreviewModal.tsx`:
  * Marathi: `गॅप दिवस {from} ते {to} ({count} दिवस गॅप)` and `गॅप दिवस {from} (1 दिवस गॅप)`.
  * English: `Gap days {from} to {to} ({count}-day gap)` and `Gap day {from} (1-day gap)`.
* Fully tested via pure unit tests covering positive, zero, negative, and duplicate day inputs.

### 2.4 Dealer Owner & Contact Chips
* When a farmer is linked to a dealer, both the farmer card and the schedule sheet header display the dealer's shop name along with `PROP. <owner>` and a direct phone chip `📞 <mobile>` resolved from memory.

### 2.5 Empty Schedule Protection
* If a farmer has zero schedules, the Camera preview button is disabled with muted styling, and attempting to share triggers a friendly bilingual notice: *"शेड्यूल नाही / No schedule to share"*.

### 2.6 Product Details "N/A" Fallback
* Expanded product rows in `ProductList.tsx` display `"N/A"` for any missing dose (Spray, Drip, Drenching, Basal) or product metadata (Company, Category, Composition, Target Pest/Disease), maintaining clean visual alignment without blank rows.

### 2.7 Standardized Plantation Date Display
* Plantation and sowing dates on the schedule preview sheet are parsed in local time and formatted as `DD/MM/YYYY` (e.g., `15/06/2026`).

---

## 3. What Is Unchanged
* **No Database Schema or Firestore Changes**: Strictly reads existing in-memory state; zero Firestore schema modifications or database writes.
* **Date Calculation Rules**: Day 1 remains planting day; `calculateDateForDay()` and reverse offset formulas remain 100% intact.
* **Security & Auth Rules**: `firestore.rules`, Firebase authentication methods, and security tokens are untouched.
* **Existing Navigation & Workflows**: All existing farmer, dealer, master template, and product workflows operate without modification.

---

## 4. Known Limits & Disclaimers
* **Historical Schedule Records**: Stored schedules created under pre-v1.2.5 date rules retain their recorded dates unless edited by staff.
* **Image-Based PDF**: PDF generation captures high-resolution rendered DOM canvases; text within the resulting PDF is non-selectable rasterized graphics.
* **Device Testing Environment**: Verified through automated headless Puppeteer testing and Android static analysis; physical touch and Android system share sheet require on-device user verification.

---

## 5. Package Verification & Technical Metrics

| Metric | Details |
| :--- | :--- |
| **Package Name** | `com.vionex.smartfarming` |
| **Version Code** | `7` |
| **Version Name** | `1.2.6` |
| **Signing Certificate SHA-256** | `16a9201aa57a75b597583adddfb69ef73dea7e09a464be847d39ae21d277bd93` |
| **Certificate SHA-1** | `24750fac6a211a9658da564cecdbe9dfd37239d4` |
| **Certificate Issuer** | `CN=Shrenika Patil, OU=Unknown, O=VIONEX, L=SANGLI, ST=Maharashtra, C=IN` |
| **Cert Match vs v1.2.5** | **100% Identical** (Seamless update over v1.2.5 / v1.2.4 without uninstall) |
| **App Permissions** | `INTERNET`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `CAMERA`, `POST_NOTIFICATIONS` (Unchanged) |
| **APK File Size** | 9,159,618 bytes (~8.73 MB; +243 KB from lazy-loaded export libraries) |
| **Rollback APKs** | `releases/VIONEX-v1.2.5.apk` (8,916,350 bytes), `releases/VIONEX-v1.2.4.apk` (53,187,860 bytes) |

---

## 6. Rollback Instructions
If any regression is observed during field operation:
1. Reinstall `releases/VIONEX-v1.2.5.apk` directly over the installed application using ADB or Android Package Installer:
   ```bash
   adb install -r releases/VIONEX-v1.2.5.apk
   ```
2. Or rollback to `releases/VIONEX-v1.2.4.apk`:
   ```bash
   adb install -r releases/VIONEX-v1.2.4.apk
   ```
Because the signing certificate SHA-256 (`16a9201aa...`) is identical across all versions, rolling back does not require uninstalling or clearing local user cache.

