import { useEffect, useState } from 'react';
import { X, Trash2, Volume2, VolumeX, SkipForward, Bell, RotateCcw } from 'lucide-react';
import { InputStepper } from './InputStepper';

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
      checked ? 'bg-button-primary' : 'bg-border-secondary'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

export const Settings = ({ show, onClose, onSave, initialValues, plannedDuration }) => {
  const [draft, setDraft] = useState(initialValues);
  
  const maxBreakDuration = Math.floor(
    (plannedDuration - 25 * 60) / Math.max(draft.breaksNumber, 1) / 60
  );
  const maxBreaks = Math.floor(
    (plannedDuration - 25 * 60) / (draft.breakDuration + 25 * 60)
  );

  useEffect(() => {
    if (show) setDraft(initialValues);
  }, [show, initialValues]);

  const update = (key, val) => {
    const newDraft = { ...draft, [key]: val };
    setDraft(newDraft);
    onSave(newDraft); 
  };

  const handleClose = () => {
    onClose();
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL data? This will reset settings.")) {
      ["breaksNumber", "breakDuration", "autoStartBreaks", "skipBreaks", "confirmReset", "soundOnTransition", "isSoundEnabled"]
        .forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  if (!show) return null;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      
      <div className="flex justify-between items-center px-5 py-4 border-b border-border-secondary shrink-0">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          Settings
        </h3>
        <button 
          onClick={handleClose} 
          className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0 space-y-6">

        <section>
          <h4 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider pl-1">Timer Configuration</h4>
          <div className="bg-background-primary/40 border border-border-secondary rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-secondary/50">
              <InputStepper
                label="Break duration (min)"
                value={draft.breakDuration / 60}
                onChange={(min) => update("breakDuration", min * 60)}
                min={0.5}
                max={Math.max(0.5, maxBreakDuration)}
                step={0.5}
              />
            </div>
            <div className="p-4">
              <InputStepper
                label="Breaks per session"
                value={draft.breaksNumber}
                onChange={(val) => update("breaksNumber", val)}
                min={1}
                max={Math.max(1, maxBreaks)}
                step={1}
              />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider pl-1">Automation</h4>
          <div className="bg-background-primary/40 border border-border-secondary rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-border-secondary/50 hover:bg-background-secondary/30 transition-colors">
              <div>
                <label className="text-sm font-medium text-text-primary">Auto-start transitions</label>
                <p className="text-[11px] text-text-muted mt-0.5">Automatically start breaks & focus</p>
              </div>
              <Toggle checked={draft.autoStartBreaks} onChange={(val) => update("autoStartBreaks", val)} />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-background-secondary/30 transition-colors">
              <div>
                <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                  <SkipForward className="w-3.5 h-3.5" /> Skip breaks
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Run focus segments back to back</p>
              </div>
              <Toggle checked={draft.skipBreaks} onChange={(val) => update("skipBreaks", val)} />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider pl-1">Notifications & Safety</h4>
          <div className="bg-background-primary/40 border border-border-secondary rounded-xl overflow-hidden shadow-sm">
            
            <div className="flex items-center justify-between p-4 border-b border-border-secondary/50 hover:bg-background-secondary/30 transition-colors">
              <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                {draft.isSoundEnabled ? <Volume2 className="w-4 h-4 text-button-primary" /> : <VolumeX className="w-4 h-4 text-text-muted" />}
                Sound Notifications
              </label>
              <Toggle checked={draft.isSoundEnabled} onChange={(val) => update("isSoundEnabled", val)} />
            </div>

            <div className="flex items-center justify-between p-4 border-b border-border-secondary/50 hover:bg-background-secondary/30 transition-colors">
              <div>
                <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> Transition Sounds
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Ring when focus/break switches</p>
              </div>
              <Toggle checked={draft.soundOnTransition} onChange={(val) => update("soundOnTransition", val)} />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-background-secondary/30 transition-colors">
              <div>
                <label className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Confirm resets
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">Ask before discarding a session</p>
              </div>
              <Toggle checked={draft.confirmReset} onChange={(val) => update("confirmReset", val)} />
            </div>

          </div>
        </section>

        <section className="pt-2">
          <button
            onClick={handleClearAllData}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-button-danger/10 border border-button-danger/30 text-button-danger hover:bg-button-danger hover:text-white transition-all duration-300 font-bold text-sm shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Settings & Reset
          </button>
          <p className="text-[11px] text-text-muted text-center mt-2 px-4">
            This will permanently delete all your settings.
          </p>
        </section>

      </div>
    </div>
  );
};