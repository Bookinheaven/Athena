import React, { useState } from 'react';
import { X, Trash2, History, Volume2, VolumeX } from 'lucide-react';
import { InputStepper } from './InputStepper';

export const Settings = ({
  show,
  onClose,
  autoStartBreaks,
  setAutoStartBreaks,
  breakDuration,      
  setBreakDuration,   
  totalBreaks,
  setTotalBreaks,
  onClearHistory,      
}) => {
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const handleClearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear ALL data? This will reset settings, todos, notes, and all history."
      )
    ) {
      localStorage.removeItem("breaksNumber");
      localStorage.removeItem("breakDuration");
      localStorage.removeItem("autoStartBreaks");
      localStorage.removeItem("sessionHistory");
      localStorage.removeItem("totalFocusDuration");

      sessionStorage.removeItem("focusTodos");
      sessionStorage.removeItem("notes");
      sessionStorage.removeItem("sessionReview");
      sessionStorage.removeItem("sessionData");
      
      window.location.reload();
    }
  };
  const handleHistoryClear = () => {
    if (window.confirm("Are you sure you want to clear session history?")) {
      onClearHistory();
      onClose(); 
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

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          
          <h4 className="text-sm font-semibold text-text-muted mb-2">TIMER</h4>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">
              Auto-start breaks & focus
            </label>
            <input
              type="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <InputStepper
            label="Break duration (min)"
            value={breakDuration / 60} 
            onChange={(minutes) => setBreakDuration(minutes * 60)} 
            min={0.5} 
            max={60}
            step={0.5} 
          />

          <InputStepper
            label="Breaks per session"
            value={totalBreaks}
            onChange={setTotalBreaks}
            min={1}
            max={10}
            step={1}
          />

          <h4 className="text-sm font-semibold text-text-muted mt-4 mb-2">GENERAL</h4>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">
              Sound notifications
            </label>
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
          
          <h4 className="text-sm font-semibold text-text-muted mt-4 mb-2">DATA</h4>
          
          <button
            onClick={handleHistoryClear}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-button-secondary/50 border border-card-border text-text-primary hover:bg-button-secondary/80 transition-all duration-300 font-medium"
          >
            <History className="w-4 h-4" />
            Clear Session History
          </button>

          <button
            onClick={handleClearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-button-danger/10 border border-button-danger text-button-danger hover:bg-button-danger/20 transition-all duration-300 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data & Reset
          </button>
          <p className="text-xs text-text-muted text-center">
            This will delete all settings, todos, notes, and history.
          </p>

        </div>
      </div>
    </div>
  );
};