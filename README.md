# Athena

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-yellow?logo=vite)
![Electron](https://img.shields.io/badge/Electron-43-9cf?logo=electron)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-336791?logo=postgresql)
![Auth](https://img.shields.io/badge/Auth-JWT%20Cookies-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

**Athena** is an advanced **focus, planning, and behavioral productivity platform** designed to understand how people actually work — moving beyond basic timers to track real execution, schedule alignment, and sustainable cognitive habits.

Available both as a **Native Desktop Application** (built with Electron) and a **Modern Web Application**, Athena bridges daily planning with real-time execution, historical telemetry, and adaptive intelligence.

---

## Screenshots

| **Today Dashboard** | **Focus Workspace & Timer** |
| :---: | :---: |
| ![Today Dashboard](Documentation/images/home.png) | ![Focus Workspace](Documentation/images/timer.png) |

| **Interactive Day Planner** | **History & Session Audit** |
| :---: | :---: |
| ![Daily Planner](Documentation/images/planner.png) | ![Session History](Documentation/images/history.png) |

| **Workspace Theme Engine** | **Profile & Habit Streaks** |
| :---: | :---: |
| ![Themes](Documentation/images/themes.png) | ![Profile & Streaks](Documentation/images/profile.png) |

| **Settings & Preferences** | **Planner Multi-View Triage** |
| :---: | :---: |
| ![Settings](Documentation/images/settings.png) | ![Planner Timeline Detail](Documentation/images/planner-1.png) |

<details>
<summary> <b>View More Planner Workflows (Timeline, Backlog & Schedule Blocks)</b></summary>

| **Backlog Inbox & Task Allocation** | **Schedule Block Configuration** |
| :---: | :---: |
| ![Planner Backlog](Documentation/images/planner-2.png) | ![Schedule Blocks](Documentation/images/planner-3.png) |

| **Execution Timeline Alignment** |
| :---: |
| ![Planner Execution](Documentation/images/planner-4.png) |

</details>

---

## Key Features

### 1. Focus Workspaces & Execution Engine
* **Pure Drift-Free Clock (`WallClockTimer`):** Hardware-accurate wall clock timing that eliminates background tab throttling and frame loss.
* **Three Workspace Modes:**
  * **Standard Workspace:** Full ambient control, segment indicators, and task context.
  * **Zen Workspace:** Zero-distraction minimalist mode focusing purely on the work in front of you.
  * **Custom Workspace:** Configurable layout tailored to personal preferences.
* **Ambient Soundscapes:** Integrated audio environments (Rain, White Noise, Cafe, Forest) to maintain flow state.
* **Distraction Logging & Pause Accounting:** Log interruptions on the fly with categorized reasons to build awareness of focus leaks.
* **Session Continuity & Recovery:** Seamlessly recover active sessions across browser tabs, reloads, or different devices.
* **Empathetic Session Review:** Post-session reflections capturing mood ratings, focus depth, and qualitative notes.

### 2. Interactive Planner & Timeline
* **Time-Blocked Scheduling:** Drag-and-drop schedule blocks onto a visual day timeline with collision detection and duration snapping.
* **Task & Schedule Binding:** Schedule blocks maintain immutable snapshots of linked tasks (`snapshotTaskTitle`, priority, and planned duration).
* **Backlog Triage & Prioritization:** Easily categorize incoming work into Priority tiers (P1 to P4), estimate durations, and allocate to specific calendar dates.
* **Strategic Goals:** Group related tasks into high-level Goal containers with target milestones and progress tracking.

### 3. History V2 & Telemetry Audit
* **Monday-First Calendar Navigation:** Local calendar grid with deterministic product date resolution that prevents timezone boundary shifts.
* **Day State Evaluation:** Automatically classifies days into **Successful** (green), **Partial** (amber), **Failed** (rose), or **Neutral** (rest days) based on planned vs. executed work.
* **Selected Day Summary:** Clear separation between plan outcome metrics and raw focus telemetry.
* **Inline Session Breakdown:** Click any session row to inspect planned vs. actual duration, focus segment counts, pause logs, reflection notes, and distraction details.
* **Task Occurrence Audit:** Complete historical record of when tasks were planned, rescheduled, or completed.

### 4. Adaptive Intelligence & Capacity Engines
* **Adaptive Daily Focus Target Engine:** Analyzes 7-day rolling performance to dynamically suggest calibrated adjustments (+5m or -5m) to the user's daily target while protecting freeze balances.
* **Capacity & Overload Engine:** Computes the user's rolling median focus capacity and warns when scheduled work exceeds 130% of typical capacity to prevent over-commitment and burnout.
* **Audit & Simulation Suite:** Built-in validator ensuring data integrity and scheduling consistency across all historical events.

### 5. Streaks & Habit Resilience
* **Meaningful Streak Tracking:** Evaluates streaks against daily focus targets and behavior metrics rather than mere binary logins.
* **Freeze Credit Protection:** Automatically uses freeze balances on designated rest days or off-days to preserve hard-earned momentum.
* **Risk Detection:** Alerts users when streaks are at risk so they can take action before losing momentum.

### 6. 14 Curated Workspace Themes
* **Standard Collection:**
  * *System Default* (Adaptive split preview syncing with OS light/dark mode)
  * *Light Mode* (Clean slate aesthetic)
  * *Vercel Monochrome* (High-contrast stark developer dark mode)
  * *Obsidian Dark* (Deep carbon background with vibrant violet accents)
* **Pro Collection:**
  * *Midnight Cyber* (Electric cyan & deep blue)
  * *Cyberpunk Neon* (Futuristic synthwave magenta)
  * *Nordic Frost* (Arctic slate with teal accents)
  * *Emerald Forest* (Pine canopy with emerald glow)
  * *Sunset Rose* (Warm maroon with rose gold)
  * *Solarized Amber* (Warm charcoal with golden amber)
  * *Dracula Velvet* (Vampire violet with lavender glow)
  * *Monokai Matrix* (Forest charcoal with neon lime)
  * *Galactic Amethyst* (Cosmic ultramarine with vivid purple)
  * *Mocha Espresso* (Roasted dark brown with caramel highlights)
* **Instant Switching:** Zero-FOUC (Flash of Unstyled Content) styling with real-time CSS variable injection and user-scoped account persistence.

### 7. Rich Notes & Scratchpad
* **Tiptap Rich-Text Editor:** Interactive editing with task checklists, blockquotes, code blocks, and embedded images.
* **Contextual Linking:** Link notes directly to tasks, goals, or individual focus sessions.
* **Focus Scratchpad:** Jot down thoughts during a focus session without breaking concentration.

### 8. Desktop Native & Multi-Account Switcher
* **Electron Desktop Application:** Native desktop performance, window controls, and OS tray support.
* **Multi-Account Switching:** Instantly switch between personal, work, and student profiles without logging out.
* **Global Command Palette:** Keyboard-driven navigation (⌘K / Ctrl+K) for rapid action execution.

---

# Architecture & Tech Stack

Athena follows a strictly layered, decoupled architecture ensuring security, testability, and deterministic data flow.

```
Frontend (React 19 / Electron)
    ↓  HTTP-Only JWT Cookies / Socket.io
Backend (Express 5.1 REST API)
    ↓  Routes & Middleware (Auth, CORS, Rate Limiters)
Controllers
    ↓  Payload shaping & HTTP status translation
Services
    ↓  Business logic, adaptive target calculations, session state machine
Repositories
    ↓  Multi-tenant user scoped queries
Database (PostgreSQL via Drizzle ORM)
```

### Frontend
* **Core:** React 19, Vite 7
* **Desktop Shell:** Electron 43 with Electron Builder
* **Styling & Animation:** Tailwind CSS v4, Framer Motion, `@base-ui/react`, Radix primitives
* **State Management:** Zustand, React Context API
* **Rich Editing & Visualization:** Tiptap Editor, Recharts, Lucide Icons

### Backend
* **Runtime:** Node.js (ES modules), Express 5.1
* **Database & ORM:** PostgreSQL, Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
* **Authentication:** Stateless JWT via secure HTTP-only cookies, Bcrypt
* **Communications & Verification:** Brevo Email API (`@getbrevo/brevo`), Socket.IO
* **Validation & Security:** Zod, Express Validator, Express Rate Limit

---

## Getting Started

### Prerequisites
* **Node.js:** v20+ recommended
* **PostgreSQL:** v15+ (local instance or cloud database such as Neon / Supabase)

### 1. Clone Repository
```bash
git clone https://github.com/Bookinheaven/Athena.git
cd Athena
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/athena
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
BREVO_API_KEY=your_brevo_key_here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

Apply database migrations:
```bash
npm run db:push
# or: npm run db:migrate
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Start the web application:
```bash
npm run dev
```

Or start the desktop Electron application:
```bash
npm run dev:desktop
```

---

## 📄 License
This project is licensed under the **MIT License**.
