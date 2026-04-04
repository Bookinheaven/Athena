# Athena

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-fast-yellow?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-darkgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT%20Cookies-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

Athena is a **focus, planning, and habit tracking system** designed to understand how people actually work — not just how long they run a timer.

Instead of only tracking time, Athena tracks **sessions, tasks, goals, notes, streaks, and behavioral patterns** to help users build sustainable productivity habits.

---

# What Athena does (current features)

## Authentication

Secure authentication system built with cookie-based JWT.

Features:

* User registration
* Login & logout
* Email OTP verification
* Password reset flow
* Secure **HTTP-only JWT cookies**
* Auth rate limiting
* Session-based authentication check

Protected routes ensure only authenticated users can access planner, sessions, and analytics.

---

# Focus Sessions

Athena's core unit is a **Focus Session**.

A session represents a structured period of focused work.

Each session contains:

* Title
* Start time
* Focus segments
* Break segments
* Completion state
* Duration tracking

Features:

* Start / pause / resume sessions
* Automatic session persistence
* Active session recovery on refresh
* Focus vs break tracking
* Session completion analytics

Sessions also generate **productivity insights** used by the dashboard.

---

# Planner System

Athena includes a **daily planner system** that integrates tasks, goals, and notes.

Users can plan their work day directly inside the focus tracker.

Planner contains:

### Tasks

Tasks represent actionable items.

Each task supports:

* Title
* Status
* Priority
* Order for drag-and-drop
* Goal linking
* Completion state

Tasks can be organized and completed during focus sessions.

---

### Goals

Goals group related tasks into larger objectives.

Example:

```
Goal: Build Portfolio Website
   Task: Design layout
   Task: Build homepage
   Task: Deploy site
```

Goals support:

* Progress tracking
* Task grouping
* Completion state
* Priority and ordering

---

### Notes

Notes allow users to capture ideas or session insights.

Each note contains:

* Title
* Content
* Creation timestamp
* Optional session linkage

This allows users to record:

* thoughts during focus sessions
* study notes
* ideas or reminders

---

# Streak System

Athena tracks **daily focus streaks** to help build consistency.

Unlike simple streak apps, Athena uses **focus minutes and behavior metrics**.

Features:

* Daily focus target
* Streak rate calculation
* Streak risk detection
* Freeze credits for off days
* Visual streak progress

Streak states include:

Green → Target completed
Yellow → Close to target
Red → Streak at risk

---

# Dashboard & Analytics

The dashboard converts raw session data into meaningful insights.

Metrics include:

* Total focus time
* Sessions completed
* Productivity score
* Weekly focus trends
* Focus vs break comparison
* Completion rate
* Session patterns
* Mood vs focus correlation

Analytics are generated from session history.

---

# Session History

Athena keeps a history of completed sessions.

Each session record includes:

* Session title
* Total duration
* Focus / break breakdown
* Completion status
* Timestamp

This data feeds the analytics system.

---

# UI & Experience

The frontend focuses on **clarity and responsiveness**.

Features:

* Minimal distraction interface
* Light / dark mode
* Smooth animations (Framer Motion)
* Skeleton loaders
* Fully responsive layout
* Modern planner layout

---

# Architecture

Athena follows a **layered backend architecture**.

```
Routes
   ↓
Controllers
   ↓
Services
   ↓
Models (MongoDB)
```

Benefits:

* Clean separation of logic
* Easier testing
* Maintainable codebase
* Scalable architecture

---

# Tech Stack

## Frontend

* React (Vite)
* Context API
* Framer Motion
* Recharts
* Lucide Icons

---

## Backend

* Node.js
* Express
* MongoDB
* Mongoose
* JWT Authentication
* HTTP-only cookies
* Express Validator
* Rate limiting
* Socket.IO support

---

## Deployment

* Frontend → Vercel
* Backend → Render
* MongoDB → Atlas

---

# Why I’m building Athena

Most productivity apps either:

• guilt-trip users with streaks
• or show raw data without meaning

Athena tries to sit in the middle:

Track behavior → show patterns → gradually improve focus.

The project also serves as a **learning playground for:**

* backend system design
* analytics pipelines
* behavioral tracking systems
* future AI insights

---

# Planned Features

Future roadmap includes:

* Advanced streak visualization
* Monthly productivity reports
* AI-generated focus insights
* Smart daily target adjustment
* Gamification & leveling
* Behavior prediction

---

# License

MIT
