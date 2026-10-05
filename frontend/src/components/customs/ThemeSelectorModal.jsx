import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Palette, Monitor, Zap } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

const ThemeCard = ({ item, isSelected, onSelect }) => (
  <motion.button
    type="button"
    whileHover={{ y: -2, scale: 1.015 }}
    whileTap={{ scale: 0.97 }}
    transition={{ duration: 0.14, ease: "easeOut" }}
    onClick={() => onSelect(item.id)}
    aria-label={`Select theme ${item.name}`}
    className={`group relative text-left p-0 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      isSelected
        ? "border-primary shadow-lg shadow-primary/20 ring-1 ring-primary/60"
        : "border-white/8 hover:border-white/20 hover:shadow-md"
    }`}
    style={{ background: item.color }}
  >
    {/* Full workspace preview */}
    <div className="relative h-28 w-full overflow-hidden">
      {/* Sidebar strip */}
      <div
        className="absolute inset-y-0 left-0 w-9 flex flex-col items-center pt-2.5 pb-2 gap-1.5"
        style={{ background: `${item.color}e0`, borderRight: `1px solid ${item.accent}22` }}
      >
        <div
          className="w-4 h-4 rounded-md mb-1"
          style={{ background: item.accent }}
        />
        {[0.7, 0.5, 0.45, 0.35].map((op, i) => (
          <div
            key={i}
            className="w-3 h-1.5 rounded-full"
            style={{ background: `${item.accent}`, opacity: op }}
          />
        ))}
        <div className="mt-auto w-3 h-3 rounded-full" style={{ background: `${item.accent}60` }} />
      </div>

      {/* Main content */}
      <div className="absolute inset-0 left-9 p-2.5 flex flex-col gap-2">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <div className="h-1.5 w-16 rounded-full" style={{ background: `${item.accent}40` }} />
          <div className="h-4 w-4 rounded-full border" style={{ background: item.accent, borderColor: `${item.accent}40` }} />
        </div>

        {/* Card row */}
        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
          <div
            className="h-9 rounded-lg p-1.5 flex flex-col justify-between"
            style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}28` }}
          >
            <div className="h-1 w-8 rounded-full" style={{ background: `${item.accent}70` }} />
            <div className="h-3 w-5 rounded-sm font-bold text-[6px] flex items-center" style={{ background: item.accent, color: item.color }}>
              <span className="mx-auto">25</span>
            </div>
          </div>
          <div
            className="h-9 rounded-lg p-1.5 flex flex-col justify-between"
            style={{ background: `rgba(255,255,255,0.05)`, border: `1px solid rgba(255,255,255,0.08)` }}
          >
            <div className="h-1 w-10 rounded-full bg-white/25" />
            <div className="h-1 w-6 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full w-3/5" style={{ background: item.accent }} />
        </div>
      </div>

      {/* Selection overlay */}
      {isSelected && (
        <div
          className="absolute inset-0"
          style={{ background: `${item.accent}12` }}
        />
      )}
    </div>

    {/* Info row */}
    <div
      className="px-3 py-2.5 flex items-center justify-between gap-2 border-t"
      style={{
        background: `${item.color}f0`,
        borderColor: `${item.accent}20`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Dual-swatch */}
        <div
          className="w-5 h-5 rounded-md shrink-0 relative overflow-hidden border border-white/10"
          style={{ background: item.color }}
        >
          <div
            className="absolute top-0 right-0 w-2.5 h-5"
            style={{ background: item.accent }}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-[11px] font-bold leading-none truncate"
              style={{ color: `${item.accent}ee` }}
            >
              {item.name}
            </span>
            {item.isPremium && (
              <span
                className="text-[8px] font-mono font-black px-1 py-0.5 rounded shrink-0 uppercase tracking-wide"
                style={{ background: `${item.accent}25`, color: item.accent, border: `1px solid ${item.accent}40` }}
              >
                PRO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Check indicator */}
      <div
        className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
          isSelected ? "scale-110" : "scale-100 opacity-40 group-hover:opacity-70"
        }`}
        style={{
          background: isSelected ? item.accent : "transparent",
          borderColor: item.accent,
        }}
      >
        {isSelected && (
          <Check size={9} strokeWidth={3.5} style={{ color: item.color }} />
        )}
      </div>
    </div>
  </motion.button>
);

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
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-background border border-border/60 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col select-none"
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
              {/* Free themes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Monitor size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Standard
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
