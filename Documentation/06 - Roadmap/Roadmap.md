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
- [x] **Relational Database Migration:** Migrated database to PostgreSQL with Drizzle ORM schemas and strictly scoped repositories.
- [x] **History V2 System:** Monday-first calendar grid, deterministic product date resolution, day state outcome evaluation, inline session telemetry, and task occurrence audit.
- [x] **Adaptive Intelligence Engines:**
  - `targetEngine.js` & `targetService.js`: 7-day rolling performance analysis with dynamic +5m / -5m target adjustments and freeze preservation.
  - `capacityEngine.js`: Rolling median workload capacity calculation and 130% overload threshold warning.
  - Developer Data Generation & Audit suite with 100% test validation.
- [x] **Workspace Theme Engine (14 Themes):** Standard and Pro theme collections, zero-FOUC instant styling, adaptive previews, and user-scoped persistence.

---

## Phase 2: CURRENT (Active Development)

- [/] **Focus & Planner Hardening:**
  - Active session multi-device continuity and recovery.
  - Edge-case testing across varied local timezones and device boundaries.
- [x] **Technical Documentation:** Comprehensive architecture, PostgreSQL data model, and feature knowledge graph.

---

## Phase 3: NEXT (Planned Horizon)

1. **[[Insights]]:** Automated diagnosis of deep work patterns, peak focus windows, distraction frequency, and planning accuracy.
2. **Multi-State Activity Heatmap:** Upgraded LeetCode / GitHub-style multi-tier activity visualization.
3. **[[Personas and Contexts]]:** Domain-specific templates and behavioral modules for students, software engineers, and researchers.
4. **Machine Learning Behavioral Intelligence:** Next-generation predictive schedule block recommendations and fatigue forecasting.
