# Multi Account Isolation

On workstations where multiple users log into Athena sequentially or switch accounts via `MultiAccountContext`, cross-account data contamination is prevented through multi-tenant namespacing.

---

## LocalStorage Key Namespacing (`userStateService.js`)

All client-side persistent storage calls must pass through `getUserScopedKey(key, userId)`:

$$\text{ScopedKey} = \text{key} + \text{"\_"} + \text{userId}$$

### Concrete Storage Keys:
- Theme: `athena_theme_${userId}`
- Sidebar State: `athena_sidebar_collapsed_${userId}`
- Workspace Mode: `focus_workspace_mode_v3_${userId}`
- Custom Layout: `focus_custom_layout_v3_${userId}`
- Sound Preferences: `focus_sound_enabled_${userId}`

---

## Account Switch Protocol

When a user switches accounts:
1. `MultiAccountContext` updates active authentication credentials.
2. `ThemeContext` detects `userId` change via `currentUserIdRef`. It flushes in-memory theme state and reads `athena_theme_${newUserId}`, updating CSS variables immediately.
3. `FocusContext` checks if an active session belongs to the previous user; if so, in-memory execution state is wiped clean.
4. `uiStore` re-reads sidebar preferences for the incoming user ID.
5. Zero UI layout preferences or active session fragments carry over to the new user.
