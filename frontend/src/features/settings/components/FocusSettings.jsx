import React, { useState, useEffect } from "react";
import { Target, RotateCcw, Check, Volume2, Timer, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@contexts/AuthContext";
import { useFocusSettings } from "@/features/focus/hooks/useFocusSettings";
import streakService from "@services/streakService";

export const FocusSettings = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { settings, setSetting, saveSettingsToBackend, resetSettings, isLoading } =
    useFocusSettings(userId);

  const [saveNotice, setSaveNotice] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Streak & Adaptive Target Settings
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [minTargetMinutes, setMinTargetMinutes] = useState(20);
  const [maxTargetMinutes, setMaxTargetMinutes] = useState(90);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);

  useEffect(() => {
    streakService
      .fetchStreak()
      .then((data) => {
        if (data) {
          if (data.dailyTargetMinutes) setTargetMinutes(data.dailyTargetMinutes);
          if (data.minTargetMinutes) setMinTargetMinutes(data.minTargetMinutes);
          if (data.maxTargetMinutes) setMaxTargetMinutes(data.maxTargetMinutes);
        }
      })
      .catch(() => {});

    try {
      const stored =
        localStorage.getItem("athena_adaptive_target_enabled") ||
        (userId ? localStorage.getItem(`athena_adaptive_target_enabled_${userId}`) : null);
      if (stored !== null) {
        setAdaptiveEnabled(stored === "true");
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  const handleTargetChange = async (minutes) => {
    const clamped = Math.max(minTargetMinutes, Math.min(minutes, maxTargetMinutes));
    setTargetMinutes(clamped);
    try {
      await streakService.updateTargetSettings({
        dailyTargetMinutes: clamped,
        minTargetMinutes,
        maxTargetMinutes,
      });
      triggerSaveFeedback();
    } catch (err) {
      console.error("Failed to update daily target:", err);
    }
  };

  const handleMinTargetChange = async (val) => {
    const newMin = Math.max(5, Math.min(Number(val) || 20, maxTargetMinutes));
    setMinTargetMinutes(newMin);
    const newTarget = Math.max(newMin, targetMinutes);
    setTargetMinutes(newTarget);
    try {
      await streakService.updateTargetSettings({
        dailyTargetMinutes: newTarget,
        minTargetMinutes: newMin,
        maxTargetMinutes,
      });
      triggerSaveFeedback();
    } catch (err) {
      console.error("Failed to update min target:", err);
    }
  };

  const handleMaxTargetChange = async (val) => {
    const newMax = Math.max(minTargetMinutes, Math.min(Number(val) || 90, 360));
    setMaxTargetMinutes(newMax);
    const newTarget = Math.min(newMax, targetMinutes);
    setTargetMinutes(newTarget);
    try {
      await streakService.updateTargetSettings({
        dailyTargetMinutes: newTarget,
        minTargetMinutes,
        maxTargetMinutes: newMax,
      });
      triggerSaveFeedback();
    } catch (err) {
      console.error("Failed to update max target:", err);
    }
  };

  const handleAdaptiveToggle = () => {
    const next = !adaptiveEnabled;
    setAdaptiveEnabled(next);
    try {
      localStorage.setItem("athena_adaptive_target_enabled", String(next));
      if (userId) {
        localStorage.setItem(`athena_adaptive_target_enabled_${userId}`, String(next));
      }
    } catch {
      /* ignore */
    }
    triggerSaveFeedback();
  };

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

        {/* Daily Focus Commitment & Adaptive Target */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily Focus Commitment</h3>
                <p className="text-xs text-muted-foreground">
                  Configure your baseline commitment, target presets, and adaptive boundary limits.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 tabular-nums">
                {targetMinutes} min / day
              </span>
            </div>
          </div>

          <div className="space-y-5 pt-1">
            {/* Target Presets & Quick Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-foreground">Target Presets</label>
                <span className="text-muted-foreground text-[11px]">
                  Floor: {minTargetMinutes}m — Cap: {maxTargetMinutes}m
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[20, 25, 30, 35, 45, 60, 90, 120].map((mins) => {
                  const isSelected = targetMinutes === mins;
                  const isOutOfBounds = mins < minTargetMinutes || mins > maxTargetMinutes;
                  return (
                    <button
                      key={mins}
                      type="button"
                      disabled={isOutOfBounds}
                      onClick={() => handleTargetChange(mins)}
                      className={`h-8 px-3 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : isOutOfBounds
                          ? "opacity-35 cursor-not-allowed bg-muted/40 border-border/40 text-muted-foreground"
                          : "bg-secondary/40 text-foreground border-border/60 hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Slider & Stepper */}
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Fine-Tune Commitment</span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => handleTargetChange(targetMinutes - 5)}
                    disabled={targetMinutes <= minTargetMinutes}
                    className="h-6 w-6 rounded flex items-center justify-center border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 font-semibold text-foreground tabular-nums">
                    {targetMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTargetChange(targetMinutes + 5)}
                    disabled={targetMinutes >= maxTargetMinutes}
                    className="h-6 w-6 rounded flex items-center justify-center border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={minTargetMinutes}
                max={maxTargetMinutes}
                step={5}
                value={targetMinutes}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>{minTargetMinutes}m (min)</span>
                <span>{maxTargetMinutes}m (max)</span>
              </div>
            </div>

            {/* Target Boundaries (Min & Max Floors/Ceilings) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Minimum Target Floor</label>
                  <span className="text-xs font-mono text-muted-foreground">{minTargetMinutes}m</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Guarantees Athena never steps your daily target below this momentum baseline.
                </p>
                <div className="flex gap-1.5 pt-1">
                  {[10, 15, 20, 25, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleMinTargetChange(val)}
                      className={`h-7 px-2 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                        minTargetMinutes === val
                          ? "bg-foreground text-background border-foreground font-semibold"
                          : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/50 bg-card space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Maximum Target Ceiling</label>
                  <span className="text-xs font-mono text-muted-foreground">{maxTargetMinutes}m</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Caps adaptive scaling to prevent burnout and protect sustainable momentum.
                </p>
                <div className="flex gap-1.5 pt-1 flex-wrap">
                  {[60, 90, 120, 180, 240].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleMaxTargetChange(val)}
                      className={`h-7 px-2 rounded text-[11px] font-mono border transition-all cursor-pointer ${
                        maxTargetMinutes === val
                          ? "bg-foreground text-background border-foreground font-semibold"
                          : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground"
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Adaptive Toggle */}
            <div className="pt-2 border-t border-border/40">
              <ToggleRow
                label="Adaptive Focus Target Recommendations"
                description="Allow Athena to suggest personalized adjustments on your Today dashboard based on your 7-day focus pace."
                checked={adaptiveEnabled}
                onChange={handleAdaptiveToggle}
              />
            </div>
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
