# Vionex — Complete Production Readiness Audit
**Audit Date:** 30 September 2026  
**Codebase:** `d:\VIONEX\vionex`  
**Stack:** React 19 + Vite / Express + TypeScript / Firebase Firestore + Auth / Gemini AI / Capacitor Android PWA

---

> [!CAUTION]
> This audit is based on deep inspection of the actual source code. Several **Critical** issues exist that **must be fixed before real-world deployment**. Read sections 2, 3, and 4 first.

---

## 1. Architecture

### Current Architecture
```
Browser/Android Client (React + Capacitor)
        │
        ├── Firebase Auth SDK ────────────────► Firebase Auth
        ├── Firestore SDK (real-time sync) ───► Cloud Firestore
        └── apiFetch() ──────────────────────► Render.com (Express/server.ts)
                                                     │
                                                     ├── Gemini AI API
                                                     └── Firebase Admin SDK
```

### Findings

| Issue | Severity |
|---|---|
| `App.tsx` is **3,426 lines** — one monolithic file handles auth, routing, state, CRUD, sync, healing, and UI | 🔴 Critical |
| All business logic in the client — Firestore rules are the only security layer | 🔴 Critical |
| No API versioning (`/api/v1/...`) — breaking changes will hit all clients | 🟠 High |
| No staging environment | 🟠 High |
| 80+ temporary `fix*.py`, `fix*.cjs`, `patch_*.cjs` files in the root — dev debris | 🟡 Medium |
| `firebase-applet-config.json` is a committed file containing a live API key | 🔴 Critical |

### Single Points of Failure
- **Render.com server** — AI features, notifications, village lookup all die if Render is down
- **Gemini API** — no human-curated fallback beyond a single hardcoded cotton alert
- **Firestore** — no secondary read replica or export pipeline

---

## 2. Authentication & Authorization

### 2.1 Farmer Login — Plaintext Password Comparison
**File:** `src/App.tsx` line 1869, 1970  
**Current code:**
```ts
if (matchedFarmer.password && matchedFarmer.password !== cleanPass) {
  return "wrong_password";
}
```
**Risk:** 🔴 **CRITICAL** — Farmer passwords are stored **plaintext in Firestore** and compared **client-side in JavaScript**. Anyone who reads Firestore (any authenticated session) can see every farmer's password.  
**Fix Required:** Hash passwords server-side with `bcrypt`. Never store or compare plaintext passwords anywhere.

### 2.2 Staff/User Login — Plaintext Password in Firestore
**File:** `src/App.tsx` line 1869 (same pattern for `matchedUser.password`)  
**Risk:** 🔴 **CRITICAL** — Same problem. Staff passwords stored plaintext in `users` collection.  
**AdminView.tsx line 396 shows passwords to the admin UI:**
```tsx
{showPassword[u.loginId] ? (u.password || "•••••• (Auth)") : "Show Pass"}
```
This retrieves and displays the raw password from Firestore. Any XSS or MITM can expose all passwords.

### 2.3 Password Field in Admin Form is `type="text"` not `type="password"`
**File:** `src/components/AdminView.tsx` line 202  
```tsx
<input required name="password" type="text" ... />
```
Password is displayed in plain text while being typed. Visible on screen, in browser autocomplete history, and browser dev tools.

### 2.4 Firebase API Key Hardcoded in Committed JSON
**File:** `firebase-applet-config.json`  
```json
"apiKey": "AIzaSyB98XAJEhzScUJcry3HCoXLE5G0TzQJ_dU"
```
**Risk:** 🔴 **CRITICAL** — This key is committed to version control. Anyone with repo access can use this key to impersonate the app and query Firestore, even if Firestore rules are strict. Firebase Web API keys are semi-public by design, but combined with the hardcoded super-admin email below, this becomes dangerous.

### 2.5 Super-Admin Email Hardcoded in Multiple Places
**Files:** `src/lib/config.ts` line 21, `firestore.rules` line 18, `server.ts` line 129  
```ts
"Primeshrivardhan@gmail.com" // hardcoded in Firestore rules, config, and server
```
**Risk:** 🔴 **CRITICAL** — Rotating the super-admin requires a code change, a Firestore rules redeploy, and a server redeploy — a multi-step manual process. Leaking this email reveals which account to attack.

