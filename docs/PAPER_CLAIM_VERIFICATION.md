# VIONEX Research Paper Claim Verification Report

**Date of Verification:** October 23, 2026  
**Repository Path:** `d:/VIONEX/vionex`  
**Target Codebase Status:** Read-Only Audit (zero modifications to source code, configs, or Firestore data)  

---

## Executive Summary

This report performs a strict, code-verified fact-check of the claims presented in the VIONEX research paper (`VIONEX_RESEARCH_PAPER.md` / `vionex_research_paper.tex`) against the actual implementation in the repository. Every claim is categorized as **VERIFIED**, **PARTIAL**, or **NOT FOUND** with precise file and line citations.

---

## Part 1: Detailed Verification of 18 Specific Claims

### 1. Frontend Framework & Tooling
* **Status:** **VERIFIED**
* **Evidence:**
  * `package.json` (lines 48–49, 52, 68–69):
    * `"react": "^19.0.1"`
    * `"react-dom": "^19.0.1"`
    * `"vite": "^6.2.3"`
    * `"typescript": "~5.8.2"`
    * `"@vitejs/plugin-react": "^5.0.4"`
    * `"@tailwindcss/vite": "^4.1.14"`
* **Correct Wording for Paper:**  
  "The web application is built on React 19.0.1, bundled with Vite 6.2.3, and typed using TypeScript 5.8.2."

---

### 2. Capacitor Android App & Plugins
* **Status:** **PARTIAL**
* **Evidence:**
  * **Capacitor Version:** `package.json` (lines 16–25, 56) and `node_modules/@capacitor/core/package.json` specify `@capacitor/core: ^8.4.2`, `@capacitor/android: ^8.4.2`, `@capacitor/cli: ^8.4.2`. The project runs on **Capacitor 8**, not Capacitor 7.
  * **`@capacitor/camera`:** **NOT USED in application code.** Listed in `package.json` (line 18) and generated `android/capacitor.settings.gradle` (line 9), but has zero imports or invocations in `src/`.
  * **`@capacitor/network`:** **NOT USED in application code.** Listed in `package.json` (line 22) and `android/capacitor.settings.gradle` (line 18), but has zero imports or invocations in `src/`. Offline detection in application code relies on standard browser APIs (`navigator.onLine`) and custom Firestore circuit breaker timeouts (`src/lib/firebase.ts`, lines 182–184).
  * **Capacitor Plugins Actually Used in `src/`:**
    * `@capacitor/core` (`src/main.tsx:49`, `src/App.tsx:29`, `src/lib/fileDownload.ts:1`)
    * `@capacitor/app` (`src/App.tsx:28`, hardware back button navigation listener)
    * `@capacitor/toast` (`src/App.tsx:30`, `src/lib/fileDownload.ts:4`)
    * `@capacitor/geolocation` (`src/lib/geo-helper.ts:22, 35`)
    * `@capacitor/filesystem` (`src/lib/fileDownload.ts:2`)
    * `@capacitor/share` (`src/lib/fileDownload.ts:3`)
    * `@capacitor/push-notifications` (`src/main.tsx:51`, `src/components/SettingsView.tsx:205`)
* **Correct Wording for Paper:**  
  "The mobile application is packaged using Capacitor 8.4 for Android. Native integration utilizes `@capacitor/app` for hardware back-button intercept handling, `@capacitor/geolocation` for farm coordinates, `@capacitor/filesystem` and `@capacitor/share` for schedule exports, and `@capacitor/push-notifications` for device alerts. Network and Camera plugins are not utilized in application logic."

---

### 3. Offline Persistence, `idb-keyval`, & Sync Queue
* **Status:** **PARTIAL**
* **Evidence:**
  * **`idb-keyval` Usage:** **VERIFIED.** Used in `src/hooks/useMasterLocations.ts` (lines 7, 55, 60, 114, 137) to cache official revenue village queries (`master_locations_v3_*`) in IndexedDB for 0-second dropdown populating.
  * **Firestore Offline Persistence:** **VERIFIED.** Enabled in `src/lib/firebase.ts` (line 32) via `enableMultiTabIndexedDbPersistence(dbInstance)`. The codebase uses modular multi-tab persistence, not single-tab `enableIndexedDbPersistence` or the newer `persistentLocalCache` configuration object.
  * **Custom Sync Queue ($\mathcal{Q}_{\text{sync}}$):** **NOT FOUND.** There is no custom synchronization queue data structure, mutation backlog array, or background sync worker in the code. All offline write queueing, retry logic, and reconciliation are handled natively by Cloud Firestore SDK's built-in IndexedDB persistence layer.
