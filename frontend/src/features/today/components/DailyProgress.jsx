import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { formatMinutes } from "../hooks/useTodayData.js";
import { Sparkles, TrendingUp, TrendingDown, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DailyProgress({
  focusMinutes = 0,
  targetMinutes = 25,
  progressPercent = 0,
  remainingMinutes = 0,
  adaptiveTarget = null,
  onApplyTarget = null,
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [justApplied, setJustApplied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  const targetDate =
    adaptiveTarget?.evidence?.targetProductDate ||
    new Date().toISOString().slice(0, 10);
  const dismissKey = `athena_dismiss_target_${targetDate}`;
  const settledKey = `athena_target_settled_${targetDate}`;

  const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(dismissKey);
      const settled = localStorage.getItem(settledKey);
      const enabled = localStorage.getItem("athena_adaptive_target_enabled");
      setIsDismissed(Boolean(dismissed));
      setIsSettled(Boolean(settled));
      if (enabled !== null) {
        setAdaptiveEnabled(enabled === "true");
      }
    } catch {
      setIsDismissed(false);
      setIsSettled(false);
      setAdaptiveEnabled(true);
    }
  }, [dismissKey, settledKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, "true");
    } catch {
      /* ignore */
    }
    setIsDismissed(true);
  };

  const currentTarget = targetMinutes || 25;
  const isIncrease = adaptiveTarget?.direction === "increase";
  const proposed =
    adaptiveTarget?.proposedTargetMinutes ||
    (isIncrease ? currentTarget + 5 : Math.max(15, currentTarget - 5));
  const minTarget = adaptiveTarget?.evidence?.minTargetMinutes ?? 20;
  const maxTarget = adaptiveTarget?.evidence?.maxTargetMinutes ?? 90;
  const medianMinutes = adaptiveTarget?.evidence?.medianFocusMinutes ?? 0;

  const [selectedTarget, setSelectedTarget] = useState(proposed);

  useEffect(() => {
    if (adaptiveTarget?.proposedTargetMinutes) {
      setSelectedTarget(adaptiveTarget.proposedTargetMinutes);
    }
  }, [adaptiveTarget?.proposedTargetMinutes]);

  // Compute smart presets so user doesn't have to click accept +5m repeatedly
  const presets = React.useMemo(() => {
    if (!adaptiveTarget) return [];
    if (isIncrease) {
      const step1 = proposed;
      const step2 = Math.min(maxTarget, currentTarget + 15);
      const paceTarget =
        medianMinutes >= currentTarget + 20
          ? Math.min(maxTarget, Math.max(step1, Math.round(medianMinutes / 5) * 5))
          : null;
      const list = [step1, step2, paceTarget].filter(
        (v) => v !== null && v > currentTarget && v <= maxTarget
      );
      return Array.from(new Set(list)).sort((a, b) => a - b);
    } else {
      const step1 = proposed;
      const step2 = Math.max(minTarget, currentTarget - 15);
      const list = [step1, step2, minTarget].filter(
        (v) => v < currentTarget && v >= minTarget
      );
      return Array.from(new Set(list)).sort((a, b) => b - a);
    }
  }, [adaptiveTarget, isIncrease, proposed, currentTarget, maxTarget, minTarget, medianMinutes]);

  const handleStepDown = () => {
    setSelectedTarget((prev) => Math.max(minTarget, (prev || proposed) - 5));
  };

  const handleStepUp = () => {
    setSelectedTarget((prev) => Math.min(maxTarget, (prev || proposed) + 5));
  };

  const handleApply = async (targetToApply = selectedTarget) => {
    const finalTarget = Number(targetToApply) || proposed;
    if (!onApplyTarget || !finalTarget) return;
    setIsApplying(true);
    try {
      await onApplyTarget(finalTarget);
      try {
        localStorage.setItem(settledKey, String(finalTarget));
      } catch {
        /* ignore */
      }
      setIsSettled(true);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 5000);
    } catch (err) {
      console.error("Failed to apply recommended target:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReopen = () => {
    try {
      localStorage.removeItem(settledKey);
      localStorage.removeItem(dismissKey);
    } catch {
      /* ignore */
    }
    setIsSettled(false);
    setIsDismissed(false);
  };

  const hasRecommendation =
    adaptiveEnabled &&
    adaptiveTarget &&
    adaptiveTarget.status === "recommended" &&
    adaptiveTarget.direction !== "none" &&
    adaptiveTarget.proposedTargetMinutes !== targetMinutes &&
    !isDismissed &&
    !isSettled &&
    !justApplied;

  return (
    <Card className="md:col-span-7 lg:col-span-8 border-border bg-card shadow-xs rounded-2xl overflow-hidden transition-all">
      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Progress
            </span>
            {adaptiveTarget?.lastTargetReason && adaptiveTarget.lastTargetReason !== "no_change" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
                Adaptive
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatMinutes(focusMinutes)} / {formatMinutes(targetMinutes)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full bg-secondary/80 rounded-full overflow-hidden border border-border/40 p-0.5">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>{progressPercent}% of daily target</span>
            <span>
              {remainingMinutes > 0
                ? `${formatMinutes(remainingMinutes)} remaining`
                : "Target completed"}
            </span>
          </div>
        </div>

        {/* Feedback confirmation banner when target was just updated */}
        {justApplied && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span className="font-medium">
                Daily target set to {formatMinutes(targetMinutes)} for today.
              </span>
            </div>
            <button
              type="button"
              onClick={handleReopen}
              className="text-[11px] font-medium underline underline-offset-2 opacity-80 hover:opacity-100 cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        {/* Adaptive Target Recommendation Callout */}
        {hasRecommendation && (
          <div
            className={cn(
              "mt-2 px-3.5 py-3 rounded-xl border transition-all animate-in fade-in duration-200 space-y-2.5",
              isIncrease
                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 hover:border-primary/30"
                : "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/30"
            )}
          >
            {/* Header: Icon, Summary, Badge, Dismiss */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 border shadow-2xs",
                    isIncrease
                      ? "bg-primary/15 text-primary border-primary/25"
                      : "bg-amber-500/15 text-amber-500 border-amber-500/25"
                  )}
                >
                  {isIncrease ? (
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground leading-snug">
                      {adaptiveTarget.summary}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full border shrink-0",
                        isIncrease
                          ? "bg-primary/15 text-primary border-primary/25"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                      )}
                    >
                      {adaptiveTarget.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {adaptiveTarget.explanation}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shrink-0 -mr-1"
              >
                Dismiss
              </Button>
            </div>

            {/* Presets & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mr-0.5">
                  Set target:
                </span>

                {presets.map((presetVal) => {
                  const isSelected = (selectedTarget ?? proposed) === presetVal;
                  let label = `${presetVal}m`;
                  if (presetVal === proposed) {
                    label = `${presetVal}m (${isIncrease ? "+5m" : "-5m"})`;
                  } else if (medianMinutes >= currentTarget + 20 && presetVal >= Math.min(maxTarget, 60)) {
                    label = `${presetVal}m (Pace)`;
                  } else {
                    const diff = presetVal - currentTarget;
                    label = `${presetVal}m (${diff > 0 ? `+${diff}m` : `${diff}m`})`;
                  }

                  return (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => setSelectedTarget(presetVal)}
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                        isSelected
                          ? isIncrease
                            ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                            : "bg-amber-600 text-white border-amber-600 shadow-2xs"
                          : "bg-background/80 text-foreground/80 border-border/80 hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}

                {/* Custom Stepper */}
                <div className="flex items-center border border-border/70 rounded-md bg-background/60 overflow-hidden ml-1">
                  <button
                    type="button"
                    onClick={handleStepDown}
                    disabled={(selectedTarget ?? proposed) <= minTarget}
                    className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Decrease target by 5m"
                  >
                    -
                  </button>
                  <span className="px-1.5 text-[11px] font-mono font-medium tabular-nums text-foreground">
                    {selectedTarget ?? proposed}m
                  </span>
                  <button
                    type="button"
                    onClick={handleStepUp}
                    disabled={(selectedTarget ?? proposed) >= maxTarget}
                    className="px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Increase target by 5m"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleApply(selectedTarget ?? proposed)}
                disabled={isApplying}
                className={cn(
                  "h-7 px-3 text-[11px] font-medium cursor-pointer rounded-md shadow-2xs transition-all ml-auto",
                  isIncrease
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                )}
              >
                {isApplying ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                {`Accept ${selectedTarget ?? proposed}m`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