### 2.6 Authorization Is Entirely Client-Side for Non-Admin Operations
**Risk:** 🟠 High — The Express backend (`server.ts`) has `requireAuth` and `requireAdmin` middleware. However, all farmer CRUD, schedule CRUD, product management, and settings changes are done **directly via Firestore SDK from the browser** — the backend never sees these operations. The only enforcement is Firestore rules.  
Firestore rules are good (default-deny, role-checked), but if any rule has a hole, there is no server-side fallback.

### 2.7 FCM VAPID Key Hardcoded in App.tsx
**File:** `src/App.tsx` line 455  
```ts
const token = await getToken(messaging, { vapidKey: 'BM2d5wV121_S6T6gVlT2eO3nL1F2k8y3g5K1-5Fk4w7J2C7uS5r1K4T8Qk5I2q9y6G7H8d3n2C6F4w7J2Cw' })
```
VAPID keys should be in `.env` as `VITE_FCM_VAPID_KEY`, not hardcoded in source.

### 2.8 No Session Expiry / Logout on Inactivity
No idle-timeout mechanism exists. A farmer who leaves the app logged in on a shared device will remain authenticated indefinitely.

---

## 3. Database (Firestore)

### Schema Overview
| Collection | Purpose | Issues |
|---|---|---|
| `farmers` | Farmer profiles | Contains `password` field in plaintext |
| `users` | Staff accounts | Contains `password` field in plaintext |
| `schedules` | Spray/treatment schedules | No expiry, no archive |
| `products` | Agro product catalog | 2,500 seeded items, base64 images inline |
| `dealers` | Dealer directory | Public create with `|| true` |
| `consultants` | Consultant directory | Public create with `|| true` |
| `alerts` | Crop alerts | Anyone can read, no expiry enforcement |
| `activity-logs` | Audit trail | Good pattern — no issues |
| `user_mappings` | UID → role mapping | Self-writable within limits |
| `master-locations` | Villages/talukas | Admin only — correct |
| `admins` | Admin UID list | Admin only — correct |
| `settings` | App settings | Anyone can read — check if sensitive |

### 3.1 Password Fields Must Be Removed
Both `farmers.password` and `users.password` fields in Firestore are **plaintext**. This is a critical GDPR/privacy violation and security risk.

### 3.2 Public Create on Dealers and Consultants
**File:** `firestore.rules` lines 170, 176  
```
allow create: if isSignedIn() || true; // Public form
```
`|| true` makes this completely unauthenticated — **anyone on the internet can write to these collections** without logging in. This enables unlimited spam and data injection.

### 3.3 Inline Base64 Images
Products store images as base64 strings directly in Firestore documents. Firestore documents have a **1 MB limit**. A single product photo can be 100–300 KB, meaning 3–5 images can push a document over the limit. This will silently fail or cause `INVALID_ARGUMENT` errors.

### 3.4 No Pagination on Firestore Reads
`syncCollection` sets up real-time listeners that load **entire collections**. With 5,000 farmers or 10,000 schedules, this will cause client-side memory exhaustion and "Page Unresponsive" errors — the exact issue your AGENTS.md prohibits.

### 3.5 No Composite Indexes Defined
No `firestore.indexes.json` found. Queries like `where("loginId", "==", ...)` and `where("farmerId", "==", ...)` on large collections will be slow without indexes.

### 3.6 No Backup / Export Strategy
Firestore has no automatic backup configured. A single admin `deleteAllItems()` call would be unrecoverable.

### 3.7 `isDeleted` Soft-Delete Not Enforced in Firestore Rules
Soft-deleted documents (where `isDeleted: true`) are still returned in all queries. Client-side must filter these out, which can be unreliable.

---

## 4. Security

### 4.1 🔴 CRITICAL: Plaintext Passwords in Firestore
Already detailed in §2.1 and §2.2. Every farmer and staff password is readable by any authenticated app session.

### 4.2 🔴 CRITICAL: API Key Committed to Git History
`firebase-applet-config.json` with live API key is version-controlled. Even after removing from future commits, it exists in git history and must be rotated.

### 4.3 🔴 CRITICAL: Dealers/Consultants Collection Open to Unauthenticated Writes
`allow create: if isSignedIn() || true` — the `|| true` part means any HTTP request (no login needed) can insert documents into `dealers` and `consultants`.

### 4.4 🟠 HIGH: CORS Set to `origin: true` (Allow All Origins)
**File:** `server.ts` line 155  
```ts
app.use(cors({ origin: true, credentials: true }));
```
`origin: true` mirrors any origin. In production, this should be restricted to the actual domain (`vionex-4woy.onrender.com` or your custom domain).

