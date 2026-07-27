import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command, Navigation, Sparkles } from "lucide-react";

const shortcutsList = [
  {
    category: "Global & System",
    icon: Command,
    items: [
      { label: "Open Command Palette", key: "⌘K / Ctrl+K", desc: "Access all commands quickly" },
      { label: "Toggle Keyboard Shortcuts", key: "?", desc: "Show this reference guide" },
      { label: "Close Modals / Menus", key: "ESC", desc: "Dismiss active overlay" },
      { label: "Switch Account", key: "⌥S / Alt+S", desc: "Open session manager" },
      { label: "Toggle Appearance", key: "⌥T / Alt+T", desc: "Switch Light & Dark mode" },
    ],
  },
  {
    category: "Quick Navigation",
    icon: Navigation,
    items: [
      { label: "Go to Dashboard", key: "G D", desc: "Press G then D sequentially" },
      { label: "Go to Analytics", key: "G A", desc: "Press G then A sequentially" },
      { label: "Go to Profile", key: "G P", desc: "Press G then P sequentially" },
      { label: "Go to Settings", key: "G S", desc: "Press G then S sequentially" },
    ],
  },
];

const ShortcutsCheatSheet = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none transition-opacity"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 380 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white/95 dark:bg-[#131317]/95 backdrop-blur-2xl border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200/70 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-neutral-50/50 via-transparent to-neutral-50/50 dark:from-white/[0.02] dark:to-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Keyboard Shortcuts
                </h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Quick bindings to navigate and manage your session
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-6 divide-y divide-neutral-100 dark:divide-white/[0.04]">
            {shortcutsList.map((group, groupIdx) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.category} className={groupIdx > 0 ? "pt-5 space-y-3" : "space-y-3"}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <GroupIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{group.category}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/[0.04] hover:bg-neutral-100/60 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            {item.desc}
                          </span>
                        </div>
                        <kbd className="px-2.5 py-1 bg-white dark:bg-white/[0.08] border border-neutral-200/80 dark:border-white/10 rounded-md text-[10px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 shadow-2xs shrink-0">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-neutral-50/80 dark:bg-black/40 border-t border-neutral-200/70 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Pro tip: Press <kbd className="font-mono text-neutral-600 dark:text-neutral-300 font-semibold">?</kbd> anywhere to summon this guide</span>
            </div>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShortcutsCheatSheet;