* **Correct Wording for Paper:**  
  "Dual-tier persistence pairs an L1 client-side cache using `idb-keyval` (storing official revenue village mapping data) with Firestore's native multi-tab IndexedDB cache (`enableMultiTabIndexedDbPersistence`). Offline mutation queueing and reconnection draining rely entirely on Firestore SDK's built-in offline persistence layer rather than a proprietary sync queue."

---

### 4. Gemini / LLM Integration
* **Status:** **VERIFIED**
* **Evidence:**
  * **SDK:** `@google/genai` `^2.4.0` in `package.json` (line 26) and `server.ts` (line 11: `import { GoogleGenAI, Type } from "@google/genai"`).
  * **Model Names:**
    * Primary targets: `"gemini-1.5-flash"` and `"gemini-3.5-flash"` (`server.ts`, lines 202, 389, 432, 471, 625, 682, 754).
    * Fallback models: `"gemini-flash-latest"` and `"gemini-3.1-flash-lite"` (`server.ts`, lines 209–210).
  * **Fallback Cascade:** Implemented in `generateWithFallback` (`server.ts`, lines 201–263). Iterates over `modelsToTry`, catching HTTP 429, `"quota"`, `"resource_exhausted"`, HTTP 503, and `"unavailable"`, advancing to the next model in sequence.
  * **Cooldown / Backoff:** When a 429 / quota error occurs on `gemini-3.5-flash` or `gemini-flash-latest`, `lastGemini35ErrorTime` is recorded (`server.ts`, line 246). For the next 15 minutes (`15 * 60 * 1000` ms), the model sequence shifts to prioritize `gemini-3.1-flash-lite` first (`server.ts`, lines 206–210) to prevent request blocking.
  * **JSON Schema Enforcement:** Implemented via Google GenAI structured outputs using the `Type` enum from `@google/genai`:
    * `/api/villages` & `/api/taluka-villages`: Enforces `Type.ARRAY` of `Type.STRING` (`server.ts`, lines 392–397).
    * `/api/generate-crop-alerts`: Enforces `Type.ARRAY` of `Type.OBJECT` with 17 typed properties (`server.ts`, lines 474–500).
    * `/api/generate-product-info`: Enforces `Type.OBJECT` with 13 typed properties (`server.ts`, lines 627–644).
    * `/api/search-products`: Enforces `Type.ARRAY` of `Type.OBJECT` with 16 typed properties (`server.ts`, lines 685–709).
    * `/api/admin/auto-import`: Enforces `Type.ARRAY` of `Type.OBJECT` (`server.ts`, lines 757–780).
    * `/api/advice`: Returns free-form localized agronomic advice in Marathi (`server.ts`, lines 417–442).
* **Correct Wording for Paper:**  
  "The backend leverages the `@google/genai` SDK with an adaptive fallback cascade across `gemini-1.5-flash`, `gemini-3.5-flash`, `gemini-flash-latest`, and `gemini-3.1-flash-lite`. Quota exhaustion triggers a 15-minute backoff prioritizing lite models. Structured outputs are strictly enforced via the GenAI `Type` schema for crop alerts, product specifications, and revenue village indexing."

---

### 5. Express Backend & Node Version
* **Status:** **VERIFIED**
* **Evidence:**
  * **Express:** `express` `^4.22.2` (`package.json:32`, `server.ts:2, 148`).
  * **Helmet:** `helmet` `^8.3.0` (`package.json:36`, `server.ts:5, 152–155`), configured with `contentSecurityPolicy: false` and `crossOriginEmbedderPolicy: false`.
  * **CORS:** `cors` `^2.8.6` (`package.json:29`, `server.ts:6, 156`), configured with `{ origin: true, credentials: true }`.
  * **Rate Limiters:** `express-rate-limit` `^8.6.1` (`package.json:33`, `server.ts:7, 160–167`), configured for 200 requests per 15-minute window per IP on `/api/`.
  * **Parameter Pollution Protection:** `hpp` `^0.2.3` (`package.json:37`, `server.ts:8, 157`).
  * **Node Version:** Host system executes Node `v24.12.0`. TypeScript types target `@types/node: ^22.14.0` (`package.json:61`). There is no explicit `engines` block in `package.json`.
* **Correct Wording for Paper:**  
  "The application server is built on Express 4.22 on Node.js (tested on Node 22/24), secured with Helmet 8.3, CORS 2.8, HPP 0.2 for parameter pollution defense, and Express-Rate-Limit 8.6 restricting traffic to 200 requests per 15 minutes per IP."

---