### 4.5 🟠 HIGH: ContentSecurityPolicy Disabled
**File:** `server.ts` lines 152–153  
```ts
contentSecurityPolicy: false, // Disabled to prevent breaking Vite/React inline styles/scripts
```
CSP protects against XSS. Disabling it is a known risk. A proper CSP should be configured for production.

### 4.6 🟠 HIGH: Request Body Limit Set to 50MB
**File:** `server.ts` line 168  
```ts
app.use(express.json({ limit: '50mb' }));
```
50 MB JSON bodies can be used for denial-of-service attacks. Should be `1mb` unless there is a specific need.

### 4.7 🟠 HIGH: `/api/search-health` Exposes Internal Stats Without Auth
**File:** `server.ts` line 791  
```ts
app.get("/api/search-health", (req, res) => {
  res.json({ status: "healthy", stats: monitoringStats, ... });
```
No authentication. Anyone can see `totalRequests`, `quotaExceededErrors`, `lastError`, `lastErrorTimestamp`.

### 4.8 🟠 HIGH: User Email Logged to Console in Production
**File:** `src/App.tsx` line 487  
```ts
console.log("Firebase Auth State Connected:", user.isAnonymous ? "Anonymous" : user.email);
```
User email addresses are logged to browser console in production. Sensitive data must not appear in logs.

### 4.9 🟡 MEDIUM: Rate Limiter Set at 200 req/15min Per IP
For AI endpoints, this is potentially too high. A single attacker from one IP can make 200 Gemini API calls in 15 minutes, costing real money. AI endpoints need a tighter, separate rate limiter.

### 4.10 🟡 MEDIUM: No Input Validation on AI Prompts
**File:** `server.ts` lines 418–428  
User-controlled fields (`cropName`, `soilType`, `issue`) are inserted directly into prompts without sanitization. A user could inject instruction text to manipulate AI responses (prompt injection).

### 4.11 🟡 MEDIUM: FCM Token Logged to Console
**File:** `src/App.tsx` line 460  
```ts
console.log('FCM Token:', token);
```
FCM tokens allow anyone who sees the log to send push notifications to that specific device.

### 4.12 🟡 MEDIUM: `console.log("App component executing...")` in Production
Every React re-render logs this in production. Noisy and leaks app internals.

### 4.13 🟢 LOW: No CSRF Protection
The Express API uses Firebase ID tokens for authentication (stateless JWT), which inherently provides CSRF protection. Low risk but worth noting.

### 4.14 🟢 LOW: `rwanda-geo` Package in Dependencies
`package.json` includes `rwanda-geo` — a Rwanda geolocation package. This has no use in a Maharashtra agriculture app. Dead dependency.

---

## 5. API & Backend

### Endpoint Summary

| Endpoint | Auth | Admin | Issues |
|---|---|---|---|
| `POST /api/villages` | Optional | No | ✅ Auth required for AI path |
| `POST /api/advice` | Required | No | ✅ Good. Validate crop/issue fields |
| `POST /api/generate-crop-alerts` | Required | No | ✅ Good |
| `POST /api/send-notification` | Required + Admin | Yes | ✅ Good |
| `POST /api/generate-product-info` | Required | No | Any logged-in user can spam |
| `POST /api/search-products` | Required | No | Any logged-in user can spam |
| `POST /api/admin/auto-import` | Required + Admin | Yes | ✅ Good |
| `GET /api/search-health` | None | No | 🔴 No auth |

### 5.1 No API Versioning
All endpoints are `/api/...`. When the API changes, all deployed clients break simultaneously. Use `/api/v1/...`.

### 5.2 No Response Schema Validation
AI responses are `JSON.parse()`-d without schema validation. Malformed Gemini output can cause unhandled exceptions.

### 5.3 No Timeout on `/api/advice`
The AI advice endpoint has no request-level timeout beyond the Gemini client's default. A hung Gemini request will hold the Express connection indefinitely.

### 5.4 Error Objects Returned to Client
**File:** `server.ts` line 600  
```ts
res.status(500).json({ success: false, error });
```
The raw error object (which may contain stack traces, file paths, or internal info) is returned to the client.

---

## 6. Frontend

### 6.1 App.tsx is 3,426 Lines — Monolithic God Component
This is the most serious architectural issue. The entire app lives in a single component with 50+ state variables, 30+ handlers, and all business logic. Problems:
- Any state change triggers potential re-renders of the entire component tree
- Impossible to unit test
- Impossible to maintain at scale
- Minor bug in one section can crash the entire app

