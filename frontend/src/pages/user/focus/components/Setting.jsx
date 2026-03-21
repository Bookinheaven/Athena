import { useEffect, useState } from 'react';
import { X, Trash2, Volume2, VolumeX, SkipForward, Bell } from 'lucide-react';
import { InputStepper } from './InputStepper';

export const Settings = ({ show, onClose, onSave, initialValues, plannedDuration }) => {
  const [draft, setDraft] = useState(initialValues);
  const maxBreakDuration = Math.floor(
    (plannedDuration - 25 * 60) / Math.max(draft.breaksNumber, 1) / 60
  )
  const maxBreaks = Math.floor(
    (plannedDuration - 25 * 60) / (draft.breakDuration + 25 * 60)
  );
  useEffect(() => {
    if (show) setDraft(initialValues);
  }, [show]);

  const update = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));

  const handleClose = () => {
    onSave(draft);
    onClose();
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL data? This will reset settings, todos, notes, and all history.")) {
      ["breaksNumber", "breakDuration", "autoStartBreaks", "skipBreaks", "confirmReset", "soundOnTransition", "isSoundEnabled"]
        .forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className={`fixed inset-0 z-40 transition-all duration-300 ease-in-out ${show ? "opacity-100 visible" : "opacity-0 invisible"}`}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      <div className={`flex flex-col absolute right-0 top-0 h-full w-full max-w-md bg-card-background border-l border-card-border shadow-2xl transform transition-transform duration-300 ease-in-out ${show ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="flex justify-between items-center p-6 border-b border-card-border">
          <h3 className="text-xl font-semibold text-text-primary">⚙️ Settings</h3>
          <button onClick={handleClose} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">

        <h4 className="text-sm font-semibold text-text-muted mb-2">TIMER</h4>

          <InputStepper
            label="Break duration (min)"
            value={draft.breakDuration / 60}
            onChange={(min) => update("breakDuration", min * 60)}
            min={0.5}
            max={Math.max(0.5, maxBreakDuration)}
            step={0.5}
          />

          <InputStepper
            label="Breaks per session"
            value={draft.breaksNumber}
            onChange={(val) => update("breaksNumber", val)}
            min={1}
            max={Math.max(1, maxBreaks)}
            step={1}
          />

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">Auto-start breaks & focus</label>
            <input
              type="checkbox"
              checked={draft.autoStartBreaks}
              onChange={(e) => update("autoStartBreaks", e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <div>
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <SkipForward className="w-4 h-4" /> Skip breaks
              </label>
              <p className="text-xs text-text-muted mt-0.5">Run focus segments back to back</p>
            </div>
            <input
              type="checkbox"
              checked={draft.skipBreaks}
              onChange={(e) => update("skipBreaks", e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <h4 className="text-sm font-semibold text-text-muted mt-4 mb-2">GENERAL</h4>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <label className="text-sm font-medium text-text-primary">Sound notifications</label>
            <button
              onClick={() => update("isSoundEnabled", !draft.isSoundEnabled)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              {draft.isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <div>
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Bell className="w-4 h-4" /> Sound on segment transition
              </label>
              <p className="text-xs text-text-muted mt-0.5">Play a sound when focus ↔ break switches</p>
            </div>
            <input
              type="checkbox"
              checked={draft.soundOnTransition}
              onChange={(e) => update("soundOnTransition", e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
            <div>
              <label className="text-sm font-medium text-text-primary">Confirm before reset</label>
              <p className="text-xs text-text-muted mt-0.5">Ask before discarding a running session</p>
            </div>
            <input
              type="checkbox"
              checked={draft.confirmReset}
              onChange={(e) => update("confirmReset", e.target.checked)}
              className="w-5 h-5 rounded accent-button-primary"
            />
          </div>

          <h4 className="text-sm font-semibold text-text-muted mt-4 mb-2">DATA</h4>

          <button
            onClick={handleClearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-button-danger/10 border border-button-danger text-button-danger hover:bg-button-danger/20 transition-all duration-300 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data & Reset
          </button>
          <p className="text-xs text-text-muted text-center">
            This will rest all settings to default.
          </p>

        </div>
      </div>
    </div>
  );
};