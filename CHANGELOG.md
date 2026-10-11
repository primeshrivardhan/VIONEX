# Changelog

All notable changes to the VIONEX platform are documented here.

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
