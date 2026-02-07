# Athena 

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-fast-yellow?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-darkgreen?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT%20Cookies-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A focus & habit tracking app I’m building to understand how people actually work — not just how long they run a timer.

Athena started as a simple focus tracker and slowly grew into a system that tracks **sessions, streaks, and behavior patterns**, with the goal of building sustainable study/work habits.

---

## What Athena does (so far)

### Authentication
- Login & register flow
- JWT authentication using **HTTP-only cookies** (no tokens in localStorage)
- Email OTP verification
- Forgot password flow
- Basic rate limiting on auth routes

---

### Focus Sessions
- Create focus sessions with a title
- Each session is split into **focus and break segments**
- Tracks:
  - start time
  - duration
  - completion state
- Sessions can be paused, resumed, and completed
- Active session is restored on refresh
- All session data is persisted automatically

---

### Streak System
This is the core idea behind Athena.

- Daily focus streak tracking
- Starts with a **25 minute/day target** for everyone
- Calculates a daily streak rate instead of just “done / not done”
- Streak states:
  - Green → target completed
  - Yellow → close to target
  - Red → streak at risk
- Freeze credits to protect streaks on off days
- Visual streak ring showing today’s progress
- Shows exactly how many minutes are left to save the streak

---

### Dashboard & Analytics
Everything here is generated from real session data.

- Total focus time
- Sessions completed
- Average focus score
- Average mood score
- Productivity percentage
- Weekly focus trends
- Focus vs break comparison
- Sessions by weekday
- Mood vs focus analysis
- Completion rate
- Top distractions
- This week vs last week comparison

---

### Session History
- List of all completed sessions
- Session details:
  - title
  - duration
  - status
  - focus/break breakdown
- Recent sessions panel on dashboard

---

### UI & Experience
- Clean, minimal dashboard
- Light and dark mode
- Smooth animations (Framer Motion)
- Skeleton loaders instead of blank screens
- Fully responsive layout

---

## Tech Stack

### Frontend
- React (Vite)
- Context-based auth
- Recharts for charts
- Framer Motion
- Lucide icons

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Cookie-based authentication
- Session & streak models
- Validation and rate-limiting middleware

### Deployment
- Frontend deployed on Vercel
- Backend deployed on Render
- CORS and cookies configured properly for production

---

## Why I’m building this
Most productivity apps either:
- guilt-trip you with streaks, or
- give raw data without meaning

Athena is my attempt to sit in the middle —  
**track behavior, show patterns, and slowly help improve focus without burnout.**

This project is also a learning playground for:
- system design
- backend auth
- analytics pipelines
- and later, AI-driven insights

---

## What’s next
(Not implemented yet)
- Advanced Streak System including Monthly streak view
- Smarter daily target adjustment
- AI-based focus insights
- Leveling & gamification

---

## License
MIT
