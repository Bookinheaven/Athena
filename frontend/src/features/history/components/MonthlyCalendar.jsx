import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getMonthGrid, formatMonthYear } from "../utils/dateUtils.js";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Compact monthly calendar — a date NAVIGATOR, not a data viz.
 *
 * Each cell shows:
 *   - the day number
 *   - a tiny count of planned tasks (when > 0) as a very small subtext
 *   - state-based background tint (successful=emerald, partial=amber, failed=rose)
 *
 * Selected day: solid foreground fill.
 * Today (unselected): primary ring.
 * Other days with data: subtle tinted background.
 */
export function MonthlyCalendar({
  year,
  month,
  selectedDate,
  todayDate,
  statsMap,
  isLoading,
  onSelectDate,
  onNavigateMonth,
  onGoToToday,
}) {
  const gridCells = getMonthGrid(year, month);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden">
      {/* Month navigation row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-foreground">
            {formatMonthYear(year, month)}
          </span>
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onGoToToday}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground h-7 px-2.5 rounded-lg border-border/60"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onNavigateMonth(-1)}
            aria-label="Previous month"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onNavigateMonth(1)}
            aria-label="Next month"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 py-0.5 select-none"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {gridCells.map((dayObj) => {
            const { day, isCurrentMonth, productDate } = dayObj;
            const stats = statsMap?.get(productDate);
            const rawState = stats?.state ?? "neutral";
            const state =
              rawState === "green" || rawState === "successful"
                ? "successful"
                : rawState === "yellow" || rawState === "partial"
                ? "partial"
                : rawState === "red" || rawState === "failed"
                ? "failed"
                : "neutral";

            const tasksPlanned = stats?.tasksPlanned ?? stats?.commitmentsPlanned ?? stats?.totalPlanned ?? 0;
            const tasksCompleted = stats?.tasksCompleted ?? stats?.commitmentsCompleted ?? 0;
            const sessions = stats?.sessionCount ?? stats?.totalSessions ?? 0;
            const focusMinutes = stats?.focusMinutes ?? stats?.totalFocusMinutes ?? 0;
            const hasData = state !== "neutral" || tasksPlanned > 0 || sessions > 0 || focusMinutes > 0;

            const isSelected = selectedDate === productDate;
            const isToday = todayDate === productDate;

            // Subtle, elegant background tint for non-selected days with activity
            const stateBg = {
              successful: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] text-foreground hover:bg-emerald-500/[0.18]",
              partial: "bg-amber-500/[0.08] dark:bg-amber-500/[0.12] text-foreground hover:bg-amber-500/[0.18]",
              failed: "bg-rose-500/[0.08] dark:bg-rose-500/[0.12] text-foreground hover:bg-rose-500/[0.18]",
              neutral: "text-foreground/80 hover:bg-muted/50",
            }[state] ?? "text-foreground/80 hover:bg-muted/50";

            // Tooltip title for hover detail
            const tooltipParts = [productDate];
            if (tasksPlanned > 0) tooltipParts.push(`${tasksCompleted}/${tasksPlanned} tasks`);
            if (sessions > 0) tooltipParts.push(`${sessions} sessions`);
            if (focusMinutes > 0) tooltipParts.push(`${focusMinutes}m focused`);
            if (state !== "neutral") tooltipParts.push(state === "successful" ? "Done" : state === "partial" ? "Partial" : "Missed");

            return (
              <button
                key={productDate}
                type="button"
                data-testid={`day-cell-${productDate}`}
                data-state={state}
                aria-label={productDate}
                title={tooltipParts.join(" · ")}
                onClick={() => onSelectDate(productDate)}
                className={[
                  "group relative aspect-square w-full rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all duration-150 focus:outline-none select-none",
                  !isCurrentMonth
                    ? "text-muted-foreground/20 pointer-events-none"
                    : isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/30 scale-[1.05] z-10"
                    : isToday
                    ? "ring-1.5 ring-primary font-bold text-primary hover:bg-primary/10"
                    : hasData
                    ? `${stateBg}`
                    : "text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground",
                ].join(" ")}
              >
                <span className="leading-none tabular-nums text-[12px]">
                  {day}
                </span>

                {/* Elegant status dot indicator */}
                {isCurrentMonth && hasData && (
                  <span
                    className={[
                      "w-1 h-1 rounded-full mt-1 shrink-0 transition-transform group-hover:scale-125",
                      isSelected
                        ? "bg-primary-foreground"
                        : state === "successful"
                        ? "bg-emerald-500"
                        : state === "partial"
                        ? "bg-amber-500"
                        : state === "failed"
                        ? "bg-rose-500"
                        : "bg-muted-foreground/40",
                    ].join(" ")}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground/80 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
