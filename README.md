# 🌊 ARUNIWAVES — AI Developer & Engineering Manual

This file serves as the unified engineering principles, codebase documentation, and API directory for **ARUNIWAVES** (internal system for Dinas Kelautan dan Perikanan Provinsi Bali). 

---

## 🧭 PART 1: Engineering Principles & AI Guidelines

### Philosophy
ARUNIWAVES is designed as a collection of lightweight, independent internal web applications. We prioritize:
* **Simplicity** over complexity
* **Fast loading** over feature richness
* **Maintainability** over clever implementations
* **AI-friendly architecture** (highly modular, vanilla, low token footprint)

### Core Principles
1. **Independent Modules**: Keep each directory/sub-module (Aset, Helpdesk, Humas, Rapat, BBM, Kendaraan) isolated. Changing one should never break another.
2. **Shared Assets Guidelines**: Only place code in `assets/` if it is truly shared (e.g. `main.css`, `component.css`, `form.css`, `table.css`, `config.js`, `utils.js`, `api.js`, `auth.js`, `ui.js`). Do **not** mix module-specific logic into these shared helpers.
3. **Small & Focused Files**: Keep page-specific JS/CSS decoupled from HTML. Any block of page-specific logic exceeding 100-200 lines should live in its own file (e.g. `assets/js/rapat.js`).
4. **No Heavy Frameworks**: Use Vanilla HTML, CSS, and JS. Do not introduce compile-time tools, loaders, node packaging, or complex UI frameworks.
5. **Backend Owns Security**: All security, token verification, and transaction checks must be performed on the Google Apps Script backend. Frontend validation is strictly for UX convenience.
6. **Login on Demand**: Routine operations (data submission, public lookups) must remain accessible without login. Require Google GSI login only for modification, deletion, and admin validation tasks.
7. **Consistent UI Components**: Use standard layout nodes (`<div id="app-header"></div>`, `<div id="app-bottom-nav"></div>`, `<div id="app-drawer"></div>`) which are dynamically rendered by `UI.renderNavigation()` to ensure a unified feel.

---

## 🗂️ PART 2: Project Overview & Architecture

### Directory Structure
```
/
├── index.html                  ← Main portal (navigation hub & schedule widget)
├── manifest.json               ← PWA configuration
├── sw.js                       ← Service Worker (handles offline pre-caching)
│
├── assets/                     ← Centralized Shared Assets
│   ├── css/
│   │   ├── main.css            ← Theme tokens, resets, utility classes
│   │   ├── component.css       ← Cards, buttons, drawer, modals, toast
│   │   ├── form.css            ← Inputs, autocomplete, custom elements
│   │   └── table.css           ← Layout grid and data tables
│   └── js/
│       ├── config.js           ← Apps Script endpoints & configuration
│       ├── utils.js            ← Date formatting, HTML sanitizers
│       ├── api.js              ← Centered AJAX client (GET/POST)
│       ├── auth.js             ← Google login wrapper & sessions
│       ├── ui.js               ← Navigation & header renderer, loading indicators
│       │
│       ├── aset.js             ← Page-specific script: Asset lookup
│       ├── bbm.js              ← Page-specific script: BBM voucher requests
│       ├── helpdesk.js         ← Page-specific script: IT support forms
│       ├── humas.js            ← Page-specific script: Social media logger
│       ├── kendaraan.js        ← Page-specific script: Car bookings & signing
│       ├── rapat.js            ← Page-specific script: Room scheduler & calendar
│       │
│       ├── dashboard_ekspor.js     ← Dashboard: Fish export statistics
│       ├── dashboard_ews.js        ← Dashboard: Copernicus Sentinel alerts & news
│       ├── dashboard_ews_verifikasi.js ← Dashboard: Field verification form
│       └── dashboard_kendaraan.js  ← Dashboard: Fuel distribution & tax tracking
│
├── aset/                       ← Asset Management (info.html, index.html, qr.html)
├── bbm/                        ← BBM Voucher application form
├── helpdesk/                   ← IT Helpdesk ticket entry form
├── humas/                      ← PR Content Logger
├── kendaraan/                  ← Vehicle Booking Form
├── rapat/                      ← Room reservation calendar & scheduler
├── dashboard/                  ← Multi-module monitoring dashboards
├── scripts/                    ← Python Copernicus sat crawling bots
└── .github/workflows/          ← Copernicus daily automation workflows
```

---

## 🔗 PART 3: Database & API Reference

### 1. Database Spreadsheets
* **Spreadsheet DKP-Online (Main System)**:
  [Docs Link](https://docs.google.com/spreadsheets/d/10YvUpXDG9LbmUsZWJShrVldL5Ink1SrLhrrZeAyGClg/edit?gid=473762105#gid=473762105)
* **Spreadsheet EWS Sentimen Perikanan**:
  [Docs Link](https://docs.google.com/spreadsheets/d/1UGKcuRhG0TCgy9IED7FBNPHNEibVW3tpglDZXLezrd8/edit?gid=0#gid=0)

### 2. Google Apps Script Web App URLs
* **Apps Script DKP-Online API**:
  [Script Execution Link](https://script.google.com/macros/s/AKfycbwvaKzpcYW1OVdoe1wjJHjSW-sF_oK59Fm4lMuaL2dpJehEluD8mC0r1JPWF3wGmdAl/exec)
  * *Actions handled*: `getPegawai`, `getAset`, `submitHelpdesk`, `getHelpdesk`, `updateHelpdesk`, `getBooking`, `submitBooking`, `updateBooking`, `cancelBooking`, `submitBbm`, `getBbm`, `getSecretariatVehicles`, `submitBookingCar`
* **Apps Script EWS Sentimen Perikanan**:
  [Script Execution Link](https://script.google.com/macros/s/AKfycbx61Rby8zbN6igNFowAMH770NHESuTg0r6E6yvEHpBItFObxtdFXnbkhCIXRGB5Rxqe/exec)
  * *Actions handled*: News crawling, Gemini AI sentiment analysis, and alert logging.

### 3. Satelite Copernicus Products
* **Red Tide detection**: `cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D` (Chlorophyll-a anomaly)
* **Coral Bleaching detection**: `METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2` (Sea Surface Temperature anomaly)

### 4. GitHub Actions secrets required
* `GOOGLE_SERVICE_ACCOUNT_JSON`: Credentials payload for the daily satellite upload.
* `COPERNICUS_USERNAME`: Login identifier for CMEMS data.
* `COPERNICUS_PASSWORD`: Security token for CMEMS retrieval.