### 6. Firebase Cloud Messaging / Push Notifications
* **Status:** **PARTIAL**
* **Evidence:**
  * **Web Client Implementation:** Handled in `src/App.tsx` (lines 415–453) via `firebase/messaging` (`Notification.requestPermission()`, `getToken`, `onMessage`) and background service worker `public/firebase-messaging-sw.js` (lines 1–32).
  * **Android Native Implementation:** Registered dynamically in `src/main.tsx` (lines 45–73) and `src/components/SettingsView.tsx` (lines 205–225) using `@capacitor/push-notifications`.
  * **Server-side Dispatch:** Implemented in `server.ts` (lines 584–603) via `POST /api/send-notification` calling `firebase-admin/messaging` (`getMessagingSafe().send(message)`).
  * **Automated Spatial Radius Queries:** **NOT FOUND.** The automated spatial geofence radius queries described in the paper (e.g. querying farmers within 50 km and blasting alerts) do not exist in the backend code; alerts are queried client-side by state/district/taluka strings in `AlertsView.tsx` and `App.tsx:927-944`.
* **Correct Wording for Paper:**  
  "Push notification infrastructure is implemented using Firebase Cloud Messaging across web (`firebase/messaging` service worker) and Android (`@capacitor/push-notifications`), with an admin dispatch endpoint on the Express server (`/api/send-notification`). Alert targeting is filtered client-side based on administrative district/taluka attributes."

---

### 7. Open-Meteo Weather API & Spray Suppression Rules
* **Status:** **NOT FOUND**
* **Evidence:**
  * **Open-Meteo API:** Zero network requests, API URLs (`open-meteo.com`), or references exist in any code file. It appears only in documentation (`README.md`, `VIONEX_RESEARCH_PAPER.md`, `vionex_research_paper.tex`).
  * **Weather Alerts in Repo:** Sourced either dynamically from Gemini LLM category 1 prompts (`server.ts`, lines 457, 520) or statically hardcoded in `src/components/ScheduleList.tsx` (lines 625–649) and `src/components/AdvisoryView.tsx` (lines 35–43).
  * **Weather-based Spray Suppression Rules:** No algorithm exists in code to intercept or cancel a spray based on live weather data.
* **Correct Wording for Paper:**  
  "Live weather API integration (Open-Meteo) and automatic algorithmic spray suppression represent planned architecture not currently present in the production codebase. Weather alerts are currently generated via Gemini LLM prompts or static regional advisory bulletins."

---

### 8. Maharashtra LGD Taluka and Village Data
* **Status:** **PARTIAL**
* **Evidence:**
  * **Locations in Code:** `src/lib/maharashtra-locations.ts` (`VILLAGES_BY_TALUKA`), `server.ts` (`STATIC_VILLAGES`), and root seed files (`seed_*.js`).
  * **Count in `src/lib/maharashtra-locations.ts`:**
    * Defined across 9 talukas (all within **Sangli** district): Palus (35), Tasgaon (69), Miraj (68), Walwa (98), Kavathe Mahankal (59), Khanapur (Vita) (67), Atpadi (59), Kadegaon (56), Jath (0).
    * **Total static villages in `maharashtra-locations.ts`:** **511 villages** across 8 non-empty talukas.
  * **Count in `server.ts` (`STATIC_VILLAGES`):** 18 talukas across Sangli, Satara, Yavatmal, and Amravati totaling 186 static entries.
  * **LGD Codes:** **NOT FOUND.** Actual numerical Local Government Directory (LGD) codes do not exist in the datasets. The system synthesizes custom alphanumeric village identifiers via `generateVillageCode()` in `src/hooks/useMasterLocations.ts` (lines 19–33) in the format `${stateCode}_${distCode}_${talCode}_${vilCode}` (e.g. `MA_SAN_TAS_SAVALAJ`).
* **Correct Wording for Paper:**  
  "The static revenue directory pre-indexes 511 official revenue villages across 8 talukas in Sangli district within `src/lib/maharashtra-locations.ts`. For unseeded administrative talukas, the system triggers on-demand Gemini structured generation. Village records utilize synthetic administrative keys rather than official LGD numeric codes."

---

### 9. CIBRC / WHO Guardrails, Dosage Clamp, & Pre-Harvest Interval (PHI)
* **Status:** **NOT FOUND**
* **Evidence:**
  * **CIBRC Database & Banned Substances:** Zero references in application or server code.
  * **WHO Toxicity Classes (Class Ia/Ib):** Zero references in code.
  * **Dosage Clamping (>150% rec.):** Product dosages are stored and displayed as arbitrary strings (e.g. `"0.4 ml/Litre"`, `"2 - 2.5 gm/Litre"`). No numeric parser, mathematical comparator, or hard clamping logic exists.
  * **Pre-Harvest Interval (PHI / DTH):** No `PHI` or `daysToHarvest` fields exist in product models or schedule validation schemas (`src/types.ts`).
