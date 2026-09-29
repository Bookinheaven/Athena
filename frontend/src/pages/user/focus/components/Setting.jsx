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
import { InputStepper } from "./InputStepper";
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

// Focus session settings panel
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
    toast.success("Focus settings reset to defaults");
  };

  if (!show) return null;

  const totalBreaks = draft.skipBreaks ? 0 : draft.breaksNumber || 1;
  const breakMinutes = Math.round((draft.breakDuration || 300) / 60);
  const totalBreakSeconds = totalBreaks * (draft.breakDuration || 300);
  const totalFocusSeconds = Math.max(0, plannedDuration - totalBreakSeconds);
  const focusSegmentsCount = totalBreaks + 1;
  const focusSegmentMinutes = Math.max(
    1,
    Math.round(totalFocusSeconds / focusSegmentsCount / 60)
  );

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-foreground">
      {!hideHeader && (
        <div className="flex justify-between items-center px-6 py-4 border-b border-border/60 shrink-0">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            <span>Focus Settings</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 pl-0.5">
            <Timer size={14} className="text-primary" />
            <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
              Intervals & Breakdown
            </h4>
          </div>

          <div className="bg-card/70 border border-border/60 rounded-2xl p-4 space-y-4 shadow-2xs">
            <InputStepper
              label="Break Duration"
              description="Length of each resting pause between focus blocks"
              value={Number(((draft.breakDuration || 300) / 60).toFixed(1))}
              onChange={(min) => update("breakDuration", Math.round(min * 60))}
              min={0.5}
              max={Math.max(1, maxBreakDuration || 30)}
              step={0.5}
              unit="min"
              presets={[3, 5, 10, 15]}
            />

            <div className="border-t border-border/40 pt-3">
              <InputStepper
                label="Breaks per Session"
                description="Number of scheduled pauses during this session"
                value={draft.breaksNumber || 1}
                onChange={(val) => update("breaksNumber", val)}
                min={1}
                max={Math.max(1, maxBreaks || 8)}
                step={1}
                unit="breaks"
                presets={[1, 2, 3, 4]}
              />
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-foreground">Estimated Rhythm</span>
                <p className="text-[11px] text-muted-foreground">
                  {draft.skipBreaks
                    ? "Continuous focus without breaks"
                    : `${focusSegmentsCount} focus segments (~${focusSegmentMinutes}m each) + ${totalBreaks} breaks (${breakMinutes}m)`}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shrink-0">
                {Math.round(plannedDuration / 60)}m Total
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 pl-0.5">
            <Sparkles size={14} className="text-primary" />
            <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
              Automation & Flow
            </h4>
          </div>

          <div className="bg-card/70 border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-2xs">
            <div className="p-4 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-auto-start"
                  className="text-xs font-semibold text-foreground block cursor-pointer"
                >
                  Auto-Start Transitions
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Automatically start breaks and the next focus segment
                </p>
              </div>
              <Toggle
                id="toggle-auto-start"
                checked={draft.autoStartBreaks ?? true}
                onChange={(val) => update("autoStartBreaks", val)}
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-skip-breaks"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <SkipForward size={13} className="text-amber-500" />
                  <span>Skip Scheduled Breaks</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Run entire session in unbroken, continuous focus
                </p>
              </div>
              <Toggle
                id="toggle-skip-breaks"
                checked={draft.skipBreaks ?? false}
                onChange={(val) => update("skipBreaks", val)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 pl-0.5">
            <Volume2 size={14} className="text-primary" />
            <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
              Audio & Alerts
            </h4>
          </div>

          <div className="bg-card/70 border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-2xs">
            <div className="p-4 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-sound-master"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  {draft.isSoundEnabled ? (
                    <Volume2 size={14} className="text-emerald-500" />
                  ) : (
                    <VolumeX size={14} className="text-muted-foreground" />
                  )}
                  <span>Sound Notifications</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Enable sound effects for transitions and completions
                </p>
              </div>
              <Toggle
                id="toggle-sound-master"
                checked={draft.isSoundEnabled ?? true}
                onChange={(val) => update("isSoundEnabled", val)}
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-sound-transition"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell size={13} className="text-primary" />
                  <span>Transition Chimes</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Play subtle chime when switching between focus and breaks
                </p>
              </div>
              <div className="flex items-center gap-2">
                {draft.isSoundEnabled && (
                  <button
                    type="button"
                    onClick={playChimePreview}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all border border-border/40"
                    title="Preview Chime"
                  >
                    Test
                  </button>
                )}
                <Toggle
                  id="toggle-sound-transition"
                  disabled={!draft.isSoundEnabled}
                  checked={draft.soundOnTransition ?? true}
                  onChange={(val) => update("soundOnTransition", val)}
                />
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
              <div className="space-y-0.5">
                <label
                  htmlFor="toggle-confirm-reset"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} className="text-amber-500" />
                  <span>Confirm Session Resets</span>
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Prompt for confirmation before discarding an ongoing session
                </p>
              </div>
              <Toggle
                id="toggle-confirm-reset"
                checked={draft.confirmReset ?? true}
                onChange={(val) => update("confirmReset", val)}
              />
            </div>
          </div>
        </section>

        <section className="pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 border border-border/60 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all font-semibold text-xs shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Reset Focus Settings to Defaults</span>
          </button>
        </section>
      </div>
    </div>
  );
};