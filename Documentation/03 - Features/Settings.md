# Settings

Athena provides a consolidated settings module organized into functional categories, backed by local user-scoped storage and persistent profile settings.

---
## Setting Categories

```text
Settings/
├── Appearance        # Theme selection, visual tokens, mode preview
├── Focus             # Break duration, interval defaults, transition sounds
└── Notifications     # Sound alerts, desktop notification permissions
```

### 1. Appearance (`AppearanceSettings.jsx`)
- Supports 12 curated themes (System, Light, Vercel Monochrome, Obsidian Dark, Midnight Cyber, Cyberpunk, Nord, Forest, Sunset, Solarized, Dracula, Monokai, Amethyst, Coffee).
- Direct application of `data-theme` on the root document element.
- Dual-write persistence: user-scoped `localStorage` for zero-FOUC client reloads and `PATCH /api/user/settings` for cross-device synchronization.

### 2. Focus (`FocusSettings.jsx`)
- Configures default session parameters stored in `User.settings.session`:
  - `breakDuration`: Default rest interval in seconds (default: 300 / 5 min).
  - `breaksNumber`: Target focus intervals before a long break (default: 4).
  - `autoStartBreaks`: Boolean controlling automatic transition into rest periods.
  - `isSoundEnabled` & `soundOnTransition`: Audio feedback at interval boundaries.
  - `confirmReset`: Protection prompt before resetting an active session.

### 3. Notifications
- Configures web and electron notification dispatch permissions for session alerts.
