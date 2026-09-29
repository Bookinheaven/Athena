import React, { useState } from "react";
import { Target, RotateCcw, Check, Volume2, Timer, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@contexts/AuthContext";
import { useFocusSettings } from "@/features/focus/hooks/useFocusSettings";

export const FocusSettings = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const { settings, setSetting, saveSettingsToBackend, resetSettings, isLoading } =
    useFocusSettings(userId);

  const [saveNotice, setSaveNotice] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleToggle = (key) => {
    const updated = !settings[key];
    setSetting(key, updated);
    saveSettingsToBackend({ [key]: updated });
    triggerSaveFeedback();
  };

  const handleBreakDurationChange = (seconds) => {
    setSetting("breakDuration", seconds);
    saveSettingsToBackend({ breakDuration: seconds });
    triggerSaveFeedback();
  };

  const handleBreaksNumberChange = (count) => {
    setSetting("breaksNumber", count);
    saveSettingsToBackend({ breaksNumber: count });
    triggerSaveFeedback();
  };

  const triggerSaveFeedback = () => {
    setSaveNotice(true);
    setTimeout(() => {
      setSaveNotice(false);
    }, 1800);
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      await resetSettings();
      triggerSaveFeedback();
    } catch (err) {
      console.error("Failed to reset settings:", err);
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  const breakDurationMinutes = Math.round((settings.breakDuration || 300) / 60);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Focus & Session Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure cadence, audio alerts, and break intervals for deep work sessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveNotice && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 animate-in fade-in">
                <Check className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetModal(true)}
              disabled={isLoading || isResetting}
              className="text-xs border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Defaults
            </Button>
          </div>
        </div>

        {/* Break Cadence Section */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Break Timing & Structure</h3>
              <p className="text-xs text-muted-foreground">
                Set break interval length and repetition target per session.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Break Duration Presets */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Break Duration</label>
              <div className="grid grid-cols-4 gap-2.5 max-w-md">
                {[3, 5, 10, 15].map((mins) => {
                  const secs = mins * 60;
                  const isSelected = settings.breakDuration === secs;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleBreakDurationChange(secs)}
                      className={`h-9 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-foreground border-border/60 hover:bg-secondary"
                      }`}
                    >
                      {mins} min
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Breaks per session */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-foreground">Breaks Target Per Session</label>
              <div className="grid grid-cols-5 gap-2 max-w-md">
                {[2, 3, 4, 5, 6].map((num) => {
                  const isSelected = settings.breaksNumber === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleBreaksNumberChange(num)}
                      className={`h-9 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-foreground border-border/60 hover:bg-secondary"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Automation & Behavior */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Workflow Automation</h3>
              <p className="text-xs text-muted-foreground">
                Automate transition triggers and safety confirmations.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            <ToggleRow
              label="Auto-Start Breaks"
              description="Automatically start the break countdown when a focus segment finishes."
              checked={settings.autoStartBreaks ?? true}
              onChange={() => handleToggle("autoStartBreaks")}
            />
            <ToggleRow
              label="Allow Skipping Breaks"
              description="Allow immediately starting the next focus segment without completing the break."
              checked={settings.skipBreaks ?? false}
              onChange={() => handleToggle("skipBreaks")}
            />
            <ToggleRow
              label="Confirm Reset Action"
              description="Ask for confirmation before resetting active session timer progress."
              checked={settings.confirmReset ?? true}
              onChange={() => handleToggle("confirmReset")}
            />
          </div>
        </div>

        {/* Audio Alerts */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sound & Audio Alerts</h3>
              <p className="text-xs text-muted-foreground">
                In-app acoustic signals for segment completion.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            <ToggleRow
              label="Enable Sound Effects"
              description="Master switch for session audio feedback and chime notifications."
              checked={settings.isSoundEnabled ?? true}
              onChange={() => handleToggle("isSoundEnabled")}
            />
            <ToggleRow
              label="Phase Transition Sound"
              description="Play a tone when switching between focus and break intervals."
              checked={settings.soundOnTransition ?? true}
              onChange={() => handleToggle("soundOnTransition")}
            />
          </div>
        </div>

        {/* Architectural Note */}
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Note: </span>
          Default focus interval duration is determined by your scheduled task or session target in
          Planner and Focus modes.
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Focus Settings"
        message="Are you sure you want to restore all session settings to their original factory defaults?"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetModal(false)}
        type="warning"
      />
    </>
  );
};

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5 pr-4">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default FocusSettings;
