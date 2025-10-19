import React from "react";
import { X, Trash2 } from "lucide-react";

export const Settings = ({
  show,
  onClose,
  autoStartBreaks,
  setAutoStartBreaks,
  breakDuration,
  setBreakDuration,
  totalBreaks,
  setTotalBreaks,
  setBreaksLeft,
}) => {
  const handleClearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This will reset the timer, todos, and session history."
      )
    ) {
      localStorage.removeItem("breaksNumber");
      localStorage.removeItem("breakDuration");
      localStorage.removeItem("autoStartBreaks");
      localStorage.removeItem("focusSessionState");
      localStorage.removeItem("sessionHistory");
      localStorage.removeItem("totalFocusDuration");
      localStorage.removeItem("focusTodos");
      localStorage.removeItem("focusTabHiddenAt");
      window.location.reload();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ease-in-out ${
        show ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`flex flex-col absolute right-0 top-0 h-full w-full max-w-md bg-card-background border-l border-card-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          show ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-card-border">
          <h3 className="text-xl font-semibold text-text-primary">⚙️ Settings</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto h-[calc(100%-112px)]">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">
              Auto-start breaks
            </label>
            <input
              type="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">
              Break duration (min)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={breakDuration / 60}
              onChange={(e) => setBreakDuration(parseInt(e.target.value, 10) * 60)}
              className="w-20 px-3 py-2 rounded-lg text-center focus-ring-primary bg-input-background border border-input-border text-text-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">
              Maximium breaks per session
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={totalBreaks}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) {
                  setTotalBreaks(val);
                  // setBreaksLeft(val);
                }
              }}
              className="w-20 px-3 py-2 rounded-lg text-center focus-ring-primary bg-input-background border border-input-border text-text-primary"
            />
          </div>
        </div>

        <div className="p-4 border-t border-card-border bg-background-secondary/50">
          <button
            onClick={handleClearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-button-danger/10 border border-button-danger text-button-danger hover:bg-button-danger/20 transition-all duration-300 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data & Reset
          </button>
          <p className="mt-2 text-xs text-text-muted text-center">
            This will delete timer state, todos, and session history
          </p>
        </div>
      </div>
    </div>
  );
};
