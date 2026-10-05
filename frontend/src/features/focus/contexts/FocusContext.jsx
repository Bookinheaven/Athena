import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useFocusSettings } from '../hooks/useFocusSettings.js';
import { useFocusRuntime } from '../hooks/useFocusRuntime.js';
import { PHASES } from '../runtime/constants.js';
import sessionService from '@services/sessionService.js';

const FocusContext = createContext(null);

export function FocusProvider({ children, initialContext }) {
  const { user } = useAuth();
  const userId = user?.id;

  const { settings, setSetting, saveSettingsToBackend, resetSettings } = useFocusSettings(userId);

  const handleSoundEvent = useCallback(({ event: soundEvent }) => {
    if (!settings.isSoundEnabled || !settings.soundOnTransition) return;
  }, [settings.isSoundEnabled, settings.soundOnTransition]);

  const runtime = useFocusRuntime({
    context: initialContext,
    settings,
    onSoundEvent: handleSoundEvent,
    userId,
  });

  const modifySettings = useCallback(
    async (changed) => {
      for (const [k, v] of Object.entries(changed)) {
        setSetting(k, v);
      }
      await saveSettingsToBackend(changed);
    },
    [setSetting, saveSettingsToBackend]
  );

  // Persistent Session Review State
  const [sessionReview, setSessionReview] = useState({
    mood: null,
    focus: null,
    distractions: '',
    taskOutcome: null,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Clear review state when transitioning to IDLE or a new active session
  const lastSessionIdRef = useRef(runtime.sessionId);
  useEffect(() => {
    if (runtime.sessionId !== lastSessionIdRef.current) {
      lastSessionIdRef.current = runtime.sessionId;
      if (runtime.phase === PHASES.IDLE || runtime.phase === PHASES.RUNNING) {
        setSessionReview({ mood: null, focus: null, distractions: '', taskOutcome: null });
        setIsSubmittingReview(false);
      }
    }
  }, [runtime.sessionId, runtime.phase]);

  const updateReview = useCallback((field, value) => {
    setSessionReview((p) => ({ ...p, [field]: value }));
  }, []);

  const toggleReviewDistraction = useCallback((distraction) => {
    setSessionReview((p) => {
      const current = (p.distractions || '')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      const lower = distraction.toLowerCase();
      const updated = current.includes(lower)
        ? current.filter((d) => d !== lower)
        : [...current, distraction];
      return { ...p, distractions: updated.join(', ') };
    });
  }, []);

  const submitSessionReview = useCallback(async () => {
    if (isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      await runtime.commands.forceSave();
      if (runtime.sessionId) {
        try {
          await sessionService.sessionFeedback({
            sessionId: runtime.sessionId,
            feedback: sessionReview,
          });
          try {
            window.dispatchEvent(
              new CustomEvent('athena:tasks-changed', {
                detail: { taskOutcome: sessionReview.taskOutcome },
              })
            );
          } catch { }
        } catch (err) {
          console.error('[FocusContext] Feedback save failed:', err);
        }
      }
      runtime.commands.stop();
      setSessionReview({ mood: null, focus: null, distractions: '', taskOutcome: null });
    } finally {
      setIsSubmittingReview(false);
    }
  }, [isSubmittingReview, runtime.commands, runtime.sessionId, sessionReview]);

  const value = useMemo(
    () => ({
      runtime,
      settings,
      setSetting,
      saveSettingsToBackend,
      resetSettings,
      modifySettings,
      userId,
      sessionReview,
      setSessionReview,
      updateReview,
      toggleReviewDistraction,
      submitSessionReview,
      isSubmittingReview,
    }),
    [
      runtime,
      settings,
      setSetting,
      saveSettingsToBackend,
      resetSettings,
      modifySettings,
      userId,
      sessionReview,
      updateReview,
      toggleReviewDistraction,
      submitSessionReview,
      isSubmittingReview,
    ]
  );

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return ctx;
}
