import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { formatMinutes } from "../hooks/useTodayData.js";
import { Sparkles, TrendingUp, TrendingDown, Check, X, Loader2 } from "lucide-react";

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

  const targetDate =
    adaptiveTarget?.evidence?.targetProductDate ||
    new Date().toISOString().slice(0, 10);
  const dismissKey = `athena_dismiss_target_${targetDate}_${adaptiveTarget?.proposedTargetMinutes}`;

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(dismissKey);
      setIsDismissed(Boolean(dismissed));
    } catch {
      setIsDismissed(false);
    }
  }, [dismissKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, "true");
    } catch {
      /* ignore */
    }
    setIsDismissed(true);
  };

  const handleApply = async () => {
    if (!onApplyTarget || !adaptiveTarget?.proposedTargetMinutes) return;
    setIsApplying(true);
    try {
      await onApplyTarget(adaptiveTarget.proposedTargetMinutes);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 3000);
    } catch (err) {
      console.error("Failed to apply recommended target:", err);
    } finally {
      setIsApplying(false);
    }
  };

  const hasRecommendation =
    adaptiveTarget &&
    adaptiveTarget.status === "recommended" &&
    adaptiveTarget.direction !== "none" &&
    adaptiveTarget.proposedTargetMinutes !== targetMinutes &&
    !isDismissed &&
    !justApplied;

  const isIncrease = adaptiveTarget?.direction === "increase";

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
                Daily target updated to {formatMinutes(targetMinutes)}.
              </span>
            </div>
          </div>
        )}

        {/* Adaptive Target Recommendation Callout */}
        {hasRecommendation && (
          <div className="mt-2 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="space-y-1 pr-2">
              <div className="flex items-center gap-1.5">
                {isIncrease ? (
                  <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {adaptiveTarget.summary}
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  {adaptiveTarget.badgeText}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {adaptiveTarget.explanation}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isApplying}
                className="h-7 px-3 text-xs font-medium cursor-pointer"
              >
                {isApplying ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {`Accept ${adaptiveTarget.proposedTargetMinutes}m`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
