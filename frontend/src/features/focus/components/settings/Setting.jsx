import React, { useEffect, useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  SkipForward,
  Bell,
  RotateCcw,
  Sparkles,
  Timer,
  Sliders,
} from "lucide-react";
import { InputStepper } from "./InputStepper.jsx";
import toast from "react-hot-toast";

const Toggle = ({ checked, onChange, disabled = false, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      disabled ? "opacity-40 cursor-not-allowed" : ""
    } ${checked ? "bg-primary" : "bg-secondary border border-border/60"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-md transition duration-200 ease-in-out border border-black/5 dark:border-white/10 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const playChimePreview = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio preview unavailable or blocked by browser policy
  }
};

export const Settings = ({
  show,
  onClose,
  onSave,
  initialValues,
  plannedDuration = 1500,
  hideHeader = false,
}) => {
  const [draft, setDraft] = useState(initialValues || {});

  const maxBreakDuration = Math.floor(
    (plannedDuration - 25 * 60) / Math.max(draft.breaksNumber || 1, 1) / 60
  );
  const maxBreaks = Math.floor(
    (plannedDuration - 25 * 60) / ((draft.breakDuration || 300) + 25 * 60)
  );

  useEffect(() => {
    if (show && initialValues) setDraft(initialValues);
  }, [show, initialValues]);

  const update = (key, val) => {
    const newDraft = { ...draft, [key]: val };
    setDraft(newDraft);
    if (onSave) onSave(newDraft);
  };

  const handleResetDefaults = () => {
    const defaults = {
      breakDuration: 5 * 60,
      autoStartBreaks: true,
      breaksNumber: 4,
      skipBreaks: false,
      confirmReset: true,
      soundOnTransition: true,
      isSoundEnabled: true,
    };
    setDraft(defaults);
    if (onSave) onSave(defaults);
    toast.success("Settings reset to defaults");
  };

  if (!show) return null;

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sliders size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Session Settings
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Preferences for your deep focus sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Close settings"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
        {/* Audio section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Volume2 size={13} className="text-primary" />
            <span>Audio & Sound</span>
          </div>

          <div className="space-y-2.5 rounded-2xl bg-secondary/30 p-4 border border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block">
                  Sound Effects
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Play sounds during session events
                </p>
              </div>
              <Toggle
                id="toggle-sound-enabled"
                checked={draft.isSoundEnabled ?? true}
                onChange={(val) => update("isSoundEnabled", val)}
              />
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block">
                  Transition Chimes
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Play a chime when focus/break ends
                </p>
              </div>
              <div className="flex items-center gap-2">
                {draft.soundOnTransition && draft.isSoundEnabled && (
                  <button
                    type="button"
                    onClick={playChimePreview}
                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    title="Preview Chime"
                  >
                    <Bell size={11} /> Test
                  </button>
                )}
                <Toggle
                  id="toggle-sound-transition"
                  checked={draft.soundOnTransition ?? true}
                  disabled={!draft.isSoundEnabled}
                  onChange={(val) => update("soundOnTransition", val)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Intervals & Breaks section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Timer size={13} className="text-primary" />
            <span>Intervals & Breaks</span>
          </div>

          <div className="space-y-4 rounded-2xl bg-secondary/30 p-4 border border-border/40">
            <InputStepper
              label="Break Duration"
              description="Length of resting periods between focus blocks"
              value={Math.round((draft.breakDuration || 300) / 60)}
              onChange={(val) => update("breakDuration", val * 60)}
              min={1}
              max={Math.max(5, maxBreakDuration > 0 ? maxBreakDuration : 15)}
              step={1}
              unit="min"
              presets={[3, 5, 10, 15]}
            />

            <div className="h-px bg-border/40" />

            <InputStepper
              label="Breaks per Session"
              description="Number of short rest stops before session end"
              value={draft.breaksNumber || 4}
              onChange={(val) => update("breaksNumber", val)}
              min={1}
              max={Math.max(1, maxBreaks > 0 ? maxBreaks : 6)}
              step={1}
              presets={[2, 3, 4, 5]}
            />

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block">
                  Auto-Start Breaks
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Begin breaks automatically when focus ends
                </p>
              </div>
              <Toggle
                id="toggle-auto-breaks"
                checked={draft.autoStartBreaks ?? true}
                onChange={(val) => update("autoStartBreaks", val)}
              />
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block">
                  Skip All Breaks
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Run continuous focus with no breaks scheduled
                </p>
              </div>
              <Toggle
                id="toggle-skip-breaks"
                checked={draft.skipBreaks ?? false}
                onChange={(val) => update("skipBreaks", val)}
              />
            </div>
          </div>
        </div>

        {/* Safety & Controls section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Sparkles size={13} className="text-primary" />
            <span>Workflow Controls</span>
          </div>

          <div className="rounded-2xl bg-secondary/30 p-4 border border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block">
                  Confirm Reset
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Prompt for confirmation before resetting active sessions
                </p>
              </div>
              <Toggle
                id="toggle-confirm-reset"
                checked={draft.confirmReset ?? true}
                onChange={(val) => update("confirmReset", val)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between shrink-0 bg-background/50">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <RotateCcw size={12} />
          Reset Defaults
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-2xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export const Setting = Settings;
export default Settings;
