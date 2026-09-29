import React, { useState } from "react";
import { Bell, Volume2, ShieldCheck, Check } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { useFocusSettings } from "@/features/focus/hooks/useFocusSettings";

export const NotificationSettings = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const { settings, setSetting, saveSettingsToBackend } = useFocusSettings(userId);
  const [saveNotice, setSaveNotice] = useState(false);

  const handleToggle = (key) => {
    const updated = !settings[key];
    setSetting(key, updated);
    saveSettingsToBackend({ [key]: updated });
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Notification & Audio Alerts
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage audio alerts and feedback cues during execution sessions.
          </p>
        </div>

        {saveNotice && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* In-App Audio Cues */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">In-App Audio Signals</h3>
            <p className="text-xs text-muted-foreground">
              Acoustic tones sounded when phase or segment boundaries are crossed.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-medium text-foreground">Session Sound Effects</p>
              <p className="text-[11px] text-muted-foreground">
                Play subtle chimes on start, pause, and timer completion.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.isSoundEnabled ?? true}
              onClick={() => handleToggle("isSoundEnabled")}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                (settings.isSoundEnabled ?? true) ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  (settings.isSoundEnabled ?? true) ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-medium text-foreground">Phase Transition Chime</p>
              <p className="text-[11px] text-muted-foreground">
                Ring an alert tone when switching between focus work and break time.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.soundOnTransition ?? true}
              onClick={() => handleToggle("soundOnTransition")}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                (settings.soundOnTransition ?? true) ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  (settings.soundOnTransition ?? true) ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Focus Philosophy Banner */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-foreground text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Distraction-Free Architecture</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Athena prioritizes deep uninterrupted work. Operating system push popups and browser desktop notifications are omitted by design to protect flow state from external interruptions.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
