import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import {
  Search,
  LayoutDashboard,
  BarChart2,
  User,
  Settings,
  Users,
  Keyboard,
  Moon,
  LogOut,
  Sparkles,
  CornerDownLeft,
  ArrowUpDown,
  Command as CommandIcon,
} from "lucide-react";

const CommandPalette = ({
  isOpen,
  onClose,
  onOpenAccountSwitcher,
  onOpenCheatSheet,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const itemRefs = useRef({});

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const allCommands = useMemo(() => {
    return [
      {
        id: "nav-dashboard",
        category: "Navigation",
        title: "Go to Dashboard",
        subtitle: "Overview of your workspace & metrics",
        icon: LayoutDashboard,
        shortcut: "G D",
        action: () => navigate("/dashboard"),
      },
      {
        id: "nav-analytics",
        category: "Navigation",
        title: "Go to Analytics",
        subtitle: "Deep dive into your focus trends",
        icon: BarChart2,
        shortcut: "G A",
        action: () => navigate("/analytics"),
      },
      {
        id: "nav-profile",
        category: "Navigation",
        title: "Go to Profile",
        subtitle: "View your streak and personal stats",
        icon: User,
        shortcut: "G P",
        action: () => navigate("/profile"),
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Go to Settings",
        subtitle: "Manage preferences and notifications",
        icon: Settings,
        shortcut: "G S",
        action: () => navigate("/settings"),
      },
      {
        id: "act-switch-acc",
        category: "System & Accounts",
        title: "Switch Account",
        subtitle: "Jump between saved Athena sessions",
        icon: Users,
        shortcut: "⌥S",
        action: () => {
          if (onOpenAccountSwitcher) onOpenAccountSwitcher();
        },
      },
      {
        id: "act-cheat-sheet",
        category: "System & Accounts",
        title: "Keyboard Shortcuts",
        subtitle: "View all quick navigation bindings",
        icon: Keyboard,
        shortcut: "?",
        action: () => {
          if (onOpenCheatSheet) onOpenCheatSheet();
        },
      },
      {
        id: "act-toggle-theme",
        category: "System & Accounts",
        title: "Toggle Appearance",
        subtitle: "Switch between Dark and Light mode",
        icon: Moon,
        shortcut: "⌥T",
        action: () => {
          if (onToggleTheme) {
            onToggleTheme();
          } else {
            document.documentElement.classList.toggle("dark");
          }
        },
      },
      {
        id: "act-logout",
        category: "System & Accounts",
        title: "Sign Out",
        subtitle: "Log out of current session",
        icon: LogOut,
        shortcut: "",
        action: async () => {
          await logout();
          navigate("/login");
        },
      },
    ];
  }, [navigate, logout, onOpenAccountSwitcher, onOpenCheatSheet, onToggleTheme]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands;
    const q = search.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [allCommands, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // Auto-scroll selected item into view when navigating with arrow keys
  useEffect(() => {
    const selectedCmd = filteredCommands[selectedIndex];
    if (selectedCmd && itemRefs.current[selectedCmd.id]) {
      itemRefs.current[selectedCmd.id].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex, filteredCommands]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        onClose();
        selected.action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const grouped = filteredCommands.reduce((acc, cmd) => {
    acc[cmd.category] = acc[cmd.category] || [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  let itemCounter = -1;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] p-4 bg-black/60 backdrop-blur-md select-none transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* Search Header */}
          <div className="relative flex items-center px-5 py-4 border-b border-neutral-200/70 dark:border-white/[0.08] gap-3.5 bg-neutral-50/50 dark:bg-[#16161c]">
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search workspace..."
              className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-0 border-0 font-medium p-0"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <kbd className="px-2 py-1 text-[10px] font-mono font-semibold bg-white dark:bg-white/[0.07] text-neutral-500 dark:text-neutral-400 rounded-md border border-neutral-200/80 dark:border-white/10 shadow-2xs">
                ESC
              </kbd>
            </div>
          </div>

          {/* Command List */}
          <div className="max-h-[360px] overflow-y-auto p-2.5 space-y-4 divide-y divide-neutral-100 dark:divide-white/[0.04]">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-white/[0.05] flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    No commands found
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Try searching for a different keyword or page.
                  </p>
                </div>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items], groupIdx) => (
                <div key={category} className={groupIdx > 0 ? "pt-3 space-y-1" : "space-y-1"}>
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{category}</span>
                  </div>
                  {items.map((cmd) => {
                    itemCounter++;
                    const isSelected = itemCounter === selectedIndex;
                    const IconComponent = cmd.icon;
                    return (
                      <button
                        ref={(el) => (itemRefs.current[cmd.id] = el)}
                        key={cmd.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          cmd.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(allCommands.indexOf(cmd))}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                          isSelected
                            ? "bg-neutral-100 dark:bg-[#202026] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                              isSelected
                                ? "bg-blue-500 text-white shadow-sm shadow-blue-500/25"
                                : "bg-neutral-100 dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 group-hover:bg-neutral-200 dark:group-hover:bg-white/[0.1]"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isSelected
                                  ? "text-neutral-900 dark:text-white"
                                  : "text-neutral-800 dark:text-neutral-200"
                              }`}
                            >
                              {cmd.title}
                            </span>
                            <span
                              className={`text-[11px] truncate mt-0.5 ${
                                isSelected
                                  ? "text-neutral-500 dark:text-neutral-400"
                                  : "text-neutral-400 dark:text-neutral-500"
                              }`}
                            >
                              {cmd.subtitle}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-white/10 border border-neutral-200/80 dark:border-white/10 px-2 py-0.5 rounded-md shadow-2xs">
                              <span>Select</span>
                              <CornerDownLeft className="w-2.5 h-2.5 text-blue-500" />
                            </span>
                          )}
                          {cmd.shortcut && (
                            <kbd
                              className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded border shadow-2xs ${
                                isSelected
                                  ? "bg-white dark:bg-[#16161a] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-white/15"
                                  : "bg-neutral-100 dark:bg-white/[0.07] text-neutral-500 dark:text-neutral-400 border-neutral-200/80 dark:border-white/10"
                              }`}
                            >
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-neutral-50/80 dark:bg-[#0e0e12] border-t border-neutral-200/70 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3 h-3 text-neutral-400" />
                <span>Execute</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
              <CommandIcon className="w-3 h-3" />
              <span>Athena Desktop</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
