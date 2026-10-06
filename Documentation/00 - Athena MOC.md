# Athena — Architecture & Product Knowledge Graph

> Comprehensive technical and architectural documentation for the Athena productivity platform.
> This vault is organized as a linked knowledge graph maintained in Obsidian.

---

## 01. Product
- [[Product Overview]] — Core definition, problem statement, and structural domain boundaries.
- [[Product Philosophy]] — Consistency over intensity, awareness-driven habits, feedback loops.
- [[Core Loop]] — The 7-stage engine: Capture → Plan → Schedule → Focus → Reflect → Review → Adapt.
- [[Product Decisions]] — Locked architectural & product semantics (Implemented vs. Decided / Not Implemented).
- [[Personas and Contexts]] — Shared execution engine with contextual extensions (Student, Professor, Developer, Knowledge Worker).

---

## 02. Architecture
- [[System Architecture]] — Client-server boundaries, technology stack, and macro system flow.
- [[Frontend Architecture]] — React 19, Vite, routing tree, route-persistent runtime, state hierarchy.
- [[Backend Architecture]] — Express API, layered Controller-Service-Model architecture, middleware chain.
- [[Data Model]] — Complete MongoDB / Mongoose schema specifications, entity relations, and invariants.
- [[State Ownership]] — Authoritative sources of truth across memory, local storage, and database.
- [[API Architecture]] — RESTful endpoint catalogue, serialization contracts, and payload schemas.
- [[Adaptive Intelligence Architecture]] — Behavioral signal inventory, derived features, deterministic and statistical adaptation layers.

---

## 03. Features
- [[Authentication]] — JWT cookies, bcrypt hashing, email OTP verification, password reset flows.
- [[Profile]] — User identity management, security boundaries, allowlisted fields.
- [[Settings]] — User preferences, scoped configuration, theme engine, retired legacy options.
- [[Today]] — Execution command center, Next Action derivation, planned work filtering, progress metrics.
- [[Tasks]] — Task entity lifecycle, ordering, priorities, date semantics, limitations.
- [[Goals]] — Strategic milestones, task association, and hierarchy.
- [[Planner]] — Date-based work allocation, backlog triage, quick task capture, note scratchpads.
- [[Timeline]] — Planned time management, schedule blocks, drag-and-drop mechanics, Task vs. ScheduleBlock.
- [[Focus]] — Focus execution interface, workspace modes (Standard, Zen, Custom), distraction tracking.
- [[Focus Runtime]] — Authoritative state machine (`focusReducer`), pure timer clock (`WallClockTimer`), persistence queue.
- [[Sessions]] — Focus session entity, segment progression, pause accounting, completion semantics.
- [[Session Review]] — Post-session reflection, mood and focus depth scoring, distraction analysis, discard flow.
- [[Notes]] — Scratchpad and knowledge capture, task-context linking, auto-save pipeline.
- [[Streaks and Daily Stats]] — Habit consistency engine, freeze mechanism, evaluation thresholds, known date mismatch.

---

## 04. Behavioral Model
- [[Current Behavioral Model]] — Concrete scenarios tracing Athena's exact runtime behavior today.
- [[Task Lifecycle]] — Creation to completion states, deletion, absence of automated completion.
- [[Planning Model]] — Planned date vs. due date, backlog management, overdue handling semantics.
- [[Schedule Model]] — Allocating time vs. doing work, conflict handling, session binding.
- [[Focus Behavior]] — Session execution rules, segment partitions, pause handling, early stopping.
- [[Session Lifecycle]] — Start → Active → Paused → Completed / Abandoned state transitions.
- [[Daily Outcome Model]] — Success, partial, failed, and freeze-saved evaluations.
- [[Behavioral Data]] — Observable telemetry today vs. future analytical requirements.

---

## 05. Engineering
- [[Security]] — Authentication guards, mass-assignment prevention, multi-tenant ID isolation.
- [[Persistence and Recovery]] — Route persistence, crash/reload recovery, serialized write queues.
- [[Multi Account Isolation]] — Namespaced storage keys (`getUserScopedKey`), cross-account contamination defense.
- [[Developer CLI Tools]] — Local database utilities for administrative role management (`set-admin`, `set-user`).
- [[Testing]] — Vitest test suites, pure reducer verification, timer clock accuracy tests.
- [[Known Issues]] — Documented system limitations, unpopulated fields, and semantic mismatches.

---

## 06. Roadmap
- [[Roadmap]] — Development status: DONE, CURRENT, and NEXT phases.
- [[History]] — Work history specifications and chronological aggregation.
- [[Insights]] — Algorithmic interpretation of behavioral telemetry.
- [[Data Collection Audit]] — Required audit before domain model finalization.
- [[AI Direction]] — Data prerequisites, adaptive planning rules, and ML boundaries.
