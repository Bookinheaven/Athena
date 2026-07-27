import { useEffect } from "react";

export const useShortcuts = ({
  onToggleCommandPalette,
  onToggleCheatSheet,
  onEscape,
  customShortcuts = [],
  disabled = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (disabled) return;
      const target = event.target;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape key closes modals
      if (event.key === "Escape") {
        if (onEscape) onEscape(event);
        return;
      }

      // Cmd+K or Ctrl+K for Command Palette (works globally even in inputs)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (onToggleCommandPalette) onToggleCommandPalette(event);
        return;
      }

      // Ignore single character shortcuts when typing in inputs/textareas
      if (isInput) return;

      // ? key triggers Shortcuts Cheat Sheet
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        if (onToggleCheatSheet) onToggleCheatSheet(event);
        return;
      }

      // Execute custom shortcuts
      for (const shortcut of customShortcuts) {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.metaKey || event.ctrlKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          if (shortcut.action) shortcut.action(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCommandPalette, onToggleCheatSheet, onEscape, customShortcuts, disabled]);
};

export default useShortcuts;