* **Correct Wording for Paper:**  
  "CIBRC validation, WHO toxicity class classification, numeric dosage clamp limits, and algorithmic pre-harvest interval (PHI) enforcement are conceptual proposals described in the research paper but are NOT FOUND in the codebase."

---

### 10. Role-Based Access Control (RBAC)
* **Status:** **VERIFIED**
* **Evidence:**
  * **Staff Roles in Code:** Defined in `AppUser['role']` (`src/types.ts`, line 100):
    1. `admin`
    2. `manager`
    3. `sales`
    4. `viewer`
    5. `user`
    6. `consultant`
  * **Farmer User Type:** Distinct user session type `type: 'farmer'` (`src/types.ts:64`, `src/App.tsx:1865-1977`).
  * **Permissions Matrix:** Controlled by `UserPermissions` interface (`src/types.ts`, lines 12–52) with 33 discrete boolean flags mapped in `ROLE_PERMISSIONS` (`src/types.ts`, lines 145–194):
    * `admin`: Complete authorization across all 33 flags (full CRUD, user management, approval bypass).
    * `manager`: Operational manager; can add/edit farmers, dealers, products, but cannot delete records (`farmerDelete: false`, `dealerDelete: false`, `productDelete: false`), and cannot auto-approve schedules.
    * `sales`: Field representative; can add/edit farmers and dealers, create orders, and log collections, but cannot edit orders, delete entities, view reports, or export Excel/PDF.
    * `viewer`: Read-only access; can view products, reports, and dashboard, but has zero add/edit/delete/transaction permissions.
    * `user`: Standard internal staff member; has basic farmer/dealer/product management, but no access to consultants, master schedules, or user administration.
    * `consultant`: Agronomist role; can add/edit/delete assigned farmers, add products, mark schedules done, but has no dealer, order, or master schedule access.
    * `farmer`: Accesses the dedicated Farmer Portal displaying crop plots, schedule timelines, and regional alert tickers.
* **Correct Wording for Paper:**  
  "RBAC defines 6 staff roles (`admin`, `manager`, `sales`, `viewer`, `user`, `consultant`) governed by a 33-permission matrix in `src/types.ts`, in addition to an isolated `farmer` portal role."

---

### 11. Firestore Security Rules & Ownership Checks
* **Status:** **VERIFIED**
* **Evidence:**
  * File: `firestore.rules` (214 lines total).
  * **`createdBy` & Document Ownership Checks:** Explicitly implemented in rules:
    * **Farmers Collection (`match /farmers/{farmerId}`):**
      ```javascript
      allow create: if isSignedIn() && !isRestrictedDemoUser() && (
        isAdmin() || 
        (isConsultant() && request.resource.data.createdBy == request.auth.uid) ||
        (!isConsultant() && !isAdmin())
      );
      allow update: if isAdmin() || (
        isConsultant() && 
        resource.data.createdBy == request.auth.uid && 
        request.resource.data.createdBy == resource.data.createdBy
      ) || request.auth.uid == resource.data.id || request.auth.uid == resource.data.createdBy;
      allow delete: if isAdmin() || (
        isConsultant() && 
        'createdBy' in resource.data && 
        resource.data.createdBy != null && 
        resource.data.createdBy == request.auth.uid
      );
      ```
    * **Schedules Collection (`match /schedules/{scheduleId}`):**
      Farmer ownership is verified via `isFarmerScheduleOwner()` (`firestore.rules`, lines 106–123) cross-referencing `farmerId`, `mobile`, and `possibleIds` against `user_mappings`.
      Farmers are strictly restricted to updating completion status via `isOnlyMarkingScheduleDone()`:
      ```javascript
      function isOnlyMarkingScheduleDone() {
        return request.resource.data.diff(resource.data).affectedKeys().hasOnly(['done', 'doneAt', 'status', 'updatedAt']);
      }
      ```
      Consultants can only update schedules they created:
      ```javascript
      (isConsultant() && (
        resource.data.createdBy == request.auth.uid ||
        ('createdByUserId' in resource.data && resource.data.createdByUserId == request.auth.uid)
      ))
      ```
    * **Master Schedules Collection (`match /master-schedules/{scheduleId}`):**
      Consultants can only update their own blueprints (`resource.data.createdBy == request.auth.uid || resource.data.createdByUserId == request.auth.uid`, lines 150–153).
    * **Users & User Mappings (`match /users/{userId}`, `match /user_mappings/{uid}`):**
      Read/write is restricted to document owner (`request.auth.uid == userId`) or admin; clients are forbidden from self-assigning or escalating the `admin` role (`firestore.rules`, line 52).
* **Correct Wording for Paper:**  
  "Cloud Firestore security rules strictly enforce document ownership and `createdBy` checks: consultants can only update and delete farmers and schedules matching their authenticated UID, farmers are constrained to updating only execution completion fields (`done`, `doneAt`, `status`), and role self-escalation is blocked at the database engine level."

