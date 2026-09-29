# Focus

The Focus module (`/focus-page`) provides an isolated, distraction-minimized workstation for deep work execution.

---
## Workspace Modes

Focus offers three distinct UI presentation modes stored in user-scoped `localStorage` (`focus_workspace_mode_v3_${userId}`):

```text
Focus Workspace/
├── Standard Workspace     # Centered timer, task card, quick drawer toggles
├── Zen Workspace          # Extreme minimalism: countdown, task, and core controls only
└── Custom Workspace       # Multi-pane modular grid (Timer, Scratchpad, Checklist, Progress)
```

1. **Standard Workspace (`StandardWorkspace.jsx`):**
   - Clean, centered execution view with [[Session Review]] integration.
   - Quick-access drawer toggles for Checklist, Scratchpad Notes, Progress, Settings, and Distraction logging.
2. **Zen Workspace (`ZenWorkspace.jsx`):**
   - Strips all auxiliary chrome, drawers, and secondary metrics.
   - Retains only the primary timer display, current task title, and Play/Pause/Stop actions.
3. **Custom Workspace (`CustomWorkspace.jsx`):**
   - 4-quadrant layout with user-customizable widgets.
   - Stores layout coordinates in `focus_custom_layout_v3_${userId}`.

---
## Distraction Tracking

Users can log micro-distractions in real-time during an active session via the distraction drawer or modal:
- **Preset Categories:** Phone, Messages, People, Noise, Web Browsing, Mind Wandering.
- **Counter:** Each toggle increments `sessionStats.interruptions`.
- **Review Pre-Population:** Distraction categories selected during the session automatically pre-populate chips in the [[Session Review]] modal.
