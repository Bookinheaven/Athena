// ─────────────────────────────────────────────────────────────────────────────
// useFocusSettings
//
// User-scoped session settings hook.
//
// Fixes the existing bug where settings keys (breakDuration, etc.) were stored
// without a user prefix, causing them to be shared across accounts on the same
// device.
//
// All keys are namespaced with userId via getUserScopedKey().
// Settings are fetched from the backend on mount and persisted to localStorage
// as a local cache only.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { getUserScopedKey } from '../../../../services/userStateService.js';
import userService from '../../../../services/userService.js';

const DEFAULTS = {
  breakDuration:     5 * 60,  // seconds
  autoStartBreaks:   true,
  breaksNumber:      4,
  skipBreaks:        false,
  confirmReset:      true,
  soundOnTransition: true,
  isSoundEnabled:    true,
};

function readLocal(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

/**
 * @param {string | undefined} userId
 * @returns {{
 *   settings: object,
 *   setSetting: (key: string, value: any) => void,
 *   saveSettingsToBackend: (changed: object) => Promise<void>,
 *   isLoading: boolean,
 * }}
 */
export function useFocusSettings(userId) {
  const [isLoading, setIsLoading] = useState(true);

  // Build a scoped settings object from localStorage using user-prefixed keys
  const [settings, setSettings] = useState(() => {
    const result = {};
    for (const [k, def] of Object.entries(DEFAULTS)) {
      const scopedKey  = getUserScopedKey(k, userId);
      result[k] = readLocal(scopedKey, def);
    }
    return result;
  });

  // Fetch from backend on mount and update both state and localStorage
  useEffect(() => {
    if (!userId) return;

    userService.getSettings('session')
      .then((res) => {
        if (!res?.settings) return;
        const s = res.settings;
        const merged = {};
        for (const [k, def] of Object.entries(DEFAULTS)) {
          const val        = s[k] ?? def;
          const scopedKey  = getUserScopedKey(k, userId);
          writeLocal(scopedKey, val);
          merged[k] = val;
        }
        setSettings(merged);
      })
      .catch((err) => {
        console.error('[useFocusSettings] Backend settings fetch failed:', err);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const setSetting = useCallback((key, value) => {
    const scopedKey = getUserScopedKey(key, userId);
    writeLocal(scopedKey, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, [userId]);

  const saveSettingsToBackend = useCallback(async (changed) => {
    try {
      await userService.updateSettings(changed, 'session');
    } catch (err) {
      console.error('[useFocusSettings] Backend settings save failed:', err);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await userService.resetSettings('session');
      const s = res?.settings || DEFAULTS;
      const merged = {};
      for (const [k, def] of Object.entries(DEFAULTS)) {
        const val = s[k] ?? def;
        const scopedKey = getUserScopedKey(k, userId);
        writeLocal(scopedKey, val);
        merged[k] = val;
      }
      setSettings(merged);
      return merged;
    } catch (err) {
      console.error('[useFocusSettings] Reset failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { settings, setSetting, saveSettingsToBackend, resetSettings, isLoading };
}

