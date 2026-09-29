# Roadmap

This document outlines development milestones across Athena, categorized into completed architecture, active stabilization, and future development phases.

---

## Phase 1: DONE (Implemented & Verified)

- [x] **Authentication Foundation:** Stateless JWT in HTTP-only cookies, registration, OTP email verification, password reset.
- [x] **Backend Security Hardening:** Strict multi-tenant isolation (`userId` enforcement), mass-assignment protection on profile updates.
- [x] **Today V2:** Command center layout, Next Action derivation, planned work filtering, daily target progress ring.
- [x] **Planner V2:** Date allocation, backlog inbox triage, Kanban task grouping, duration modal trigger.
- [x] **Timeline V2:** Schedule blocks, drag-and-drop time positioning, duration resizing, task linking.
- [x] **Route-Persistent Focus Runtime:** Lifted `FocusProvider` to `UserLayout`, preserving active timers across route transitions.
- [x] **Timer Engine Overhaul:** Pure `WallClockTimer` eliminating background tab drift and frame loss.
- [x] **Focus Lifecycle Bug Fixes:**
  - Resolved session collision when starting focus from explicit task context.
  - Corrected planned duration precedence from modal.
  - Eliminated reducer state leakage across session resets.
  - Corrected 45-minute continuous focus segment partitioning.
- [x] **Session Review Overhaul:** Empathetic discard flow, numeric mood and focus depth scoring, custom distraction reflection.
- [x] **Settings & Appearance V2:** 12 curated themes, zero-FOUC user-scoped persistence, retired obsolete settings.

---

## Phase 2: CURRENT (Active Development)

- [/] **Focus Stabilization & Integration:**
  - Final integration between Focus Scratchpad, session todos, and global task records.
  - Edge-case testing on low-memory devices and network transitions.
- [ ] **Technical Documentation:** Comprehensive Obsidian knowledge graph covering architecture, data models, and behavioral semantics.

---

## Phase 3: NEXT (Planned Horizon)

The roadmap follows an explicit priority sequence:

```text
Focus Stabilization
      ↓
History (Chronological Aggregation)
      ↓
Daily Plan / Recurring Tasks / Outcomes
      ↓
Streak & Multi-State Activity Heatmap
      ↓
Insights (Telemetry Analysis)
      ↓
Data Collection Audit
      ↓
Final Domain & Behavioral Schema
      ↓
MongoDB → PostgreSQL Migration
      ↓
AI / Adaptive Planning Layer
      ↓
Contextual Persona Extensions (Student, Dev, Academic)
```

1. **[[History]]:** Multi-dimensional chronological review (daily, weekly, monthly sessions and completed tasks).
2. **[[Daily Outcome Model]]:** Formalizing occurrence-level task planning, neutral rescheduling, and planned work streak logic.
3. **[[Streaks and Daily Stats]]:** Upgrading streak heatmap to LeetCode-style multi-state visualization.
4. **[[Insights]]:** Automated diagnosis of focus patterns, distraction frequency, and planning accuracy.
5. **[[Data Collection Audit]]:** Rigorous audit of collected telemetry to establish the final domain model.
6. **Database Migration:** Migrating MongoDB to relational PostgreSQL once domain schemas are locked.
7. **[[AI Direction]]:** Adaptive daily targets and scheduling assistance powered by real behavioral data.
8. **[[Personas and Contexts]]:** Domain extensions for students, software engineers, and researchers.
