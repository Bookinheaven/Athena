# Athena

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-yellow?logo=vite)
![Electron](https://img.shields.io/badge/Electron-43-9cf?logo=electron)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Components-black?logo=shadcnui)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-336791?logo=postgresql)
![Auth](https://img.shields.io/badge/Auth-JWT%20Cookies-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

**Athena** is an advanced **focus, planning, and behavioral productivity platform** designed to understand how people actually work — moving beyond basic timers to track real execution, schedule alignment, and sustainable cognitive habits.

Available both as a **Native Desktop Application** (built with Electron) and a **Modern Web Application**, Athena bridges daily planning with real-time execution, recurring routines, historical telemetry, and adaptive intelligence.

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

### 1. Recurring Routines V1 & Step-Level Execution
* **Structured Multi-Step Routines:** Define recurring routines (e.g., Morning Kickoff, Deep Work Prep, Evening Wind Down) composed of ordered, timed steps.
* **Flexible Recurrence Scheduling:** Schedule routines daily, on weekdays, or on specific days of the week with strict start-date boundaries.
* **Direct Step-Level Focus Launch:** Launch a dedicated Focus session directly from any individual routine step on the Today dashboard with full context tracking (`routineOccurrenceId` & `routineStepOccurrenceId`).
* **Planner Timeline Integration:** Schedule routine occurrences directly into the Planner timeline alongside tasks with collision avoidance, duration adjustments, and drag-and-drop support.
* **Routine-Aware Session Review:** Post-session review automatically updates step progress atomically (`pending` → `in_progress` → `completed`), handles skips/unskips, and evaluates overall routine completion.
* **Unified Commitment Tracking:** Daily streaks and evaluation models cleanly combine task commitments and routine commitments with denominator safety on skipped routines.

### 2. Focus Workspaces & Execution Engine
* **Pure Drift-Free Clock (`WallClockTimer`):** Hardware-accurate wall clock timing that eliminates background tab throttling and frame loss.
* **Three Workspace Modes:**
  * **Standard Workspace:** Full ambient control, segment indicators, and task context.
  * **Zen Workspace:** Zero-distraction minimalist mode focusing purely on the work in front of you.
  * **Custom Workspace:** Configurable layout tailored to personal preferences.
* **Ambient Soundscapes:** Integrated audio environments (Rain, White Noise, Cafe, Forest) to maintain flow state.
* **Distraction Logging & Pause Accounting:** Log interruptions on the fly with categorized reasons to build awareness of focus leaks.
* **Session Continuity & Recovery:** Seamlessly recover active sessions across browser tabs, reloads, or different devices.
* **Empathetic Session Review:** Post-session reflections capturing mood ratings, focus depth, and qualitative notes.

### 3. Interactive Planner & Timeline
* **Time-Blocked Scheduling:** Drag-and-drop schedule blocks onto a visual day timeline with collision detection and duration snapping.
* **Task & Schedule Binding:** Schedule blocks maintain immutable snapshots of linked tasks or routines (`snapshotTaskTitle`, priority, and planned duration).
* **Backlog Triage & Prioritization:** Easily categorize incoming work into Priority tiers (P1 to P4), estimate durations, and allocate to specific calendar dates.
* **Strategic Goals:** Group related tasks into high-level Goal containers with target milestones and progress tracking.

### 4. History V2 & Journal Records
* **Deterministic Calendar Grid:** Monday-first calendar operating on canonical product dates (`YYYY-MM-DD`) without browser timezone boundary shifts.
* **Day State Evaluation:** Automatically classifies days into **All done** (green), **Partial** (amber), **Missed** (rose), or **Neutral** (rest days) based on planned vs. executed work.
* **Interactive Day Tooltips & Ambient Tints:** Visual status indicators with hover tooltips detailing completed tasks, routines, and focus minutes.
* **Monthly Overview KPI Banner:** Live aggregate statistics tracking total focus time, tasks completed, sessions executed, and active days.
* **Human-Centric Session Breakdown:** Clean, readable format displaying actual vs. planned duration, interval counts, pause records, and qualitative reflection notes without developer jargon or raw timestamps.
* **Zero-Jitter In-Memory Caching:** Built-in client-side request deduplication and debounce mechanisms that prevent 429/4xx retry storms during fast date navigation.
* **Compact Pagination:** Clean 5-item pagination without awkward inner scrollbars.

### 5. Adaptive Intelligence & Capacity Engines
* **Adaptive Daily Focus Target Engine:** Analyzes rolling 14-day consistency to dynamically suggest calibrated adjustments (+5m or -5m) to the user's daily target while protecting freeze balances.
* **Capacity & Overload Engine:** Computes the user's rolling median focus capacity and warns when scheduled work exceeds 130% of typical capacity to prevent over-commitment and burnout.
* **Audit & Simulation Suite:** Built-in validator ensuring data integrity and scheduling consistency across all historical events.

### 6. Streaks & Habit Resilience
* **Meaningful Streak Tracking:** Evaluates streaks against daily focus targets and behavior metrics rather than mere binary logins.
* **Freeze Credit Protection:** Automatically uses freeze balances on designated rest days or off-days to preserve hard-earned momentum.
* **Risk Detection:** Alerts users when streaks are at risk so they can take action before losing momentum.

### 7. 14 Curated Workspace Themes
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

### 8. Rich Notes & Scratchpad
* **Tiptap Rich-Text Editor:** Interactive editing with task checklists, blockquotes, code blocks, and embedded images.
* **Contextual Linking:** Link notes directly to tasks, goals, or individual focus sessions.
* **Focus Scratchpad:** Jot down thoughts during a focus session without breaking concentration.

### 9. Desktop Native & Multi-Account Switcher
* **Electron Desktop Application:** Native desktop performance, window controls, and OS tray support.
* **Multi-Account Switching:** Instantly switch between personal, work, and student profiles without logging out.
* **Global Command Palette:** Keyboard-driven navigation (⌘K / Ctrl+K) for rapid action execution.

---

# Architecture & Tech Stack

Athena follows a strictly layered, decoupled architecture ensuring security, testability, and deterministic data flow.

![Athena Architecture](Documentation/images/architecture.png)

### Frontend
* **Core:** React 19, Vite 7
* **Desktop Shell:** Electron 43 with Electron Builder
* **UI Components:** shadcn/ui, Radix primitives, `@base-ui/react`
* **Styling & Animation:** Tailwind CSS v4, Framer Motion, Lucide Icons
* **State Management:** Zustand, React Context API
* **Rich Editing & Visualization:** Tiptap Editor, Recharts

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
