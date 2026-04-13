import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Play } from "lucide-react";

export default function DurationModal({
  showDurationModal,
  setShowDurationModal,
  durationToStart,
  setDurationToStart,
  tasksToStart,
  confirmStartFocus,
}) {
  const handleBlur = () => {
    if (!durationToStart) return;
    if (durationToStart < 15) setDurationToStart(15);
    if (durationToStart > 999) setDurationToStart(999);
  };

  return (
    <AnimatePresence>
      {showDurationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDurationModal(false)}
            className="absolute inset-0 bg-background-color/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-card-background border border-card-border p-6 rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary tracking-tight">
                  Focus Timer
                </h2>
                <p className="text-sm text-text-muted font-medium mt-1">
                  Ready to focus on{" "}
                  <span className="text-text-primary font-bold">
                    {tasksToStart.length}{" "}
                    {tasksToStart.length === 1 ? "task" : "tasks"}
                  </span>
                  ?
                </p>
              </div>
              <button
                onClick={() => setShowDurationModal(false)}
                className="p-2 hover:bg-background-secondary rounded-full transition-colors text-text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setDurationToStart(m)}
                  className={`
                    py-4 rounded-2xl font-bold transition-all border-2 flex flex-col items-center gap-1
                    ${
                      durationToStart === m
                        ? "bg-button-primary border-button-primary text-white shadow-lg shadow-button-primary/20 scale-[1.02]"
                        : "bg-background-secondary border-transparent text-text-secondary hover:border-button-primary/30"
                    }
                  `}
                >
                  <span className="text-lg">{m}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-80">
                    Minutes
                  </span>
                </button>
              ))}
            </div>

            <div className="relative mb-8 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-button-primary transition-colors">
                <Clock size={18} />
              </div>

              <input
                type="number"
                placeholder="Custom duration..."
                value={durationToStart || ""}
                onBlur={handleBlur}
                onChange={(e) =>
                  setDurationToStart(parseInt(e.target.value) || 0)
                }
                className="
                  w-full bg-background-secondary border-2 border-transparent 
                  focus:border-button-primary/50 rounded-2xl py-4 pl-12 pr-16 
                  outline-none transition-all font-bold text-text-primary 
                  placeholder:text-text-muted/40 appearance-none
                "
                style={{ MozAppearance: "textfield" }}
              />

              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-xs font-black uppercase tracking-widest text-text-muted/60">
                  mins
                </span>
              </div>

              {durationToStart > 0 && durationToStart < 15 && (
                <p className="absolute -bottom-6 left-2 text-[10px] text-button-danger font-bold">
                  Minimum focus session is 15 minutes
                </p>
              )}
              {durationToStart > 0 && durationToStart > 999 && (
                <p className="absolute -bottom-6 left-2 text-[10px] text-button-danger font-bold">
                  Maximum focus session is 999 minutes
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDurationModal(false)}
                className="flex-1 py-4 font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStartFocus}
                disabled={!durationToStart || durationToStart < 15}
                className="flex-[2] bg-button-primary text-white font-black rounded-2xl py-4 shadow-xl shadow-button-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale disabled:scale-100"
              >
                <Play size={18} fill="currentColor" />
                Start Session
              </button>
            </div>

            <style>{`
              input::-webkit-outer-spin-button,
              input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
