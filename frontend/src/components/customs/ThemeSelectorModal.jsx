import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Palette } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

export default function ThemeSelectorModal() {
  const { theme, setTheme, showThemeModal, setShowThemeModal, availableThemes } = useTheme();

  if (!showThemeModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowThemeModal(false)}
          className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-card-background border border-card-border p-6 sm:p-8 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden font-sans select-none max-h-[88vh] flex flex-col text-text-primary"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-5 border-b border-border-primary shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-button-primary/10 border border-button-primary/20 flex items-center justify-center text-button-primary shadow-xs shrink-0">
                <Palette size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                    Appearance & Themes
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-button-primary/10 border border-button-primary/20 text-button-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles size={11} /> PRO Studio
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-mono mt-0.5">
                  Select a tailored color palette to customize your Athena workspace
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowThemeModal(false)}
              className="p-2.5 hover:bg-background-secondary rounded-2xl transition-colors text-text-muted hover:text-text-primary cursor-pointer border border-transparent hover:border-border-primary"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme Grid */}
          <div className="overflow-y-auto custom-scrollbar py-6 pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {availableThemes.map((item) => {
              const isSelected = theme === item.id;

              return (
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 overflow-hidden ${
                    isSelected
                      ? "bg-button-primary/10 border-button-primary shadow-md ring-1 ring-button-primary"
                      : "bg-background-secondary/30 border-card-border hover:border-button-primary/40 hover:bg-background-secondary/60 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Dual-Color Circle Swatch */}
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden"
                        style={{ backgroundColor: item.color }}
                      >
                        <div
                          className="absolute top-0 right-0 w-4 h-8"
                          style={{ backgroundColor: item.accent }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-extrabold text-text-primary leading-tight truncate">
                            {item.name}
                          </h3>
                          {item.isPremium && (
                            <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.2 rounded shrink-0">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-secondary mt-0.5 leading-snug line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-button-primary border-button-primary text-button-primary-text shadow-xs"
                          : "border-border-primary group-hover:border-button-primary/60"
                      }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3px]" />}
                    </div>
                  </div>

                  {/* Miniature Workspace Mockup Preview */}
                  <div 
                    className="w-full h-14 rounded-xl border border-white/10 shadow-inner flex overflow-hidden text-[9px] font-mono mt-1 transition-transform group-hover:scale-[1.01]"
                    style={{ backgroundColor: item.color }}
                  >
                    {/* Mini Sidebar */}
                    <div 
                      className="w-7 h-full border-r border-white/10 flex flex-col items-center py-2 gap-1.5 shrink-0" 
                      style={{ backgroundColor: item.color }}
                    >
                      <div className="w-3 h-3 rounded-md shadow-2xs" style={{ backgroundColor: item.accent }} />
                      <div className="w-2.5 h-1 rounded-sm bg-white/20 mt-1" />
                      <div className="w-2.5 h-1 rounded-sm bg-white/20" />
                      <div className="w-2.5 h-1 rounded-sm bg-white/20" />
                    </div>

                    {/* Mini Dashboard Area */}
                    <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <div className="h-1.5 w-12 rounded-full bg-white/30" />
                        <div className="h-2 w-4 rounded-full shadow-2xs" style={{ backgroundColor: item.accent }} />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mt-1">
                        <div className="h-5 rounded-md border border-white/10 bg-white/5 flex items-center px-1.5 gap-1">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.accent }} />
                          <div className="h-1 w-6 rounded-full bg-white/40" />
                        </div>
                        <div className="h-5 rounded-md border border-white/10 bg-white/5 flex items-center px-1.5">
                          <div className="h-1 w-8 rounded-full bg-white/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="pt-5 border-t border-border-primary flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs text-text-secondary font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Theme preference is saved and applied across all viewports automatically.</span>
            </div>
            <button
              onClick={() => setShowThemeModal(false)}
              className="px-6 py-2.5 bg-button-primary text-button-primary-text font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-sm w-full sm:w-auto"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