### 6.2 No Code Splitting / Lazy Loading on Heavy Components
The comment says "Robust Lazy Loading" was implemented, but then all components are **eagerly imported**:
```ts
import DealersView from "./components/DealersView";
import Dashboard from "./components/Dashboard";
// ... 12 more direct imports
```
This means the entire app JS is loaded on first render, even if the user only sees the login screen.

### 6.3 No Error Boundaries on Individual Views
`LocalErrorBoundary` exists but most view renders are not individually wrapped. One component crash = white screen.

### 6.4 80+ Temporary Fix Scripts in Project Root
`fix.py`, `fix2.js`, `fixTernary6.cjs`, `patch_login.cjs`, etc. — 80+ dev/debug scripts in root directory. These will be included in Docker images or server deploys. They should be deleted or moved to `.git` ignored folders.

### 6.5 No Loading States for Initial Data Sync
If Firestore takes >2 seconds to return data, the UI shows empty lists with no loading indicator. Users will tap buttons thinking nothing loaded.

### 6.6 Forms Have No Server-Side Validation
All form validation is client-side. A user who bypasses the UI can write arbitrary data to Firestore (within security rules).

---

## 7. Performance & Scalability

### Scale Analysis

| Scale | Behavior | Breaking Point |
|---|---|---|
| **100 users** | Works fine | None expected |
| **1,000 users** | Firestore reads spike; catalog seed runs repeatedly | Products deduplication logic runs for every user |
| **10,000 users** | Real-time listeners on `farmers` collection return 10,000 docs client-side | **This will crash mobile browsers** |
| **100,000 users** | App becomes completely unusable | Firestore costs explode, clients OOM |

### Critical Bottlenecks

1. **Full-collection real-time listeners** — `syncCollection("farmers", ...)` on login downloads every farmer document to every client every time. At 5,000 farmers, this is ~5,000 Firestore reads per user session start.

2. **2,500-product catalog generated on every app load** — `generate2500Catalog()` runs client-side, generating a large object in memory on every cold start. On 2 GB RAM phones, this alone can cause "Page Unresponsive."

3. **`healProductsAndSchedules()`** — runs on every product/schedule change, iterating every product × every schedule. At 500 schedules × 2,500 products = 1.25M iterations per sync update.

4. **Product deduplication in App.tsx** — scans all products on every sync. O(n²) complexity.

---

## 8. Caching & Data Access

### What works well
- `enableMultiTabIndexedDbPersistence` — Firestore offline cache is enabled ✅
- `getDocsSafe()` with circuit breaker — falls back to cache on timeout ✅
- `PRESEEDED_PRODUCTS` in client bundle for offline fallback ✅

### What needs improvement
- No server-side caching (Redis, in-memory) for Gemini AI responses — same village query hits Gemini every time
- Product catalog re-seeded on every new client even if it exists
- No `stale-while-revalidate` strategy for collection snapshots

---

## 9. Error Handling & Reliability

### What works well
- `getDocsSafe()` timeout + cache fallback ✅
- `LocalErrorBoundary` component exists ✅
- `generateWithFallback()` for Gemini model failover ✅

### Critical Gaps
- Unhandled promise rejections in `setDoc(...)` calls — scattered `.catch(err => console.warn(...))` is not enough
- If Firestore rules reject a write, the user sees nothing
- No retry logic for failed Firestore writes
- No global error boundary at the root level covering all views

---

## 10. Logging & Monitoring

### Current State
- **Application logs:** Browser `console.log/warn/error` only
- **Server logs:** `console.log/error` to Render.com's log stream
- **No structured logging** (JSON format, log levels, correlation IDs)
- **No external monitoring** (Sentry, DataDog, etc.)
- **No alerting** if server goes down

### What Must NOT Be Logged (currently logged)
| Logged Data | File | Line | Risk |
|---|---|---|---|
| User email address | App.tsx | 487 | PII leakage |
| FCM device token | App.tsx | 460 | Security (push spoofing) |
| Farmer name in login | App.tsx | 1960 | PII in logs |

### What SHOULD Be Logged (currently missing)
- Authentication failures with timestamp and IP
- Admin destructive actions (delete farmer, delete user)
- AI API errors with request ID
- Firestore permission-denied events

---

## 11. Backup & Disaster Recovery

