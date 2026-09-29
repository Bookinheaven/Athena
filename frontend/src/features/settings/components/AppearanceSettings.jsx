import React, { useState } from "react";
import { Palette, Sparkles, Check, Sun, Moon } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

export const AppearanceSettings = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [saveNotice, setSaveNotice] = useState(false);

  const handleSelectTheme = (themeId) => {
    setTheme(themeId);
    setSaveNotice(true);
    setTimeout(() => {
      setSaveNotice(false);
    }, 1800);
  };

  const activeThemeObj = availableThemes?.find((t) => t.id === theme) || availableThemes?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Appearance & Workspace Themes
          </h2>
          <p className="text-xs text-muted-foreground">
            Select your preferred visual atmosphere. Your theme is saved to your account.
          </p>
        </div>

        {saveNotice && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-opacity animate-in fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>Theme Saved</span>
          </span>
        )}
      </div>

      {/* Active Theme Summary Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl border border-border/80 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden"
            style={{ backgroundColor: activeThemeObj?.color }}
          >
            <div
              className="absolute bottom-0 right-0 w-5 h-5 rounded-tl-full"
              style={{ backgroundColor: activeThemeObj?.accent }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Active Theme:</span>
              <span className="text-xs font-bold text-primary font-mono">{activeThemeObj?.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeThemeObj?.description}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-semibold uppercase shrink-0">
          <Sparkles size={11} /> PRO Catalog Unlocked
        </span>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableThemes?.map((item) => {
          const isSelected = theme === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleSelectTheme(item.id)}
              className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 select-none ${
                isSelected
                  ? "bg-secondary/40 border-primary ring-1 ring-primary/40 shadow-xs scale-[1.01]"
                  : "bg-card border-border/60 hover:border-border hover:bg-secondary/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg border border-border/80 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden"
                    style={{ backgroundColor: item.color }}
                  >
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-full"
                      style={{ backgroundColor: item.accent }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-foreground leading-tight">
                        {item.name}
                      </h3>
                      {item.isPremium && (
                        <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border/80 group-hover:border-foreground/40"
                  }`}
                >
                  {isSelected && <Check size={12} className="stroke-[3px]" />}
                </div>
              </div>

              {/* Theme Mini-Preview Bar */}
              <div
                className="h-5 w-full rounded-md border border-border/40 flex items-center px-2 gap-1.5 overflow-hidden"
                style={{ backgroundColor: item.color }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.accent }} />
                <div className="h-1.5 w-10 rounded-full bg-neutral-400/30" />
                <div className="h-1.5 w-6 rounded-full bg-neutral-400/30 ml-auto" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceSettings;
