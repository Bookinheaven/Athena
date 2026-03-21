import { useEffect, useRef, useState, useCallback } from "react";

export const useAutoSaveSession = ({
  buildPayload,
  saveFunction,
  enabled = true,
  intervalMs = 60000,
  allowedWhenDisabled = [],
}) => {
  const [saveStatus, setSaveStatus] = useState("idle");
  const dirtyCountRef = useRef(0);
  const [dirtyTick, setDirtyTick] = useState(0);

  // Queue of dirty update types
  const dirtyTypesRef = useRef(new Set());
  const savingRef = useRef(false);

  // Keep latest save function without resetting interval
  const performSaveRef = useRef(null);

  const markDirty = useCallback(
    (type) => {
      if (!enabled && !allowedWhenDisabled.includes(type)) return;
      dirtyTypesRef.current.add(type);
      dirtyCountRef.current += 1;
      setDirtyTick(dirtyCountRef.current);
    },
    [enabled, allowedWhenDisabled],
  );

  const performSave = useCallback(async () => {
    if (savingRef.current) return;
    const dirtyTypes = Array.from(dirtyTypesRef.current);
    if (!dirtyTypes.length) return;
    savingRef.current = true;
    setSaveStatus("saving");

    try {
      for (const type of dirtyTypes) {
        if (!enabled && !allowedWhenDisabled.includes(type)) continue;
        const payload = buildPayload(type);
        if (!payload) continue;
        // console.log("Autosave:", type, payload);
        await saveFunction(payload);
      }

      // Clear queue after successful save
      dirtyTypesRef.current.clear();
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto save failed:", err);
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [enabled, allowedWhenDisabled, buildPayload, saveFunction]);

  // Keep latest save function without resetting interval
  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Debounce save (2s)
  useEffect(() => {
    if (dirtyTick === 0) return;
    const timeout = setTimeout(() => {
      performSaveRef.current?.();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [dirtyTick]);

  // Reset UI save status
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timeout = setTimeout(() => {
      if (dirtyTypesRef.current.size === 0) {
        setSaveStatus("idle");
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [saveStatus]);

  // Interval fallback save
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyTypesRef.current.size > 0) {
        performSaveRef.current?.();
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  // Force save
  const forceSave = useCallback(async () => {
    await performSave();
  }, [performSave]);

  return {
    markDirty,
    saveStatus,
    forceSave,
  };
};