### Current State
- **No Firestore scheduled export configured**
- **No backup documentation**
- Single accidental `deleteAllItems("farmers")` call → complete data loss

### Recommendations
- Enable **Firestore Scheduled Exports** to Cloud Storage (daily, free at small scale)
- Set up **Firebase Firestore PITR** (Point-in-time Recovery) — free for 7 days on Blaze plan
- Document recovery procedure
- **RPO (Recovery Point Objective):** Currently infinite — any data loss is permanent
- **RTO (Recovery Time Objective):** If Render goes down, frontend still works (Firestore direct). If Firestore goes down, app falls to cached data.

---

## 12. Deployment & Infrastructure

### Current State
- **Frontend/Backend:** Render.com (single Starter dyno, $7/mo)
- **Database:** Firebase Firestore (Blaze plan)
- **Auth:** Firebase Auth
- **Env Vars on Render:** Needs verification that `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_KEY` are set

### Missing
- No staging environment
- No environment variable documentation beyond `.env.example`
- `firebase-applet-config.json` contains live API key — must be removed from git
- No HTTPS force-redirect config (Render handles this, but should be verified)
- No health-check endpoint properly configured for Render keep-alive

### Render Configuration Gap
The server has no `/health` or `/ping` endpoint. Render's uptime check needs a dedicated endpoint that returns 200 in <1 second without triggering any database calls.

---

## 13. CI/CD

### Current State
- **No CI/CD pipeline exists**
- Deployment: manual `npm run build` + git push to Render
- No automated tests
- No linting on commits
- No build verification before deploy

### Minimum Required CI/CD (GitHub Actions)
```yaml
# Phase 1: On every push
- TypeScript compile check (tsc --noEmit)
- ESLint
- Build verification (npm run build)

# Phase 2: On merge to main
- Deploy to Render (via render deploy hook)
- Firebase rules deploy
```

---

## 14. Testing

### Current State
No test files exist in `src/`. The `test-*.cjs` files in the root are manual ad-hoc scripts, not automated test suites. Zero test coverage.

### Minimum Required Before Production

| Test Type | Priority | What to Test |
|---|---|---|
| Unit tests | 🔴 Critical | `healProductsAndSchedules()`, login flow, permission checks |
| Auth tests | 🔴 Critical | Farmer login with wrong password, access=false, pending status |
| Firestore rules tests | 🔴 Critical | Use Firebase Emulator Suite to test every rule |
| API tests | 🟠 High | Each endpoint with valid/invalid tokens |
| E2E tests | 🟡 Medium | Login → View schedule flow |

---

## 15. Dependencies

### Critical Issues

| Package | Version | Issue |
|---|---|---|
| `xlsx` | `^0.18.5` | **NOT maintained since 2023. Known security vulnerabilities. Use `exceljs` instead.** |
| `rwanda-geo` | `^1.4.6` | Completely unused. Remove. |
| `puppeteer` | `^25.4.0` | Dev dependency shipped in production `dependencies`. Move to `devDependencies`. |
| `firebase` | `^12.14.0` | Recent — OK |
| `react` | `^19.0.1` | Very new, check Capacitor compatibility |

### Vulnerability Check Required
Run `npm audit` — not done as part of this audit but must be done before launch.

---

## 16. File Storage & Uploads

### Current Approach
Images are Base64 encoded and stored inline in Firestore documents (no Firebase Storage used).

### Risks
- Firestore document limit: **1 MB per document**
- A photo at 200 KB + other fields can hit the limit easily
- Firestore is not optimized for binary data — reads are expensive
- No file type validation — any base64 string accepted
- No size validation before upload

### Recommendation
Move images to **Firebase Storage**. Store only the download URL in Firestore. Firebase Storage has built-in CDN, access control, and type validation.

---

## 17. Third-Party Services

| Service | Purpose | Failure Impact | Cost Risk | Recommended Fallback |
|---|---|---|---|---|
| Firebase Firestore | Database | App shows cached data only | Low at current scale | Local IndexedDB cache (already implemented) |
| Firebase Auth | Authentication | No new logins possible | None | Token caching for existing users |
| Render.com | Backend server | AI features, notifications disabled | None | Graceful UI degradation (already partially done) |
| Gemini AI | AI crop advice, product search, alerts | AI features unavailable | 🟠 Medium if abused | Fallback messages (partially done) |
| FCM | Push notifications | Notifications not delivered | None | Silent fail (already handled) |
| OpenStreetMap | Map tiles | Map view blank | None | Show coordinates as text |