---

### 12. Product Catalog in Code and Seed Data
* **Status:** **VERIFIED**
* **Evidence:**
  * `src/lib/preseeded-products.ts` (`PRESEEDED_PRODUCTS`): **20** curated products with verified brand names, Marathi transliterations, compositions, and dosages.
  * `src/lib/catalog-generator.ts` (`generate2500Catalog()`): **3,520** algorithmically generated products spanning insecticides, fungicides, herbicides, fertilizers, and bio-stimulants.
  * `server-products.ts` (`BACKUP_PRODUCTS`): **0** products (empty array).
  * `seedMissingProducts()` (`src/lib/data-sync.ts`, lines 198–200) seeds both: `[...requiredProducts, ...generatedCatalog]`, providing **3,540 total pre-seeded products** in application code.
* **Correct Wording for Paper:**  
  "The product catalog in repository code contains 20 curated baseline agrochemical products in `src/lib/preseeded-products.ts` and 3,520 algorithmically synthesized product combinations in `src/lib/catalog-generator.ts`, totaling 3,540 local seed definitions."

---

### 13. Bilingual English / Marathi Implementation
* **Status:** **VERIFIED**
* **Evidence:**
  * **State & Persistence:** Stored in `localStorage.getItem("app_lang") || "mr"` (`src/App.tsx:1574`). Default language is Marathi (`"mr"`).
  * **Settings Toggle:** Implemented in `src/components/SettingsView.tsx` (lines 80–110).
  * **Interface Localization:** Nav items, banners, status badges, headers, and buttons are localized throughout `src/App.tsx` (e.g. lines 1578–1588, 2445, 2493, 3433–3530).
  * **Translation Dictionaries:** `src/lib/utils.ts` (lines 1–928) contains exhaustive dictionary mappings:
    * `translateCompositionToMarathi(text)`: Chemical active ingredients (lines 5–60).
    * `translatePestToMarathi(text)`: Pests and diseases (lines 200–350).
    * Application methods, crop growth stages, and fertilizer terms.
  * **Product Catalog:** Bilingual fields in `PreseededProduct` (`brandName`, `marathiName`, `composition`, `compositionEnglish`, `targetCrops`, `targetPests`).
  * **LLM Output:** System prompts in `server.ts` (lines 385, 429, 468) mandate output in Marathi and dual `"English (मराठी)"` village nomenclature.
* **Correct Wording for Paper:**  
  "Bilingual localization (English and Marathi) is implemented natively across UI components via state toggles, extensive agronomic terminology translation dictionaries in `src/lib/utils.ts`, and bilingual data structures across product and location catalogs."

---

### 14. Authentication Mechanisms & Credential Security
* **Status:** **VERIFIED**
* **Evidence:**
  * **Farmer Authentication:** Farmers log in with mobile number and password (`src/App.tsx`, lines 1865–1977). Matched by phone in Firestore, followed by **plaintext string comparison** (`src/App.tsx`, line 1943: `if (matchedFarmer.password && matchedFarmer.password !== cleanPass)`).
  * **Staff Authentication:**
    * Email login: Handled via Firebase Authentication (`signInWithEmailAndPassword(auth, cleanId, cleanPass)`, `src/App.tsx:1642`). Emits standard Firebase Auth ID tokens (JWTs).
    * Non-email / offline / local staff login: Queries Firestore `users` collection by `loginId`, followed by **plaintext string comparison** (`src/App.tsx`, line 1842: `if (matchedUser.password && matchedUser.password !== cleanPass)`).
  * **Bcrypt & Custom JWT:** Neither `bcrypt` nor custom JWT signing libraries exist in application code. They appear only in audit reports (`vionex_production_audit.md`) noting plaintext comparisons as critical vulnerabilities requiring migration.
  * **Hardcoded Credentials in App Code & Test Scripts (Redacted):**
    * `src/lib/config.ts`: Line 21 (`NEW_ADMIN_EMAIL: "[redacted]"`); Line 30 (`COMPANY_PHONE: "[redacted]"`).
    * `server.ts`: Line 129 (super-admin email fallback: `"[redacted]"`).
    * `firestore.rules`: Line 18 (super-admin email check: `"[redacted]"`).
    * `test-admin-create-user.ts`: Line 9 (`email: "[redacted]"`), Line 10 (`password: "[redacted]"`).
    * `test-farmer-login.cjs`: Line 24 (`mobile: "[redacted]"`), Line 25 (`password: "[redacted]"`).
    * `test-farmer-login-2.cjs`: Line 24 (`mobile: "[redacted]"`), Line 25 (`password: "[redacted]"`).
    * `test-user-login.cjs`: Line 24 (`loginId: "[redacted]"`), Line 25 (`password: "[redacted]"`).
    * `test-login.cjs`: Line 11 (`loginId: "[redacted]"`), Line 12 (`password: "[redacted]"`).
