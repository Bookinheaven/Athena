import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Palette, Monitor, Zap } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

const ThemeCard = ({ item, isSelected, onSelect }) => {
  const isLight = item.id === "light";
  const isSystem = item.id === "system";
  const checkIconColor = item.id === "vercel" ? "#000000" : "#ffffff";

  return (
    <motion.button
      type="button"
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      onClick={() => onSelect(item.id)}
      aria-label={`Select theme ${item.name}`}
      className={`group relative text-left p-0 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isSelected
          ? "border-primary shadow-xl shadow-primary/20 ring-2 ring-primary/60"
          : isLight
          ? "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
          : "border-white/10 hover:border-white/25 hover:shadow-lg"
      }`}
      style={{
        background: isSystem
          ? "linear-gradient(145deg, #18181b 0%, #101012 100%)"
          : item.color,
      }}
    >
      {/* Workspace miniature preview */}
      <div className="relative h-28 w-full overflow-hidden select-none">
        {isSystem ? (
          /* Dual Adaptive Preview for System Default */
          <div className="absolute inset-0 flex">
            {/* Left dark side */}
            <div className="w-1/2 h-full bg-[#0c0d12] relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-7 bg-[#14151b] border-r border-white/5 flex flex-col items-center pt-2.5 gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-indigo-500 shadow-sm" />
                <div className="w-2.5 h-1 rounded-full bg-indigo-400/40" />
                <div className="w-2.5 h-1 rounded-full bg-indigo-400/25" />
              </div>
              <div className="absolute inset-0 left-7 p-2 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-6 rounded-full bg-white/30" />
                </div>
                <div className="h-8 rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-1.5 flex flex-col justify-between">
                  <div className="h-1 w-5 rounded-full bg-indigo-400/60" />
                  <div className="h-2.5 w-4 rounded-sm bg-indigo-500 text-[6px] font-bold text-white flex items-center justify-center">
                    25
                  </div>
                </div>
                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-indigo-500 rounded-full" />
                </div>
              </div>
            </div>
            {/* Right light side */}
            <div className="w-1/2 h-full bg-[#f8fafc] border-l border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-end">
                  <div className="h-1 w-6 rounded-full bg-zinc-300" />
                </div>
                <div className="h-8 rounded-lg bg-white border border-zinc-200/80 shadow-xs p-1.5 flex flex-col justify-between">
                  <div className="h-1 w-5 rounded-full bg-zinc-300" />
                  <div className="h-2.5 w-4 rounded-sm bg-indigo-600 text-[6px] font-bold text-white flex items-center justify-center">
                    25
                  </div>
                </div>
                <div className="h-1 w-full rounded-full bg-zinc-200 overflow-hidden">
                  <div className="h-full w-2/3 bg-indigo-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar strip */}
            <div
              className="absolute inset-y-0 left-0 w-8 flex flex-col items-center pt-2.5 pb-2 gap-1.5 transition-colors"
              style={{
                background: isLight ? "#f4f4f5" : `${item.color}ea`,
                borderRight: isLight ? "1px solid rgba(0,0,0,0.08)" : `1px solid ${item.accent}24`,
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-md mb-0.5 shadow-xs"
                style={{ background: item.accent }}
              />
              {[0.7, 0.45, 0.3].map((op, i) => (
                <div
                  key={i}
                  className="w-2.5 h-1 rounded-full"
                  style={{
                    background: isLight ? "#71717a" : item.accent,
                    opacity: isLight ? op * 0.7 : op,
                  }}
                />
              ))}
              <div
                className="mt-auto w-2.5 h-2.5 rounded-full"
                style={{
                  background: isLight ? "#a1a1aa" : `${item.accent}60`,
                }}
              />
            </div>

            {/* Main workspace area */}
            <div className="absolute inset-0 left-8 p-2.5 flex flex-col justify-between">
              {/* Header element */}
              <div className="flex items-center justify-between">
                <div
                  className="h-1.5 w-14 rounded-full"
                  style={{
                    background: isLight ? "rgba(0,0,0,0.14)" : `${item.accent}50`,
                  }}
                />
                <div
                  className="h-3.5 w-3.5 rounded-full border shadow-xs"
                  style={{
                    background: item.accent,
                    borderColor: isLight ? "rgba(0,0,0,0.1)" : `${item.accent}40`,
                  }}
                />
              </div>

              {/* Cards row */}
              <div className="grid grid-cols-2 gap-1.5">
                {/* Active Focus Card */}
                <div
                  className="h-8.5 rounded-lg p-1.5 flex flex-col justify-between shadow-xs"
                  style={{
                    background: isLight
                      ? "rgba(99,102,241,0.08)"
                      : `${item.accent}18`,
                    border: isLight
                      ? "1px solid rgba(99,102,241,0.22)"
                      : `1px solid ${item.accent}30`,
                  }}
                >
                  <div
                    className="h-1 w-7 rounded-full"
                    style={{
                      background: isLight ? "#6366f1" : `${item.accent}90`,
                    }}
                  />
                  <div
                    className="h-2.5 w-4 rounded-sm font-bold text-[6px] flex items-center justify-center shadow-xs"
                    style={{
                      background: item.accent,
                      color: isLight ? "#ffffff" : (item.id === "vercel" ? "#000000" : "#ffffff"),
                    }}
                  >
                    <span>25</span>
                  </div>
                </div>

                {/* Secondary Task Card */}
                <div
                  className="h-8.5 rounded-lg p-1.5 flex flex-col justify-between shadow-xs"
                  style={{
                    background: isLight ? "#ffffff" : "rgba(255,255,255,0.04)",
                    border: isLight ? "1px solid #e4e4e7" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-1 w-8 rounded-full"
                    style={{
                      background: isLight ? "#a1a1aa" : "rgba(255,255,255,0.3)",
                    }}
                  />
                  <div
                    className="h-1 w-5 rounded-full"
                    style={{
                      background: isLight ? "#cbd5e1" : "rgba(255,255,255,0.15)",
                    }}
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{
                  background: isLight ? "#e4e4e7" : "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="h-full rounded-full w-3/5 transition-all duration-300"
                  style={{ background: item.accent }}
                />
              </div>
            </div>
          </>
        )}

        {/* Selection overlay shimmer */}
        {isSelected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${item.accent}20 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Info footer bar */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2 border-t transition-colors"
        style={{
          background: isLight ? "#ffffff" : (isSystem ? "#141417" : `${item.color}fa`),
          borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Dual-swatch / Indicator badge */}
          <div
            className={`w-4.5 h-4.5 rounded-md shrink-0 relative overflow-hidden shadow-inner ${
              isLight ? "border border-zinc-300" : "border border-white/15"
            }`}
            style={{
              background: isSystem
                ? "linear-gradient(135deg, #09090b 50%, #ffffff 50%)"
                : item.color,
            }}
          >
            {!isSystem && (
              <div
                className="absolute top-0 right-0 w-2.5 h-full"
                style={{ background: item.accent }}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[11.5px] font-semibold leading-tight truncate ${
                  isLight ? "text-zinc-900" : "text-zinc-100"
                }`}
              >
                {item.name}
              </span>
              {item.isPremium && (
                <span
                  className="text-[8px] font-mono font-bold px-1 py-0.2 rounded shrink-0 uppercase tracking-wide"
                  style={{
                    background: `${item.accent}22`,
                    color: item.accent,
                    border: `1px solid ${item.accent}45`,
                  }}
                >
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Check Indicator */}
        <div
          className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
            isSelected
              ? "scale-105 shadow-sm"
              : isLight
              ? "border-zinc-300 bg-transparent group-hover:border-zinc-400"
              : "border-white/20 bg-transparent group-hover:border-white/40"
          }`}
          style={{
            background: isSelected ? item.accent : "transparent",
            borderColor: isSelected ? item.accent : undefined,
          }}
        >
          {isSelected && (
            <Check
              size={9.5}
              strokeWidth={3.5}
              style={{ color: checkIconColor }}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default function ThemeSelectorModal() {
  const { theme, setTheme, showThemeModal, setShowThemeModal, availableThemes } = useTheme();

  const freeThemes = availableThemes?.filter((t) => !t.isPremium) || [];
  const proThemes = availableThemes?.filter((t) => t.isPremium) || [];

  const activeTheme = availableThemes?.find((t) => t.id === theme);

  return (
    <AnimatePresence>
      {showThemeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowThemeModal(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-background border border-border/70 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col select-none"
            style={{ maxHeight: "88vh" }}
          >
            {/* Gradient accent bar at top */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{
                background: activeTheme
                  ? `linear-gradient(90deg, transparent, ${activeTheme.accent}80, transparent)`
                  : "linear-gradient(90deg, transparent, hsl(var(--primary))80, transparent)",
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Palette size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight leading-none">
                    Workspace Theme
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                    {availableThemes?.length} themes — changes apply instantly
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Active theme pill */}
                {activeTheme && (
                  <motion.div
                    key={activeTheme.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium"
                    style={{
                      background: `${activeTheme.accent}15`,
                      borderColor: `${activeTheme.accent}35`,
                      color: activeTheme.accent,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: activeTheme.accent }}
                    />
                    {activeTheme.name}
                  </motion.div>
                )}

                <button
                  onClick={() => setShowThemeModal(false)}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground cursor-pointer border border-transparent hover:border-border/60"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-5">
              {/* Free / Standard themes - 4 items neatly balanced in 4 columns */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Standard
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {freeThemes.map((item) => (
                    <ThemeCard
                      key={item.id}
                      item={item}
                      isSelected={theme === item.id}
                      onSelect={setTheme}
                    />
                  ))}
                </div>
              </div>

              {/* Pro themes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider">
                    Pro Collection
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/25 uppercase tracking-wide">
                    Unlocked
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                  {proThemes.map((item) => (
                    <ThemeCard
                      key={item.id}
                      item={item}
                      isSelected={theme === item.id}
                      onSelect={setTheme}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between gap-4 shrink-0 bg-background/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  Saved to your account automatically
                </span>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-5 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm shrink-0"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