---

## 18. AI Features

### What works well
- `generateWithFallback()` with model chain ✅
- Error handling on AI endpoints ✅
- Fallback alerts hardcoded ✅

### Critical Issues

| Issue | Risk | Fix |
|---|---|---|
| No per-user AI rate limiting | 🔴 Critical — one user can exhaust daily quota | Track AI calls per Firebase UID in Redis/Firestore |
| Prompt injection via `cropName`/`issue` fields | 🟠 High | Sanitize inputs, strip special characters |
| AI response not validated before being stored | 🟠 High | Schema-validate Gemini JSON before saving to Firestore |
| No token/cost cap per request | 🟡 Medium | Set `maxOutputTokens` in generation config |

---

## 19. Data Privacy & Compliance

### Data Collected
- Farmer name, mobile number, village, GPS location, crop data
- Staff name, login ID, password (plaintext — critical violation)
- Activity logs with user IDs
- FCM device tokens

### Issues
- **No privacy policy linked in the app**
- **Plaintext passwords** violate basic data protection principles
- **No data deletion mechanism** for farmers who want their data removed
- **Location data** (GPS lat/lon) stored permanently in Firestore with no expiry
- **Activity logs** contain PII with no stated retention period
- **No consent screen** before collecting location data on first use

---

## 20. Admin Panel

### What works well
- Admin-only routes protected by `requireAdmin` on server ✅
- Admin operations require Firebase Auth UID ✅
- Super-admin cryptographic check in Firestore rules ✅

### Issues
- **Admin password form field is `type="text"`** — password visible on screen
- **"Delete" button in AdminView has no confirmation dialog** — one tap deletes a user
- **Passwords shown in plaintext** to admin (`u.password || "•••••• (Auth)"`)
- **No audit log for admin destructive actions** — delete user/farmer is not logged
- No rate limit on admin actions — could accidentally hammer Firestore

---

## 21. Code Quality

| Issue | File | Impact |
|---|---|---|
| 3,426-line monolithic component | `App.tsx` | Unmaintainable, re-render risk |
| 80+ `fix*.py/cjs/js` scripts in root | Project root | Unprofessional, deployment noise |
| `console.log("App component executing...")` on every render | `App.tsx:254` | Production noise |
| `[key: string]: any` on Product interface | `types.ts:254` | Bypasses TypeScript safety |
| No `eslint-plugin-react-hooks` | `eslint.config.js` | Missing hook dependency warnings |
| `package.json` name is `"react-example"` | `package.json:2` | Wrong project name |
| `setLogLevel('silent')` on Firestore | `firebase.ts:29` | Hides important Firestore errors |

---

## 22. Production Readiness Scorecard

| Area | Current Status | Risk | Required Change | Priority |
|---|---|---|---|---|
| **Authentication** | Plaintext password comparison in JS | Data breach if any Firestore read possible | Hash passwords with bcrypt; move auth to server | 🔴 Critical |
| **Database Security** | Passwords stored plaintext; dealers open to public write | Complete user data exposure | Remove password field from Firestore; fix dealer rules | 🔴 Critical |
| **Secrets Management** | Firebase API key in committed JSON; admin email hardcoded | API key rotation impossible; admin account exposed | Remove from git; use env vars | 🔴 Critical |
| **Security** | CSP off; CORS allows all; 50MB body | XSS, DoS, request forgery | Fix helmet config, restrict CORS, reduce body limit | 🟠 High |
| **API** | No versioning; health endpoint unauthenticated; raw errors returned | Breaking changes; info leakage | Add v1 prefix; auth health endpoint; sanitize errors | 🟠 High |
| **Performance** | Full collection sync to every client; 2,500-product in-memory generation | Crash on low-end phones at scale | Paginate listeners; lazy-load catalog | 🟠 High |
| **Testing** | Zero automated tests | Regressions ship to production silently | Add Firestore rules tests + unit tests | 🟠 High |
| **Code Architecture** | 3,426-line monolith; 80+ junk files | Any change risks breaking everything | Split App.tsx; remove dev scripts | 🟠 High |
| **Monitoring** | None beyond Render console logs | Outages go undetected | Add Sentry or equivalent | 🟡 Medium |
| **Backup** | No scheduled Firestore exports | Single deletion = permanent data loss | Enable Firestore scheduled export | 🟡 Medium |
| **CI/CD** | Manual deploy only | Bad code ships without verification | GitHub Actions pipeline | 🟡 Medium |
| **Deployment** | No staging environment | Bugs found in production only | Create staging Firebase project | 🟡 Medium |
| **Privacy** | No privacy policy; plaintext passwords; no deletion mechanism | Legal liability | Add privacy policy; implement deletion | 🟡 Medium |
| **Dependencies** | `xlsx` vulnerable; `rwanda-geo` unused | Known CVEs | Update/remove packages | 🟡 Medium |
| **Admin Panel** | Password visible in UI; no delete confirmation | Accidental data loss | Add confirmation dialogs; hide passwords | 🟡 Medium |

