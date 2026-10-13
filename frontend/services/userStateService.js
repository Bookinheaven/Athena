import { usePlannerStore } from "../src/stores/plannerStore.js";

export const normalizeUser = (user) => {
  if (!user) return null;
  const id = user.id || user._id;
  const normalizedId = id ? String(id) : undefined;
  const effectiveRole = user.accountType || user.type || "user";
  return {
    ...user,
    id: normalizedId,
    type: effectiveRole,
    accountType: effectiveRole,
  };
};

export const clearUserTransientState = () => {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("sessionData") ||
          key.startsWith("sessionStats") ||
          key.startsWith("sessionReview"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    try {
      usePlannerStore.getState?.().reset?.();
    } catch {}
  } catch (err) {
    console.error("Failed to clear transient user state:", err);
  }
};

export const getUserScopedKey = (baseKey, userId) => {
  if (!userId) return baseKey;
  return `${baseKey}_${userId}`;
};