* **Correct Wording for Paper:**  
  "Farmer and non-email staff authentication currently evaluates direct password equality against Firestore documents, while administrative accounts utilize Firebase Authentication. Server-side bcrypt hashing and custom stateless JWT cookies are documented recommendations from a security audit, not active production code."

---

### 15. Total Lines of Code (LOC)
* **Status:** **VERIFIED (MEASURED)**
* **Measurement Command:** Node.js recursive filesystem analyzer (`fs.readdirSync`, `fs.readFileSync`), excluding `node_modules`, `dist`, `dist-server`, `android`, `.git`, `.gradle`, `build`, `package-lock.json`, `bun.lock`, and binary files (`.apk`, `.png`, `.jpg`, `.pdf`, `.jks`).
* **Results:**
  * **Application Source (`src/`):** **48 files, 26,134 lines**
    * `.tsx`: 21,114 lines (29 components & views)
    * `.ts`: 4,948 lines (18 helper, hook, service, and data files)
    * `.css`: 72 lines (`index.css`)
  * **Key Server & Configuration Files:**
    * `server.ts`: 841 lines
    * `server-products.ts`: 32 lines
    * `firestore.rules`: 214 lines
    * `vite.config.ts`: 37 lines
    * `capacitor.config.ts`: 10 lines
    * `index.html`: 33 lines
  * **Entire Repository (Including all root scripts, tests, and documentation):** **231 files, 37,164 lines**
    * By Extension: `.tsx` (21,114), `.ts` (5,929), `.md` (2,546), `.cjs` (2,370), `.py` (2,065), `.js` (1,626), `.tex` (464), `.json` (392), `.rules` (214), `.mjs` (199), other configs/patches (245).
* **Correct Wording for Paper:**  
  "The core application codebase encompasses 26,134 lines across 48 TypeScript and TSX files in `src/`, with an Express server and security rules comprising an additional 1,134 lines."

---

### 16. Production Bundle Size & APK Size
* **Status:** **VERIFIED (MEASURED)**
* **Measurement Method:** Direct filesystem stat and `zlib.gzipSync` execution on production build outputs.
* **Results:**
  * **Production Client Bundle (`dist/assets/`):**
    * Main JS bundle (`index-o4Rhi20q.js`): **2,078,211 bytes raw** (2,029.50 KB / 1.98 MB), **542,670 bytes gzipped** (529.95 KB / ~530 KB).
    * Main CSS bundle (`index-DV-cKaRy.css`): **92,975 bytes raw** (90.80 KB), **14,934 bytes gzipped** (14.58 KB).
    * Total JS Assets: **2,097,703 bytes raw** (2,048.54 KB), **549,950 bytes gzipped** (537.06 KB).
    * Total Web Production Bundle (excluding APK): **2,213,567 bytes raw** (2,161.69 KB / 2.11 MB), **585,943 bytes gzipped** (572.21 KB / ~572 KB).
  * **Android APK File Size:**
    * Located at `public/vionex.apk` and `android/app/build/outputs/apk/release/app-release.apk`.
    * Exact size: **53,187,860 bytes** (**50.72 MB**).
  * **Latency / Throughput Figures:**
    * 0 ms optimistic UI latency and 45 trans/s sync throughput: **NOT MEASURED** (no performance benchmarking or telemetry script exists in the repository).
* **Correct Wording for Paper:**  
  "The production client bundle compiles to 2.08 MB raw (530 KB gzipped) for JavaScript and 91 KB raw (14.6 KB gzipped) for CSS. The signed Android release APK packages all static assets at 50.72 MB."

---

### 17. Automated & Ad-Hoc Test Scripts
* **Status:** **VERIFIED**
* **Evidence:**
  * There is no formal test runner (Jest, Vitest, Cypress, Mocha) configured in `package.json` (`"scripts"` contains only `dev`, `build`, `start`, `preview`, `clean`, `lint`).
  * Repository contains 13 ad-hoc test and validation scripts:
    1. `test-farmer-login.cjs` & `test-farmer-login-2.cjs`: Puppeteer browser end-to-end scripts verifying the farmer mobile/password login UI.
    2. `test-user-login.cjs` & `test-login.cjs`: Puppeteer scripts testing staff login flow and dashboard redirection.
    3. `test-puppeteer.cjs` & `test-puppeteer2.cjs`: Headless Chrome tests asserting that the `LocationMapping` view mounts without runtime exceptions (specifically checking for `Map is not a constructor`).
    4. `check-duplicates.cjs`, `run-check.js`, `run-check2.cjs`: Static analysis scripts that extract `VILLAGES_BY_TALUKA` from `src/lib/maharashtra-locations.ts` and verify zero duplicate village names across talukas.
    5. `test_match.js`: Unit assertion for `isNameMatch` string normalization and fuzzy substring matching.
    6. `test-admin-create-user.ts`: Script testing `firebase-admin/auth` user creation via service account.
    7. `test-admin.ts`: Tests `firebase-admin/auth` custom token generation and Firestore connectivity.
    8. `test-db.js`: Verifies client SDK read access against `master-locations`.
    9. `test-compile.cjs`: Tests esbuild bundle compilation of `LocationMapping.tsx`.