---

## 23. Implementation Roadmap

### ⛔ Phase 1 — Critical Security (Must fix BEFORE any real users)

1. **Remove Firebase API key from `firebase-applet-config.json`**
   - Current: API key hardcoded in committed JSON
   - Fix: Move to `VITE_FIREBASE_API_KEY` env var only; commit only a template file
   - Files: `firebase-applet-config.json`, `src/lib/firebase.ts`
   - Rotate the key in Firebase Console after removing from git
   - Priority: 🔴 MUST DO FIRST

2. **Hash farmer and user passwords**
   - Current: Plaintext in Firestore, compared in JS
   - Fix: Store `bcryptHash` in Firestore; verify on server via API endpoint
   - Files: `src/App.tsx`, `server.ts`, `src/types.ts`
   - Migration: Script to hash all existing plaintext passwords
   - Priority: 🔴 Required before production

3. **Fix dealer/consultant public write rule**
   - Current: `allow create: if isSignedIn() || true;`
   - Fix: `allow create: if isSignedIn();`
   - Files: `firestore.rules`
   - Priority: 🔴 5-minute fix, critical impact

4. **Restrict CORS to your actual domain**
   - Current: `origin: true` (allow all)
   - Fix: `origin: ["https://vionex-4woy.onrender.com", "https://your-domain.com"]`
   - Files: `server.ts`
   - Priority: 🔴 Required before production

5. **Authenticate the `/api/search-health` endpoint**
   - Current: No auth, exposes internal stats
   - Fix: Add `requireAdmin` middleware
   - Files: `server.ts`
   - Priority: 🔴 Quick fix

6. **Remove PII from console logs**
   - Remove email logging in App.tsx:487, FCM token in App.tsx:460, farmer name in App.tsx:1960
   - Files: `src/App.tsx`
   - Priority: 🔴 Required before production

### 🔧 Phase 2 — Database & Backend

7. **Add Firestore scheduled export** (backup)
   - Enable in Firebase Console → Firestore → Scheduled Exports → Cloud Storage
   - No code change required
   - Priority: 🟠 High

8. **Add per-user AI rate limiting**
   - Track AI calls per Firebase UID in Firestore or in-memory with TTL
   - Files: `server.ts`
   - Priority: 🟠 High

9. **Reduce express body limit to 1MB**
   - Current: `limit: '50mb'`
   - Fix: `limit: '1mb'` (no endpoint needs 50MB bodies)
   - Files: `server.ts`
   - Priority: 🟠 High

10. **Add `/api/health` ping endpoint with no DB calls**
    - Files: `server.ts`
    - Priority: 🟠 High

11. **Validate and sanitize AI prompt inputs**
    - Strip HTML, limit length, validate field types
    - Files: `server.ts` (all AI endpoints)
    - Priority: 🟠 High

12. **Move images to Firebase Storage**
    - Create upload endpoint on server
    - Store Storage URL in Firestore instead of base64
    - Files: `server.ts`, `src/components/AddFarmerForm.tsx`, product components
    - Priority: 🟠 High (prevents Firestore document limit errors)

### 🖥️ Phase 3 — Frontend & Performance

13. **Enable true lazy loading for all view components**
    - Convert direct imports to `React.lazy()` + `<Suspense>`
    - Files: `src/App.tsx`
    - Priority: 🟠 High

14. **Add global error boundary**
    - Wrap entire `<App>` in a root ErrorBoundary
    - Priority: 🟠 High

15. **Fix admin password form field type**
    - Change `type="text"` to `type="password"` in AdminView
    - Files: `src/components/AdminView.tsx`
    - Priority: 🟠 High

16. **Add delete confirmation dialogs for admin destructive actions**
    - Files: `src/components/AdminView.tsx`
    - Priority: 🟠 High

