import { useEffect, useRef, useState, useCallback } from "react";

export const useAutoSaveSession = ({
  buildPayload,
  saveFunction,
  enabled = true,
  intervalMs = 60000,
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const isDirtyRef = useRef(false);
  const savingRef = useRef(false);
  const performSaveRef = useRef(null);

  // Mark dirty
  const markDirty = useCallback(() => {
    if (!enabled) return;
    setIsDirty(true);
    isDirtyRef.current = true;
  }, [enabled]);

  // Core save function
  const performSave = useCallback(async () => {
    if (!enabled) return;
    if (savingRef.current) return;
    if (!isDirtyRef.current) return;
    const payload = buildPayload();
    console.log("Save: ", payload);
    if (!payload) return;

    savingRef.current = true;
    setSaveStatus("saving");

    try {
      await saveFunction(payload);
      setSaveStatus("saved");
      setIsDirty(false);
      isDirtyRef.current = false;
    } catch (err) {
      console.error("Auto save failed:", err);
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [enabled, buildPayload, saveFunction]);

  // Keep latest save function in ref (prevents interval reset)
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Debounce save (2 seconds after change)
  useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      performSaveRef.current?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isDirty]);

  useEffect(() => {
    if (saveStatus !== "saved") return;

    const timeout = setTimeout(() => {
      setSaveStatus("idle");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [saveStatus]);

  // Stable interval save
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        performSaveRef.current?.();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs]);

  return {
    markDirty,
    saveStatus,
    forceSave: performSave,
  };
};
