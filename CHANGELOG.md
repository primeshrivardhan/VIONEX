# Changelog

All notable changes to the VIONEX platform are documented here.

## [1.2.4] - 2026-10-12

### Defensive Hardening & Crash Fix
- **Add Schedule Form Runtime Crash Fix**: Fixed a fatal error (`Cannot read properties of undefined (reading 'includes')`) when launching "+ पुढील शेड्युल जोडा" triggered by farmer records with undefined `mobile` numbers. Added defensive string coercion and fallback across farmer filtering and prefilled data.
- **Product Search Defense**: Hardened product catalog lookup within the schedule editor, replacing unshielded chained calls with safe string normalization across brand names, company names, formulations, and active ingredients.
- **Preemptive Farmer & Location Search Guards**: Protected `FarmerList.tsx` against missing or undefined `village`, `taluka`, and `district` properties, and guarded `LocationMapping.tsx` taluka comparison against undefined values and empty-string false-positives.

### Versioning & Deployment
- **Version Bump**: Incremented app version to `1.2.4` (`versionCode: 5`, `versionName: "1.2.4"` in `android/app/build.gradle`, `"version": "1.2.4"` in `package.json`).
- **Service Worker Cache-Busting**: Bumped cache name to `vionex-v13` in `public/sw.js` for instant web client cache invalidation.
- **Production APK**: Rebuilt and signed release APK with the production release keystore, updating `public/vionex.apk`.

## [1.2.3] - 2026-10-12

### Master Schedule Redesign & Apply-to-Plot Parity
- **Web & Mobile Feature Parity**: Upgraded web Master Schedule Management to match mobile app capabilities with responsive collapsible cards, day badges, stage indicators, product doses, and notes.
- **Apply-to-Plot Workflow**: Integrated the one-click "Apply to Plot" (शेड्युल प्लॉटवर लागू करा) modal with farmer, crop, and schedule date selection, copying standard crop schedule templates as independent plot records.

### Systemic Reliability & Fire-and-Forget Elimination
- **Strict Awaited Writes & Deletes**: Replaced fire-and-forget patterns across all 14 audited locations in the application (Product add/edit/delete/overwrite, Farmer add/edit/delete/overwrite/soft-delete, Schedule add/edit/delete, and Schedule done toggle & inline edit).
- **Comprehensive Error Handling & UI Preservation**: Every database transaction is now wrapped in `try/catch`. On permission denial or network rejection, forms and modals remain open with clear bilingual error banners for retry instead of prematurely closing or claiming false success.
- **Optimistic State Rollback**: Added error rollback to schedule completion toggles and inline product edits on write failures.

### Versioning & Deployment
- **Version Bump**: Incremented app version to `1.2.3` (`versionCode: 4`, `versionName: "1.2.3"` in `android/app/build.gradle`, `"version": "1.2.3"` in `package.json`).
- **Service Worker Cache-Busting**: Bumped cache name to `vionex-v12` in `public/sw.js` for instant PWA eviction of outdated assets.
- **Production APK**: Built and signed `app-release.apk` with the production release keystore, updating `public/vionex.apk`.

## [1.2.2] - 2026-10-12

### UI Redesign & Access Control
- **Collapsible Product List**: Redesigned Product Catalog from a heavy card grid into a compact, collapsible single-column list with inline chevron toggle, showing bilingual brand name by default and expanding full product details on demand.
- **Live Smart Search**: Added real-time search filtering across brand name, company, composition/molecule, target pests, diseases, and crops with instant clear button.
- **Strict Role-Based Access Control**: Guarded edit (pencil) and delete (trash) icons, as well as "Delete All" (सर्व हटवा) and "Find Duplicates" (डुप्लिकेट शोधा) actions, exclusively to administrators via `isAdminOrAdminRole`; view-only users see zero edit/delete affordances.
- **Service Worker & Build Tracking**: Bumped Service Worker cache to `vionex-v10` for PWA cache-busting, updated native Android build to `versionCode 3` / `versionName 1.2.2`, and refreshed build timestamp tracking.

## [1.2.1] - 2026-10-10

### Security & Data Protection
- **Safety Confirmation on Product Deletion**: Added a confirmation dialog (`window.confirm`) to the individual product delete action on product cards, preventing accidental deletions.
- **Duplicate Overwrite Safeguard**: Added an explicit confirmation prompt when adding a product that matches an existing brand and company/ingredient. Canceling aborts the save entirely without modifying or overwriting existing Firestore data.
- **Workflow Integrity**: Existing "Delete All" and "Find Duplicates" flows remain fully intact with their confirmation and activity logging.

### Versioning & Native Build
- **Version Bump**: Incremented app version to `1.2.1` (`versionCode`: `2` in `android/app/build.gradle`, `version`: `1.2.1` in `package.json`).
- **Dynamic Build Tracking**: Configured automated build timestamp and commit hash injection for the Settings footer.
- **Cache-Busting**: Verified Service Worker unregistration and cache clearance on native APK updates, and bumped PWA cache name to `vionex-v9`.
- **Production APK**: Built and signed `app-release.apk` with the production release keystore.