17. **Delete 80+ fix/patch/test scripts from project root**
    - `fix*.py`, `fix*.cjs`, `patch_*.cjs`, `test-*.cjs`, etc.
    - Priority: 🟡 Medium

18. **Fix `package.json` project name**
    - Change `"name": "react-example"` to `"name": "vionex"`
    - Priority: 🟡 Low (cosmetic but unprofessional)

### 🧪 Phase 4 — Testing

19. **Set up Firebase Emulator Suite**
    - Test all Firestore rules with `@firebase/rules-unit-testing`
    - Priority: 🟠 High

20. **Write unit tests for `healProductsAndSchedules()`**
    - Most complex function in codebase, currently untested
    - Priority: 🟠 High

21. **Write auth flow tests**
    - Farmer login, staff login, wrong password, pending status, access=false
    - Priority: 🟠 High

22. **Write API endpoint tests**
    - Test each endpoint with valid token, expired token, no token
    - Priority: 🟡 Medium

### 🚀 Phase 5 — Deployment & Environment

23. **Create staging Firebase project**
    - Separate project for testing (`vionex-staging`)
    - Priority: 🟡 Medium

24. **Set up GitHub Actions CI/CD**
    - TypeScript check + ESLint + build on PR
    - Auto-deploy to staging on merge to `main`
    - Auto-deploy to production on git tag
    - Priority: 🟡 Medium

25. **Document all environment variables**
    - Update `.env.example` with every required variable and what it does
    - Priority: 🟡 Medium

### 📊 Phase 6 — Monitoring & Maintenance

26. **Set up Sentry error monitoring (free tier)**
    - Install `@sentry/react` in frontend and `@sentry/node` in server
    - Priority: 🟡 Medium

27. **Add structured logging to server**
    - Replace `console.log` with structured JSON logging
    - Priority: 🟡 Medium

28. **Replace `xlsx` with `exceljs`**
    - `xlsx` has known vulnerabilities and is unmaintained
    - Priority: 🟡 Medium

29. **Remove `rwanda-geo` package**
    - Unused dependency
    - Priority: 🟢 Low

---

## ✅ Final Production Launch Checklist

Copy this list and check each item before launch:

### Security
- [ ] Firebase API key removed from `firebase-applet-config.json` and rotated
- [ ] All farmer passwords hashed with bcrypt in Firestore
- [ ] All staff passwords hashed with bcrypt in Firestore
- [ ] Dealer/consultant Firestore rules changed from `|| true` to `isSignedIn()`
- [ ] CORS restricted to production domain only
- [ ] `/api/search-health` requires admin auth
- [ ] No PII (email, FCM token, farmer name) in console logs
- [ ] VAPID key moved to environment variable
- [ ] Admin email not hardcoded in source (use env var)
- [ ] `npm audit` run with no critical vulnerabilities

### Database
- [ ] Firestore scheduled export enabled (daily backup to Cloud Storage)
- [ ] Composite indexes configured in `firestore.indexes.json`
- [ ] Firestore rules tested with emulator
- [ ] Base64 images migrated to Firebase Storage URLs (or size limits enforced)

### Backend
- [ ] `express.json` limit reduced to `1mb`
- [ ] Per-user AI rate limiting implemented
- [ ] AI prompt inputs sanitized
- [ ] All API error responses return generic message, not raw Error object
- [ ] `/api/health` endpoint returns 200 in <100ms

### Frontend
- [ ] `package.json` name is `vionex` not `react-example`
- [ ] All views lazy-loaded with Suspense fallbacks
- [ ] Global root error boundary in place
- [ ] Admin password field is `type="password"`
- [ ] Delete confirmation dialogs for destructive actions
- [ ] No `console.log("App component executing...")` in production
- [ ] 80+ dev/fix scripts removed from root

### Deployment
- [ ] Render Starter plan active (not Free — cold starts prohibited)
- [ ] `GEMINI_API_KEY` set in Render environment
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` set in Render environment
- [ ] `ADMIN_EMAIL` set in Render environment (not hardcoded)
- [ ] Domain configured and HTTPS verified
- [ ] Service Worker / PWA manifest verified on Android
- [ ] Google Play Console account created ($25 one-time)

### Operations
- [ ] Sentry (or equivalent) error tracking configured
- [ ] Render health check URL configured to prevent cold starts
- [ ] Firestore PITR (point-in-time recovery) enabled
- [ ] Backup recovery procedure documented and tested

---

*End of Audit — Vionex Production Readiness Report, 30 Sep 2026*