* **Correct Wording for Paper:**  
  "Automated testing consists of ad-hoc Puppeteer end-to-end browser flows verifying authentication and view stability, static AST duplicate detection scripts for geographical dictionaries, and isolated Node.js verification scripts for Firebase Admin authentication."

---

### 18. Table II Agronomic Constraints
* **Status:** **NOT FOUND**
* **Evidence:**
  * **Wind Speed > 20 km/h Spray Suppression:** NOT FOUND in code. (Appears only as a static informational text string in `ScheduleList.tsx:638`).
  * **Rain Probability > 60% in 6h Postponement:** NOT FOUND in code. (Appears only as a static informational text string in `ScheduleList.tsx:628`).
  * **Tank Mix > 3 Chemicals Alert:** NOT FOUND. No check or limit exists on the number of products added to a spray schedule.
  * **Sulfur + Oil 14-day Prohibition:** NOT FOUND. No phytotoxicity collision check exists between successive treatments.
  * **Max Dosage Clamp (>150% rec.):** NOT FOUND. Dosages are unstructured strings.
  * **Pre-Harvest Interval (PHI / DTH):** NOT FOUND.
* **Correct Wording for Paper:**  
  "Table II rules (wind suppression, rain postponement, tank-mix limits, sulfur-oil interval prohibitions, dosage clamping, and PHI enforcement) are theoretical agronomic specifications that are NOT FOUND in the current codebase."

---

## Part 2: Real Features in the Repo Not Mentioned in the Paper

The repository contains several sophisticated, production-grade features that the research paper completely overlooks:

### 1. Master Schedule Blueprints & "Apply to Plot" Engine
* **Location:** `src/components/MasterScheduleView.tsx`, `src/lib/masterScheduleService.ts`
* **Implementation:**
  * Defines master crop schedule blueprints organized by crop, variety, and growth stage.
  * **"Apply to Plot" Workflow:** Agronomists select a farmer and a specific crop plot (`getPlotsForFarmer`). The engine dynamically computes the schedule date via:
    $$\text{scheduleDate} = \text{plantationDate} + (\text{dayNo} \times 86{,}400{,}000\text{ ms})$$
  * **Deep Cloning:** `clonedProducts = (masterSchedule.selectedProducts || []).map(...)`. All product parameters are deep-cloned into an independent schedule document (`schedule-TIMESTAMP-RANDOM`). Future edits to the master schedule blueprint never retroactively corrupt existing farm plots.

### 2. Algorithmic Duplicate Product Detection Tool
* **Location:** `src/components/ProductList.tsx` (lines 152–285)
* **Implementation:**
  * Normalizes brand and company names into alphanumeric composite keys (`cleanBrand + "_" + cleanCompany`).
  * Evaluates multi-attribute heuristics to automatically determine which duplicate record to retain:
    1. Records with `approvalStatus === "approved"` override unapproved drafts.
    2. Real Firestore document IDs override temporary local IDs (`local_*`).
    3. Earlier creation timestamps override newer duplicate imports.
  * Provides an administrative modal with explicit checkbox selection and batch deletion.

### 3. Await / Try-Catch Confirmed-Write Pattern
* **Location:** `src/App.tsx` (lines 2900–2938), `src/lib/data-sync.ts` (lines 103–125)
* **Implementation:**
  * Write operations strictly `await` the Firestore network or cache commit inside `try / catch` blocks before triggering navigation (`handleBack()`).
  * If a write fails or is rejected by security rules, the modal remains open with all user input preserved, displaying a localized error message.

### 4. Native Service Worker Cache Invalidation
* **Location:** `src/main.tsx` (lines 10–28)
* **Implementation:**
  * Detects `Capacitor.isNativePlatform()`.
  * Because native Capacitor loads assets from local APK storage via `WebViewAssetLoader`, standard PWA service workers can trap and serve stale bundles across app updates.
  * The application explicitly calls `navigator.serviceWorker.getRegistrations()` to unregister all service workers and iterates `caches.delete(name)` to purge `CacheStorage` on native launch.

