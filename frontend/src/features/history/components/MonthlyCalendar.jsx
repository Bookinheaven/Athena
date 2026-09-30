import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getMonthGrid, formatMonthYear } from "../utils/dateUtils.js";

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
    <div className="rounded-xl border border-border bg-card">
      {/* Month navigation row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">
            {formatMonthYear(year, month)}
          </span>
          {isLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onGoToToday}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onNavigateMonth(-1)}
            aria-label="Previous month"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateMonth(1)}
            aria-label="Next month"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-2 pb-2 pt-1.5">
        {/* Weekday labels */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-medium text-muted-foreground/50 py-0.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {gridCells.map((dayObj) => {
            const { day, isCurrentMonth, productDate } = dayObj;
            const stats = statsMap.get(productDate);

            const tasksPlanned = stats?.tasksPlanned ?? 0;
            const tasksRescheduled = stats?.tasksRescheduled ?? 0;
            const tasksCancelled = stats?.tasksCancelled ?? 0;
            const effectivePlanned = tasksPlanned - tasksRescheduled - tasksCancelled;
            const sessions = stats?.totalSessions ?? 0;
            const hasData = effectivePlanned > 0 || sessions > 0;

            const state = stats?.state ?? "neutral";
            const isSelected = selectedDate === productDate;
            const isToday = todayDate === productDate;

            // State-based tint background — subtle, applied to non-selected days with data
            const stateBg = {
              successful: "bg-emerald-500/10",
              partial: "bg-amber-500/10",
              failed: "bg-rose-500/10",
              neutral: "",
            }[state] ?? "";

            // Small count summary to show inside the cell
            const countLabel =
              effectivePlanned > 0 && sessions > 0
                ? `${effectivePlanned}t ${sessions}s`
                : effectivePlanned > 0
                ? `${effectivePlanned}t`
                : sessions > 0
                ? `${sessions}s`
                : null;

            return (
              <button
                key={productDate}
                type="button"
                data-testid={`day-cell-${productDate}`}
                data-state={state}
                aria-label={productDate}
                onClick={() => onSelectDate(productDate)}
                className={[
                  "flex flex-col items-center justify-center h-8 rounded text-[11px] font-medium transition-colors focus:outline-none select-none",
                  !isCurrentMonth
                    ? "text-muted-foreground/20 pointer-events-none"
                    : isSelected
                    ? "bg-foreground text-background font-semibold"
                    : isToday
                    ? "ring-1 ring-inset ring-primary text-primary hover:bg-primary/10"
                    : hasData
                    ? `${stateBg} text-foreground/90 hover:brightness-125`
                    : "text-foreground/70 hover:bg-muted",
                ].join(" ")}
              >
                <span>{day}</span>
                {/* Count — only for current month, non-selected, with data */}
                {isCurrentMonth && hasData && !isSelected && countLabel && (
                  <span
                    className={[
                      "text-[8px] leading-none font-medium tabular-nums",
                      state === "successful"
                        ? "text-emerald-500/70"
                        : state === "partial"
                        ? "text-amber-500/70"
                        : state === "failed"
                        ? "text-rose-500/70"
                        : "text-muted-foreground/50",
                    ].join(" ")}
                  >
                    {countLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-border/50">
          {[
            ["bg-emerald-500/10 ring-1 ring-emerald-500/30", "text-emerald-500/70", "Done"],
            ["bg-amber-500/10 ring-1 ring-amber-500/30", "text-amber-500/70", "Partial"],
            ["bg-rose-500/10 ring-1 ring-rose-500/30", "text-rose-500/70", "Missed"],
          ].map(([bg, tc, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm inline-block ${bg}`} />
              <span className={`text-[10px] ${tc}`}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
