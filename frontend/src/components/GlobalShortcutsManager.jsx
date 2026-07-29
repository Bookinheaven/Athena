import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShortcuts } from "@/hooks/useShortcuts";
import CommandPalette from "@/components/CommandPalette";
import ShortcutsCheatSheet from "@/components/ShortcutsCheatSheet";
import AccountSwitcherModal from "@/components/AccountSwitcherModal";
import { useTheme } from "@contexts/ThemeContext";
import { useAuth } from "@contexts/AuthContext";

const GlobalShortcutsManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showPalette, setShowPalette] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [pendingG, setPendingG] = useState(false);
  const { toggleTheme } = useTheme();

  const isAuthPage =
    [
      "/login",
      "/register",
      "/verify-email",
      "/forgot-password",
      "/reset-password",
      "/",
    ].includes(location.pathname) || !user;

  // Reset sequential G key timeout after 1.5 seconds
  useEffect(() => {
    if (!pendingG) return;
    const timer = setTimeout(() => setPendingG(false), 1500);
    return () => clearTimeout(timer);
  }, [pendingG]);

  // Handle sequential G -> [key] navigation
  useEffect(() => {
    const handleSeqKey = (e) => {
      if (isAuthPage) return;
      const target = e.target;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInput) return;

      if (!pendingG) {
        if (
          e.key.toLowerCase() === "g" &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !e.shiftKey
        ) {
          setPendingG(true);
        }
      } else {
        const key = e.key.toLowerCase();
        if (key === "d") {
          e.preventDefault();
          navigate("/dashboard");
          setPendingG(false);
        } else if (key === "a") {
          e.preventDefault();
          navigate("/analytics");
          setPendingG(false);
        } else if (key === "p") {
          e.preventDefault();
          navigate("/profile");
          setPendingG(false);
        } else if (key === "s") {
          e.preventDefault();
          navigate("/settings");
          setPendingG(false);
        } else if (e.key === "Escape") {
          setPendingG(false);
        } else {
          setPendingG(false);
        }
      }
    };
    window.addEventListener("keydown", handleSeqKey);
    return () => window.removeEventListener("keydown", handleSeqKey);
  }, [pendingG, navigate, isAuthPage]);

  useShortcuts({
    disabled: isAuthPage,
    onToggleCommandPalette: () => {
      setShowPalette((prev) => !prev);
      setShowCheatSheet(false);
    },
    onToggleCheatSheet: () => {
      setShowCheatSheet((prev) => !prev);
      setShowPalette(false);
    },
    onEscape: () => {
      if (showPalette) setShowPalette(false);
      if (showCheatSheet) setShowCheatSheet(false);
      if (showSwitcher) setShowSwitcher(false);
      if (pendingG) setPendingG(false);
    },
    customShortcuts: [
      {
        key: "s",
        alt: true,
        action: () => setShowSwitcher(true),
      },
      {
        key: "t",
        alt: true,
        action: () => {
          if (toggleTheme) toggleTheme();
        },
      },
    ],
  });

  if (isAuthPage) return null;

  return (
    <>
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onOpenAccountSwitcher={() => setShowSwitcher(true)}
        onOpenCheatSheet={() => setShowCheatSheet(true)}
        onToggleTheme={toggleTheme}
      />
      <ShortcutsCheatSheet
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
      />
      <AccountSwitcherModal
        isOpen={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />
      {pendingG && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/95 dark:bg-[#131317]/95 backdrop-blur-xl text-neutral-900 dark:text-white text-xs font-mono px-4 py-2.5 rounded-xl border border-neutral-200/80 dark:border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-sans font-medium text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Jump mode:</span>
            <div className="flex items-center gap-1 font-mono">
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/[0.08] rounded text-blue-500 font-bold">G</kbd>
              <span className="text-neutral-400">then</span>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/[0.08] rounded text-neutral-800 dark:text-neutral-200">D</kbd>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/[0.08] rounded text-neutral-800 dark:text-neutral-200">A</kbd>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/[0.08] rounded text-neutral-800 dark:text-neutral-200">P</kbd>
              <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-white/[0.08] rounded text-neutral-800 dark:text-neutral-200">S</kbd>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalShortcutsManager;