### 5. Defensive String & Type Coercion
* **Location:** `src/lib/safeJson.ts`, `src/lib/data-sync.ts` (lines 79–86), `src/components/ScheduleList.tsx` (lines 261, 441)
* **Implementation:**
  * `safeJsonParse()` safely handles string `"undefined"`, `"null"`, and malformed payloads without throwing runtime exceptions.
  * Firestore `Timestamp` objects are defensively normalized via `.toDate().toISOString()` to ensure date formatting never crashes on mixed types.
  * ID fields are strictly coerced with `String().trim()` to prevent type-mismatch bugs between numeric indices and Firestore auto-generated string IDs.

### 6. Immutable Activity Audit Logging
* **Location:** `src/App.tsx` (lines 2008–2070), `firestore.rules` (lines 196–200)
* **Implementation:**
  * All create, update, and delete actions across farmers, schedules, products, dealers, and alerts call `logUserActivity()`.
  * Writes to the `activity-logs` Firestore collection, capturing actor UID, display name, role, target entity, timestamp, and bilingual description.
  * Security rules enforce that activity logs are strictly append-only for authenticated users and readable only by admins.

### 7. Multi-Plot Farming Data Model
* **Location:** `src/types.ts` (`FarmerCropEntry`, lines 54–62), `src/components/FarmerList.tsx`
* **Implementation:**
  * Farmers are not limited to a single crop; they can maintain multiple distinct plots/plantings of the same or different crops (`FarmerCropEntry[]`), each tracking its own plot name, acreage, variety, season, and plantation date.

### 8. Public Intake Gateways
* **Location:** `src/components/PublicFormGateway.tsx`, `src/components/StandaloneDealerForm.tsx`, `src/components/NeutralPublicPortal.tsx`
* **Implementation:**
  * Standalone, unauthenticated web forms allowing prospective dealers, consultants, and farmers to submit registration data publicly without accessing private system portals.
  * Includes client-side phone number deduplication and automated toast confirmations.

### 9. Native Hardware Back Navigation Stack
* **Location:** `src/App.tsx` (lines 1260–1320)
* **Implementation:**
  * Leverages `@capacitor/app` (`CapApp.addListener('backButton', ...)`) to manage a multi-tiered navigation stack on Android, progressively closing modals, dismissible sheets, and active tabs before exiting.

---

## Part 3: Claims to Delete from the Paper

The following claims have no basis in the codebase and must be removed:
1. **Open-Meteo Weather API Integration & Automated Geofence Push Alerts:** No weather API or automated spatial radius dispatch logic exists.
2. **Table II (Agronomic Safety & Spray Scheduling Constraints):** Wind > 20 km/h suppression, rain > 60% postponement, tank-mix > 3 chemical warnings, sulfur+oil 14-day prohibition, dosage clamp limits (>150%), and pre-harvest interval (PHI) enforcement do not exist.
3. **CIBRC Compliance Verification & WHO Hazard Classes (Class Ia/Ib):** Zero regulatory databases, banned chemical lists, or toxicity tiering are present in the code.
4. **Proprietary Sync Queue ($\mathcal{Q}_{\text{sync}}$):** No custom mutation queue exists; queuing is handled entirely by Firestore's internal engine.
5. **Offline Sync Throughput (45 trans/s) and 0 ms Latency Benchmarks:** No performance measurement harness or benchmark data exists in the repo.
6. **Capacitor Camera and Network Plugins:** Declared in `package.json` but completely unused in application code.

---

## Part 4: Claims to Reword in the Paper

The following claims should be preserved but reworded to reflect reality:
1. **Capacitor Version:** Update "Capacitor 7" to **"Capacitor 8"** (`@capacitor/core: ^8.4.2`).
2. **Offline Architecture:** Specify that `idb-keyval` is used exclusively as an L1 cache for **revenue village mappings**, while general offline state uses Cloud Firestore's **multi-tab IndexedDB persistence** (`enableMultiTabIndexedDbPersistence`).
3. **Geographic Coverage:** Clarify that the static revenue directory covers **511 villages across 8 talukas in Sangli district**, with other talukas dynamically generated via authenticated **Gemini LLM structured outputs** (`Type.ARRAY`). Mention that village IDs are synthetic hashes, not numerical LGD codes.
4. **Authentication:** Clarify that password checking for farmers and staff uses **direct Firestore comparisons** (with Firebase Auth for email admins); note that server-side bcrypt hashing and JWT cookies are **planned recommendations from a security audit**, not existing features.
5. **Push Notifications:** Note that push notifications operate across web service workers and Capacitor native push, triggered via an administrative endpoint (`/api/send-notification`), with location filtering occurring client-side by district/taluka string rather than backend geospatial queries.
