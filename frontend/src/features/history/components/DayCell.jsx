import React from "react";

/**
 * Individual calendar cell — redesigned with color-filled state backgrounds,
 * a compact progress bar, and a today glow ring.
 *
 * State colors are strictly based on DailyStats task outcome (NOT focus minutes).
 */
export function DayCell({ dayObj, stats, isSelected, isToday, onClick }) {
  const { day, isCurrentMonth, productDate } = dayObj;

  const state = stats?.state || "neutral";
  const tasksPlanned = stats?.tasksPlanned || 0;
  const tasksCompleted = stats?.tasksCompleted || 0;
  const tasksPartiallyCompleted = stats?.tasksPartiallyCompleted || 0;
  const effectivePlanned =
    tasksPlanned - (stats?.tasksRescheduled || 0) - (stats?.tasksCancelled || 0);

  const completionPct =
    effectivePlanned > 0
      ? Math.min(
          100,
          Math.round(
            ((tasksCompleted + tasksPartiallyCompleted * 0.5) / effectivePlanned) * 100
          )
        )
      : 0;

  const stateStyles = {
    successful: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/[0.12]",
      selectedBg: "bg-emerald-500/20",
      bar: "bg-emerald-500",
      ring: "ring-emerald-500/40",
      text: "text-emerald-600 dark:text-emerald-400",
      label: "Successful",
    },
    partial: {
      bg: "bg-amber-500/10 dark:bg-amber-500/[0.12]",
      selectedBg: "bg-amber-500/20",
      bar: "bg-amber-500",
      ring: "ring-amber-500/40",
      text: "text-amber-600 dark:text-amber-400",
      label: "Partial",
    },
    failed: {
      bg: "bg-rose-500/10 dark:bg-rose-500/[0.12]",
      selectedBg: "bg-rose-500/20",
      bar: "bg-rose-500",
      ring: "ring-rose-500/40",
      text: "text-rose-600 dark:text-rose-400",
      label: "Missed",
    },
    neutral: {
      bg: "bg-transparent",
      selectedBg: "bg-primary/10",
      bar: "bg-muted-foreground/30",
      ring: "ring-primary/30",
      text: "text-muted-foreground/60",
      label: "Neutral",
    },
  };

  const s = stateStyles[state] || stateStyles.neutral;
  const hasStats = stats && effectivePlanned > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(productDate)}
      data-testid={`day-cell-${productDate}`}
      data-state={state}
      aria-label={`${productDate}, ${s.label}`}
      className={[
        "group relative flex flex-col justify-between p-1.5 md:p-2 rounded-xl border text-left transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        "h-[64px] md:h-[72px]",
        !isCurrentMonth ? "opacity-30" : "",
        isSelected
          ? `${s.selectedBg} border-primary/60 ring-1 ring-primary/40 shadow-md`
          : hasStats
          ? `${s.bg} border-border/30 hover:border-border/60 hover:shadow-sm`
          : "bg-transparent border-border/20 hover:bg-muted/20 hover:border-border/40",
        isToday && !isSelected
          ? "ring-2 ring-primary/50 border-primary/40"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Day number */}
      <span
        className={[
          "text-[11px] md:text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none",
          isToday
            ? "bg-primary text-primary-foreground"
            : isSelected
            ? `${s.text} font-black`
            : isCurrentMonth
            ? "text-foreground/90"
            : "text-muted-foreground/40",
        ].join(" ")}
      >
        {day}
      </span>

      {/* Bottom section */}
      <div className="w-full space-y-[3px]">
        {hasStats ? (
          <>
            {/* Thin progress bar */}
            <div className="w-full h-[3px] rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${s.bar}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {/* Count text */}
            <span className={`text-[9px] font-semibold leading-none ${s.text}`}>
              {`${tasksCompleted}/${effectivePlanned}`}
            </span>
          </>
        ) : stats?.totalFocusMinutes > 0 ? (
          <span className="text-[9px] text-muted-foreground/50 font-mono leading-none">
            {`${stats.totalFocusMinutes}m`}
          </span>
        ) : (
          <span className="text-[9px] text-muted-foreground/20 leading-none select-none">
            ·
          </span>
        )}
      </div>
    </button>
  );
}
