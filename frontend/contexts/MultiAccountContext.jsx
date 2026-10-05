import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const MultiAccountContext = createContext();

export const useMultiAccount = () => {
  const context = useContext(MultiAccountContext);
  if (!context) {
    throw new Error("useMultiAccount must be used within a MultiAccountProvider");
  }
  return context;
};

export const MultiAccountProvider = ({ children }) => {
  const { user, switchSession } = useAuth();
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [switching, setSwitching] = useState(false);

  // Load saved accounts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("athena_saved_accounts");
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load saved accounts", error);
    }
  }, []);

  // When active user changes or logs in, update savedAccounts in localStorage
  useEffect(() => {
    const userId = user?.id;
    if (user && userId) {
      setSavedAccounts((prev) => {
        const existingIndex = prev.findIndex((acc) => (acc.id || acc._id) === userId);
        const token = localStorage.getItem(`athena_token_${userId}`) || prev[existingIndex]?.token || null;
        const newAccount = {
          id: userId,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          type: user.type,
          token,
          lastActive: Date.now(),
        };

        let updated;
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...newAccount };
        } else {
          updated = [...prev, newAccount];
        }

        try {
          localStorage.setItem("athena_saved_accounts", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save account to localStorage", err);
        }
        return updated;
      });
    }
  }, [user]);

  // Method to save token for an account
  const saveAccountToken = (userId, token) => {
    if (!userId || !token) return;
    try {
      localStorage.setItem(`athena_token_${userId}`, token);
      setSavedAccounts((prev) => {
        const updated = prev.map((acc) => ((acc.id || acc._id) === userId ? { ...acc, token } : acc));
        localStorage.setItem("athena_saved_accounts", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to save account token", err);
    }
  };

  // Clear token for an account (e.g. on logout)
  const clearAccountToken = (userId) => {
    if (!userId) return;
    try {
      localStorage.removeItem(`athena_token_${userId}`);
      setSavedAccounts((prev) => {
        const updated = prev.map((acc) => ((acc.id || acc._id) === userId ? { ...acc, token: null } : acc));
        localStorage.setItem("athena_saved_accounts", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Failed to clear account token", err);
    }
  };

  // Remove an account from saved list
  const removeAccount = (userId) => {
    setSavedAccounts((prev) => {
      const updated = prev.filter((acc) => (acc.id || acc._id) !== userId);
      try {
        localStorage.setItem("athena_saved_accounts", JSON.stringify(updated));
        localStorage.removeItem(`athena_token_${userId}`);
      } catch (err) {
        console.error("Failed to remove account from localStorage", err);
      }
      return updated;
    });
  };

  // Switch to another saved account
  const switchAccount = async (targetAccount) => {
    const targetId = targetAccount?.id || targetAccount?._id;
    const currentId = user?.id;
    if (!targetAccount || targetId === currentId) return { success: true };
    const token = targetAccount.token || localStorage.getItem(`athena_token_${targetId}`);
    
    if (!token) {
      return { success: false, requireLogin: true, email: targetAccount.email || targetAccount.username };
    }

    setSwitching(true);
    try {
      const res = await switchSession(token);
      if (!res?.success) {
        clearAccountToken(targetId);
        return { success: false, requireLogin: true, email: targetAccount.email || targetAccount.username };
      }
      const returnedToken = res?.token || token;
      saveAccountToken(targetId, returnedToken);
      return res;
    } catch (err) {
      const isAuthError =
        err?.message?.toLowerCase().includes("expired") ||
        err?.message?.toLowerCase().includes("invalid") ||
        err?.message?.toLowerCase().includes("session") ||
        err?.message?.toLowerCase().includes("token");

      if (isAuthError) {
        clearAccountToken(targetId);
      }
      return { success: false, requireLogin: true, email: targetAccount.email || targetAccount.username };
    } finally {
      setSwitching(false);
    }
  };

  const value = {
    savedAccounts,
    saveAccountToken,
    clearAccountToken,
    removeAccount,
    switchAccount,
    switching,
  };

  return <MultiAccountContext.Provider value={value}>{children}</MultiAccountContext.Provider>;
};

export default MultiAccountContext;
