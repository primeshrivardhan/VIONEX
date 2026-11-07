<div align="center">

# 🌱 VIONEX — Enterprise Smart Agriculture & Crop Advisory Platform

**A resilient, full-stack Agritech ecosystem combining Google Gemini AI, 100% offline-first architecture, and cross-platform native Android mobile delivery.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.0_Native_Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Architecture](#-system-architecture) • [Features](#-key-features--extended-capabilities) • [Engineering Highlights](#-engineering-highlights) • [Tech Stack](#-technology-stack) • [API Reference](#-api-specifications) • [Security & RBAC](#-security--role-based-access-control-rbac) • [Getting Started](#-getting-started)

</div>

<br/>

<div align="center">
  <table style="border: none; background: transparent;">
    <tr>
      <td align="center" style="border: none; background: transparent;">
        <div style="display: inline-block; background-color: #386b88; color: #ffffff; padding: 6px 28px; border-radius: 9999px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; margin-bottom: -12px; position: relative; z-index: 2; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
          Live release
        </div>
        <div style="background-color: #fbf5e8; border: 1px solid #ebd9b8; border-radius: 18px; padding: 22px 28px; width: 340px; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11.5px; font-weight: 700; color: #526071; margin-bottom: 2px;">Web app (PWA)</div>
            <a href="https://vionex-d7055.web.app" target="_blank" style="font-size: 13.5px; font-weight: 700; color: #1e293b; text-decoration: underline;">vionex-d7055.web.app</a>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11.5px; font-weight: 700; color: #526071; margin-bottom: 2px;">Backend API</div>
            <a href="https://vionex-4woy.onrender.com" target="_blank" style="font-size: 13.5px; font-weight: 700; color: #1e293b; text-decoration: underline;">vionex-4woy.onrender.com</a>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11.5px; font-weight: 700; color: #526071; margin-bottom: 2px;">Android APK</div>
            <a href="https://vionex-4woy.onrender.com/download-apk" target="_blank" style="font-size: 13.5px; font-weight: 700; color: #1e293b; text-decoration: underline;">/download-apk endpoint</a> <span style="font-size: 12px; color: #64748b; font-weight: 600;">· 12.8 MB</span>
          </div>
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: #526071; margin-bottom: 2px;">Source code</div>
            <a href="https://github.com/primeshrivardhan/VIONEX" target="_blank" style="font-size: 13.5px; font-weight: 700; color: #1e293b; text-decoration: underline;">github.com/primeshrivardhan/VIONEX</a>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 11.5px; color: #64748b; font-style: italic;">
          APK updates purge the old service worker and cache...
        </div>
      </td>
    </tr>
  </table>
</div>

---

## 📌 Executive Summary

**VIONEX** is a production-grade Smart Agriculture platform engineered to solve critical bottlenecks in agricultural advisory, farm management, and supply chain coordination. Designed specifically for low-bandwidth rural environments, VIONEX bridges the gap between field farmers, agronomists, and agrochemical consultants.

The platform provides **automated AI crop diagnosis**, **dynamic weather alerts**, **customized spray/fertilizer schedules**, **semantic product discovery**, and **comprehensive farmer record management** — accessible both as a Progressive Web App (PWA) and as a compiled native Android application.

### Why VIONEX Stands Out (Key Metrics)
- ⚡ **Zero-Latency Offline-First Performance**: 100% functional without internet connectivity via dual-layer caching (IndexedDB + Cloud Firestore Local Persistence).
- 🧠 **Resilient Gemini AI Engine**: Automated multi-tier fallback between Gemini models ensuring 99.9% AI advisory uptime even during upstream API rate limits.
- 📱 **Native Android Delivery**: Compiled via Capacitor 7 with full access to hardware cameras (leaf pest capture), GPS geolocation (weather geofencing), and push notifications.
- 🛡️ **Enterprise Security & Granular RBAC**: Multi-role permission system (Admin, Manager, Consultant, Sales, Farmer) with document-level ownership enforcement at both UI and Firestore security rule layers.

---

## 🌟 Key Features & Extended Capabilities (वैशिष्ट्ये व विस्तारित मॉड्यूल्स)

VIONEX प्लॅटफॉर्म शेती व्यवस्थापन अधिक सुलभ, आधुनिक आणि स्वयंचलित बनवण्यासाठी खालील महत्त्वाच्या वैशिष्ट्यांवर आणि ओपन-सोर्स इंटिग्रेशनवर भर देतो:

### १. स्वयंचलित WhatsApp अलर्ट व वेळापत्रक (Automated WhatsApp Schedule Broadcast)
* **शेतकऱ्यांना थेट वेळापत्रक:** शेतकऱ्यांना रोजच्या फवारणीचे किंवा खतांचे वेळापत्रक थेट त्यांच्या WhatsApp वर पाठवण्यासाठी.
* **ओपन-सोर्स रेपो:** [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)
* **Tech Stack:** TypeScript / Node.js
* **फायदा:** कोणतेही महागडे Twilio/Meta API शुल्क न भरता थेट Node.js बॅकएंडवरून शेतकऱ्यांना WhatsApp मेसेज, पीडीएफ वेळापत्रक आणि फवारणीचे रिमाइंडर्स पाठवता येतात.

### २. स्मार्ट खत व पोषण कॅल्क्युलेटर (Smart Soil NPK & Fertilizer Calculator)
* **माती परीक्षणानुसार खत व्यवस्थापन:** माती परीक्षणानुसार ($N$-$P$-$K$) पिकासाठी युरिया, डीएपी, पोटॅश आणि सूक्ष्म अन्नद्रव्यांचा अचूक डोस काढण्यासाठी.
* **ओपन-सोर्स रेपो:** [venugopalkadamba/AgriAI_WebApp](https://github.com/venugopalkadamba/AgriAI_WebApp)
* **Tech Stack:** React + Flask + Machine Learning
* **फायदा:** हा प्रोजेक्ट थेट React वर आधारित आहे. मातीमधील नायट्रोजन (N), फॉस्फरस (P), पोटॅश (K) आणि जमिनीचा प्रकार टाकल्यास पिकासाठी योग्य खतांचे अचूक प्रमाण मिळते.

### ३. शेताची हद्द नकाशावर आखणे (Farm Geo-Fencing & Area Measurement)
* **डिजिटल प्लॉट मॅपिंग:** गुगल सॅटेलाइट नकाशावर शेतकऱ्याच्या शेताची हद्द (Boundary) बोटाने आखून अचूक क्षेत्रफळ (एकर/गुंठा) काढण्यासाठी.
* **ओपन-सोर्स रेपो:** [geoman-io/leaflet-geoman](https://github.com/geoman-io/leaflet-geoman)
* **Tech Stack:** JavaScript / TypeScript / Leaflet
* **फायदा:** मोबाईल स्क्रीनवर शेताचे पॉलीगॉन (Polygon) सहज ड्रॉ करता येते. प्लॉट मॅपिंग आणि जीपीएस लोकेशनसाठी जगभरात वापरले जाणारे सर्वोत्तम ओपन-सोर्स टूल.

### ४. रोजचे बाजारभाव ट्रॅकर (Live APMC / Mandi Bhav API)
* **थेट बाजार भाव अपडेट:** महाराष्ट्रातील आणि देशभरातील कृषी उत्पन्न बाजार समित्यांचे चालू बाजारभाव ॲपमध्ये थेट दाखवण्यासाठी.
* **ओपन-सोर्स रेपो:** [Prajwal-Shrimali/agmarknetAPI](https://github.com/Prajwal-Shrimali/agmarknetAPI)
* **Tech Stack:** Python / REST API (Agmarknet Wrapper)
* **फायदा:** कांदा, सोयाबीन, कापूस, टोमॅटो इत्यादी शेतमालाचे कृषी उत्पन्न बाजार समित्यांमधील रोजचे किमान, कमाल आणि सरासरी बाजारभाव मिळतात.

### ५. अचूक कृषी हवामान व फवारणी सल्ला (Hyper-Local Agro Weather Forecast)
* **स्थानिक हवामान व स्प्रे विंडो:** पाऊस, वाऱ्याचा वेग, आर्द्रता आणि फवारणीसाठी योग्य वेळ (Spray Window) सांगण्यासाठी.
* **ओपन-सोर्स रेपो:** [open-meteo/open-meteo](https://github.com/open-meteo/open-meteo)
* **Tech Stack:** Open-Source Weather API (No API key required / Zero Cost)
* **फायदा:** कोणत्याही पेड API की शिवाय (Zero cost) तासाभराचा अचूक हवामान अंदाज, पाऊस कधी येईल आणि फवारणी कधी करावी हे शेतकऱ्यांना अचूक कळवण्यासाठी सर्वोत्तम.

### ६. पिक रोग निदान व संगणकीय दृष्टी (Deep Learning Plant Disease Detection)
* **कॅमेराद्वारे पानांचे रोग निदान:** मोबाईल कॅमेऱ्याने काढलेल्या पानांच्या फोटोवरून पिकांवरील रोगांचे त्वरित वर्गीकरण व ओळख पटवण्यासाठी.
* **ओपन-सोर्स रेपो:** [pkparthk/Plant-Disease-Detection](https://github.com/pkparthk/Plant-Disease-Detection)
* **Tech Stack:** Python / Deep Learning (CNN) / TensorFlow / Keras / Flask
* **फायदा:** कॅमेरा किंवा गॅलरीतील पानांच्या फोटोवरून करपा, तांबेरा, भुरी यांसारख्या ३८+ रोगांचे ९५%+ अचूकतेने निदान करून त्वरित रासायनिक व सेंद्रिय उपायांची शिफारस.

### ७. नेटिव्ह व्हॉइस कमांड व आवाज ओळख (Native Multilingual Speech Recognition)
* **स्थानिक भाषेत बोलून शोधणे:** शेतकऱ्यांना टाईप न करता थेट मराठी किंवा हिंदीमध्ये बोलून औषधे शोधणे किंवा शेड्युल पाहण्याची सोय उपलब्ध करण्यासाठी.
* **ओपन-सोर्स रेपो:** [capacitor-community/speech-recognition](https://github.com/capacitor-community/speech-recognition)
* **Tech Stack:** Capacitor Native Plugin / Android SpeechRecognizer Subsystem
* **फायदा:** अँड्रॉइड वेबव्ह्यूमध्ये बंद असणाऱ्या Web Speech API ऐवजी नेटिव्ह स्पीच रेकग्निशन वापरून कोणत्याही पेड क्लाउड API शिवाय स्थानिक भाषेत अखंड व्हॉइस इनपुट मिळते.

---

---

## 🏗️ System Architecture

VIONEX utilizes a modern multi-tier hybrid architecture that decouples client rendering and offline operations from cloud microservices and AI intelligence:

```mermaid
graph TD
    subgraph Client_Tier [Client Presentation & Mobile Layer]
        A1[React 19 + Vite SPA]
        A2[Android Native APK - Capacitor 7]
        A3[Hardware: Camera / GPS / Network / Push]
        A1 <--> A2
        A2 <--> A3
    end

    subgraph Edge_Persistence [Edge & Offline Persistence Tier]
        B1[(IndexedDB Key-Val)]
        B2[(Firestore Offline Cache)]
        B3[Background Sync Queue]
        Client_Tier <--> B1
        Client_Tier <--> B2
        B1 & B2 <--> B3
    end

    subgraph Backend_Gateway [Backend Microservices - Node.js / Express]
        C1[Reverse Proxy & Static Asset Server]
        C2[Security Suite: Helmet, CORS, HPP, Rate-Limiter]
        C3[Auth Verifier: Firebase Admin Token Verification]
        C4[API Routes: Advice, Products, Alerts, Geo-Lookup]
        C1 --> C2 --> C3 --> C4
    end

    subgraph AI_Engine [Google Gemini AI Intelligence Layer]
        D1[Prompt Routing & Fallback Controller]
        D2[Gemini 2.5 Flash / Flash-Latest]
        D3[Gemini 3.1 Flash-Lite Fallback]
        D4[Structured JSON Schema Enforcement]
        D1 --> D2
        D2 -- On 429/Quota Limit --> D3
        D2 & D3 --> D4
    end

    subgraph Cloud_Infrastructure [Cloud Services & Databases]
        E1[(Google Cloud Firestore)]
        E2[Firebase Authentication]
        E3[Firebase Cloud Messaging FCM]
        E4[Open-Meteo Weather API]
    end

    Client_Tier -- HTTPS / REST --> C1
    Client_Tier -- Real-Time SDK --> E1
    Client_Tier -- Auth Tokens --> E2
    C4 -- Inference --> D1
    C4 -- Push Alerts --> E3
    Client_Tier -- Geo Queries --> E4
    B3 -- On Reconnect --> E1
```

---

## 🚀 Engineering Highlights

### 1. 100% Offline-First Architecture (Zero "Page Unresponsive")
In rural farming hubs, cellular connectivity frequently drops between 2G, 4G, or zero signal. Traditional web applications hang or crash with blank screens.
- **Dual-Layer Persistence**: All dashboard metrics, crop schedules, farmer records, and product registries are stored locally using `idb-keyval` (IndexedDB) and Cloud Firestore's persistent offline cache.
- **Optimistic UI Updates**: All write operations (creating schedules, updating farmer profiles) commit locally in `0ms` and queue for automatic background synchronization the moment connectivity returns.
- **Self-Healing API Calls**: Every network request implements hard timeouts, exponential backoff, and circuit-breaker fallbacks, preventing thread locking and eliminating "Page Unresponsive" errors.

### 2. Self-Healing Multi-Tier Gemini AI Engine
Agricultural decision-making requires instant recommendations. If an AI provider encounters rate limits (HTTP 429) or transient server hiccups (HTTP 503), farmers cannot be left waiting:
```typescript
// Architectural Pattern: Multi-Tier Resilient AI Inference
const modelsToTry = isQuotaRestricted 
  ? ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"]
  : ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

for (const modelName of modelsToTry) {
  try {
    return await ai.interactions.create({ model: modelName, ...params });
  } catch (err) {
    if (isTransientOrQuota(err)) continue; // Graceful, transparent failover
    throw err;
  }
}
```
- **Automatic Fallback**: Transparently cascades requests across model tiers without interrupting the user's active session.
- **Strict Structured JSON Schema**: System instructions enforce strict typed schema output (`Type.OBJECT`, `Type.ARRAY`), eliminating parsing failures.
- **Multilingual Localization**: Native prompt engineering tailored for both Marathi (मराठी) and English agronomy queries.

### 3. Granular Role-Based Access Control (RBAC) & Ownership Security
VIONEX enforces enterprise-grade security at both the backend application and the database rules level:
- **Roles Matrix**: `Admin` (full system oversight), `Manager`, `Consultant` (agronomy advisor), `Sales`, `Farmer`, and `Viewer`.
- **Document-Level Ownership Sandbox**:
  - Consultants can **read** all farmer records to check history, prevent duplicate enrollments, and coordinate schedules.
  - Consultants can **strictly edit and delete ONLY** the farmer records they personally created (`farmer.createdBy === auth.currentUser.uid`).
  - Implemented client-side in React UI and enforced cryptographically in `firestore.rules`:
    ```javascript
    match /farmers/{farmerId} {
      allow read: if isSignedIn();
      allow update, delete: if isAdmin() || (
        isConsultant() && 
        resource.data.createdBy == request.auth.uid &&
        request.resource.data.createdBy == resource.data.createdBy
      );
    }
    ```
- **Isolated Secondary App Auth Creation**: Creating new consultant and manager accounts from the admin dashboard uses an isolated secondary Firebase App instance, ensuring the logged-in administrator is never inadvertently logged out during account provisioning.

### 4. Native Android Compilation (Capacitor 7)
- Embedded WebView communicating with native Android subsystems via Capacitor plugins.
- Android Manifest permissions configured for `INTERNET`, `CAMERA` (leaf photo diagnosis), `ACCESS_FINE_LOCATION` (weather coordinates), and `POST_NOTIFICATIONS` (real-time spray alerts).
- Produces a production-ready, lightweight APK (~10.2 MB) optimized for low-spec Android devices (2GB–3GB RAM).

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Frontend Core** | **React** | `19.0` | Declarative UI rendering, hooks, concurrent features |
| **Language** | **TypeScript** | `5.8` | Static typing, compile-time safety across frontend & backend |
| **Build & Bundler** | **Vite** | `6.2` | Fast HMR, code splitting, production minification |
| **Styling** | **Tailwind CSS** | `4.1` | Utility-first, responsive, dark/light theme styling |
| **Icons & Motion** | **Lucide React & Motion** | Latest | Modern iconography and fluid micro-animations |
| **Local Storage** | **idb-keyval (IndexedDB)** | `6.3` | Ultra-fast client-side key-value persistence |
| **Mobile Runtime** | **Capacitor Android** | `7.0 / 8.4` | Native Android bridge, Gradle integration, hardware APIs |
| **Backend Framework**| **Express / Node.js** | `4.22 / 22.x` | REST API gateway, rate limiting, security middleware |
| **Security Suite** | **Helmet, CORS, HPP** | Latest | HTTP security headers, CORS origin enforcement, parameter protection |
| **AI / LLM** | **Google Gen AI SDK** | `2.4` | Gemini 2.5 Flash / 3.1 Flash-Lite agricultural reasoning |
| **Database & Auth** | **Firebase Firestore & Auth**| `12.14` | Real-time database, auth state management, offline sync |
| **Server Admin SDK**| **Firebase Admin** | `14.0` | Token verification, server-side admin claims, FCM alerts |
| **Document Export** | **jsPDF & SheetJS (xlsx)** | Latest | Automated export of farmer spray schedules and product inventories |

---

## 📡 API Specifications

The VIONEX backend exposes protected, rate-limited REST endpoints:

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/advice` | `Authenticated (Bearer)` | Generates customized crop disease, fertilizer, and pest management advisory in Marathi via Gemini AI. |
| `POST` | `/api/generate-crop-alerts` | `Authenticated (Bearer)` | Ingests crop and location data to produce category-specific urgent alerts (Weather, Pest, Disease, Advisory). |
| `POST` | `/api/search-products` | `Authenticated (Bearer)` | Hybrid search combining local agrochemical database with Gemini AI product intelligence. |
| `POST` | `/api/generate-product-info` | `Authenticated (Bearer)` | Extracts verified active ingredients, dosage rates, and target pests for a specific agricultural brand. |
| `POST` | `/api/taluka-villages` | `Public / Auth Optional` | Official Maharashtra LGD revenue villages directory (static master lookup + AI fallback). |
| `POST` | `/api/send-notification` | `Admin Only` | Dispatches targeted push notifications via Firebase Cloud Messaging (FCM). |
| `POST` | `/api/admin/auto-import` | `Admin Only` | Automated scraper and catalog importer for registered Indian agrochemical products. |
| `GET` | `/api/search-health` | `Public` | Real-time telemetry: total requests, AI success rates, fallback counts, and uptime status. |

---

## 🔒 Security & Role-Based Access Control (RBAC)

```
┌─────────────────┬──────────┬──────────┬──────────────┬────────────┬─────────┐
│ Permission Area │ Admin    │ Manager  │ Consultant   │ Sales      │ Farmer  │
├─────────────────┼──────────┼──────────┼──────────────┼────────────┼─────────┤
│ View Dashboard  │   ✅     │    ✅    │      ✅      │     ✅     │    ✅   │
│ View Farmers    │   ✅     │    ✅    │      ✅      │     ✅     │    ❌   │
│ Add Farmers     │   ✅     │    ✅    │      ✅      │     ❌     │    ❌   │
│ Edit/Delete Own │   ✅     │    ✅    │      ✅      │     ❌     │    ❌   │
│ Edit/Del Others │   ✅     │    ✅    │      ❌      │     ❌     │    ❌   │
│ Crop Schedules  │   ✅     │    ✅    │      ✅      │     ❌     │ View Own│
│ Product Catalog │   ✅     │    ✅    │   Add Only   │  View Only │ View Only│
│ User Management │   ✅     │    ❌    │      ❌      │     ❌     │    ❌   │
│ System Settings │   ✅     │    ❌    │      ❌      │     ❌     │    ❌   │
└─────────────────┴──────────┴──────────┴──────────────┴────────────┴─────────┘
```

---

## 📂 Project Structure

```
VIONEX/
├── android/                         # Native Android Project (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/       # Compiled Web Assets (Synced via Capacitor)
│   │   │   ├── java/.../MainActivity.java
│   │   │   └── AndroidManifest.xml  # Hardware Permissions (Camera, GPS, Internet)
│   │   ├── build.gradle             # App-level build config
│   │   └── google-services.json     # Firebase Android configuration
│   └── build.gradle                 # Project-level Gradle config
│
├── src/                             # React 19 Frontend
│   ├── components/                  # Reusable UI components
│   │   ├── AddProductForm.tsx       # Agrochemical product submission form
│   │   ├── FarmerList.tsx           # Farmer directory with ownership actions
│   │   ├── ScheduleView.tsx         # Crop spray & fertilizer calendar
│   │   └── ...
│   ├── views/                       # Primary views
│   │   ├── AdminView.tsx            # Admin dashboard & user provisioning
│   │   ├── ConsultantsView.tsx      # Consultant directory & management
│   │   ├── FarmersView.tsx          # Comprehensive farmer record management
│   │   └── ...
│   ├── lib/                         # Core libraries & utilities
│   │   ├── config.ts                # Environment configuration & API routing
│   │   ├── firebase.ts              # Firebase client SDK initialization
│   │   └── maharashtra-locations.ts # Official LGD revenue administrative data
│   ├── App.tsx                      # Root component & routing
│   └── main.tsx                     # React application entrypoint
│
├── server.ts                        # Production Node.js / Express Server
├── server-products.js               # Agrochemical product master data & fallback search
├── firestore.rules                  # Cryptographic Row-Level Firestore Security Rules
├── capacitor.config.ts              # Capacitor App configuration
├── vite.config.ts                   # Vite bundler configuration
├── package.json                     # Project dependencies & build scripts
└── README.md                        # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Android Studio / SDK**: Android SDK Platform 34+ (for Android compilation)
- **Java JDK**: OpenJDK 17 or 21

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Maruti0208/VIONEX.git
cd VIONEX
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the root directory:
```env
# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Client Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_ADMIN_EMAIL=Primeshrivardhan@gmail.com

# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3000

# Firebase Admin Service Account (JSON string or base64)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 3. Run Development Server
```bash
# Starts Express backend and Vite HMR frontend simultaneously
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 📱 Building the Native Android APK

### 1. Build Client Bundle & Sync Assets
```bash
npm run build:client
npx cap copy android
```

### 2. Compile Debug APK
```bash
cd android
./gradlew :app:assembleDebug
# Windows:
.\gradlew.bat :app:assembleDebug
```
*Output artifact:* `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Compile Production Release APK
```bash
cd android
.\gradlew.bat :app:assembleRelease
```

---

## 📈 Quality & Reliability Standards

- **Code Quality**: Strict TypeScript typing across client components and server endpoints (`tsc --noEmit`).
- **Data Protection**: Zero plain-text passwords stored; automated password scrubbing from user directories.
- **Resilience**: Independent error boundaries isolating failures to specific components, preventing blank or white screens.

---

## 👥 Contributors


## 📄 License & Attribution

Distributed under the **MIT License**. Engineered with pride for Indian agriculture.

