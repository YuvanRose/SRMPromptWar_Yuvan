# FairShift — Decent Work Platform (UN SDG 8)

> **Decent Work and Economic Growth (UN SDG 8)**  
> Transparent shifts, explainable pay, closed-loop safety reporting, and workforce health monitoring for employee-intensive sectors.

FairShift addresses systemic inequities faced by frontline workers in high-turnover, employee-intensive environments (construction sites, college campuses, factories, hospitals): **opaque pay structures, unrecorded overtime, unaddressed hazard reports, and lost wages from network or software failures**.

---

## 🚀 Key Features

### 1. Shift Tracking & Intelligent Overtime
- **Offline-First Check-In**: Workers can check in using **QR Scan**, **GPS Geolocation**, or **Manual Fallback**.
- **Resilient Offline Outbox**: Every check-in generates an RFC 4122 client UUID and stores in local IndexedDB (Dexie). Queued entries auto-sync when network connectivity returns with exponential backoff and zero duplication.
- **Configurable Overtime Rules**: Automatic daily (e.g., >8h/day @ 1.5x) and weekly (>45h/week) calculation tailored by sector.
- **Supervisor Approval Workflow**: Supervisors/HODs can review and approve manual fallback entries in real time.

### 2. Worker-Owned & Clear Payslips
- **Explainable Pay**: Every single line item (Basic, HRA, Overtime, Provident Fund, ESI) includes plain-language, low-literacy-friendly explanations in the worker's language.
- **Voice Read-Aloud**: Browser `SpeechSynthesis` reads line items aloud in Indian English and localized accents for workers with low literacy.
- **Indian Rupee (₹) Numbering**: Clean standard Indian number formatting (e.g. ₹28,450).

### 3. Closed-Loop Safety Reporting
- **Multi-Modal Hazards**: Voice note recording via `MediaRecorder`, text description, and photo upload.
- **Visible Status Timeline**: Workers track lifecycle status (**Received** → **In Review** → **In Progress** → **Fixed**).
- **Two-Way Dialogue**: Employers/supervisors post direct replies visible as speech bubbles on the worker's timeline.

### 4. Employer Operational Dashboard
- **Live Workforce Health**: 30-day attendance trends (present vs. absent), open hazard severity tracking, and overtime fatigue hotspots.
- **Fatigue Alerts**: Flags workers exceeding safety thresholds to prevent workplace exhaustion and accidents.
- **Hazard Management Inbox**: Filter by status and severity, assign responsibilities to supervisors/HODs, and close the loop.

---

## 🏗️ Two Configured Sectors (Same Codebase)

FairShift adapts dynamically to different industries through configuration objects rather than code forks:

| Vocabulary & Rules | Construction Sector | College / University Sector |
| :--- | :--- | :--- |
| **Site Concept** | Construction Site (e.g., *Site Alpha*) | Academic Department (e.g., *CS Department*) |
| **Supervisor Role** | Site Supervisor / Safety Officer | Head of Department (HOD) / Lab In-Charge |
| **Worker Role** | Site Worker (Mason, Scaffolder, Operator) | Staff Member (Lab Instructor, Assistant) |
| **Shift Schedule** | 08:00 – 17:00 (Mon–Sat) | 09:00 – 17:00 (Mon–Fri) |
| **Daily OT Threshold** | > 8 hours / day (1.5x) | > 8 hours / day (1.5x) |
| **Weekly Fatigue Cap** | 45 hours / week max | 40 hours / week max |
| **Hazards Configured** | Scaffolding, Fall Risk, Heavy Machinery, PPE | Electrical, Lab Chemical, Ergonomic, Fire |

---

## 🔑 Demo Logins

No external database required to test! The platform features one-click login buttons on the login screen or you can type these credentials:

| Sector | Role | Username | Password |
| :--- | :--- | :--- | :--- |
| **Construction** | **Worker** | `worker_construction` | `pass123` |
| **Construction** | **Employer** | `employer_construction` | `pass123` |
| **College** | **Staff Worker** | `worker_college` | `pass123` |
| **College** | **HOD / Employer** | `employer_college` | `pass123` |

---

## 🌐 Complete 6-Language Support (i18n)

FairShift includes complete UI translations across 6 major Indian languages:
1. **English** (`en`)
2. **हिन्दी — Hindi** (`hi`)
3. **தமிழ் — Tamil** (`ta`)
4. **తెలుగు — Telugu** (`te`)
5. **ಕನ್ನಡ — Kannada** (`kn`)
6. **മലയാളം — Malayalam** (`ml`)

Switch anytime via the language dropdown in the header. (See `TRANSLATIONS_REVIEW.md` for native review status).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vite + React 19 + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Design Tokens (CSS Variables)
- **Offline DB**: Dexie.js (IndexedDB) with client-UUID idempotency outbox
- **Charts**: Recharts (lazy-loaded Line & Bar charts)
- **Internationalization**: react-i18next
- **Forms & Validation**: Zod schema validation
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security & Storage)
- **Testing**: Playwright End-to-End Test Suite

### Offline Outbox Architecture:
```
[Worker Action] 
       │
       ▼
[IndexedDB: Dexie Outbox] (Client UUID + Payload + Status: 'pending')
       │
   (Online?) ─── No ───► Retain in Dexie & Display "Offline — X items will sync"
       │
      Yes
       ▼
[Sync Engine] (Idempotent UPSERT to Supabase with Exponential Backoff)
       │
       ▼
[Status Updated: 'synced'] ──► Disappear banner
```

---

## 📋 Getting Started

### 1. Prerequisites
- Node.js >= 18
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YuvanRose/SRMPromptWar_Yuvan.git
cd SRMPromptWar_Yuvan

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Environment Setup (Optional for Supabase)
By default, FairShift operates in full offline/demo mode with rich seed data. To connect a live Supabase instance:
```bash
cp .env.example .env
```
Fill in:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Supabase Database Migration
Execute `supabase/migrations/001_schema.sql` in your Supabase SQL Editor:
- Creates all tables (`organizations`, `sites`, `profiles`, `shifts`, `checkins`, `payslips`, `hazard_reports`, `report_events`).
- Configures complete Row Level Security (RLS) policies.
- Grants required permissions to `authenticated` and `anon` roles.

### 5. Running the Application
```bash
# Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Running Playwright Tests
```bash
npm run test
```

---

## ♿ Accessibility (WCAG AA) & Mobile Constraints
- **44px Minimum Touch Targets**: Sized for coarse fingers and low-end touchscreens.
- **High Contrast Ratios**: Tested against sunlight and dim factory lighting.
- **No Color-Only State**: Every status badge includes an icon and clear text.
- **Prefers Reduced Motion**: Animations respect OS-level motion reduction settings.
- **Screen Reader Support**: ARIA attributes on all interactive elements.

---

## 📝 Cross-Sector Adoption Note
FairShift was designed with a single generalized core model:
- An **Organization** has **Sites** (spatial or administrative partitions).
- A **Profile** has a **Role** (`worker` or `employer`).
- A **SectorConfig** provides vocabulary mapping and overtime math rules.

This design enables FairShift to scale from a metro construction site with 500 daily wage laborers to a university department with 40 contract lecturers without modifying a single component or writing fork branches.

---

## ⚠️ Assumptions and Known Limits
1. **Camera / Mic in Desktop Testing**: Simulated fallbacks are provided when browser hardware permissions are denied or unavailable in headless environments.
2. **Demo Mode Seed Data**: When Supabase credentials are not configured, mock seed data operates transparently in-memory and in IndexedDB.
3. **PWA Service Worker**: Registered in production builds (`npm run build && npm run preview`).
