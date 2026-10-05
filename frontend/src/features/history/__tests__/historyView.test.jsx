import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  formatProductDate,
  parseProductDate,
  formatDisplayDate,
  formatMonthYear,
  navigateMonth,
  getMonthGrid,
  formatDuration,
  formatTimeRange,
  formatTimeOnly,
} from "../utils/dateUtils.js";
import { DayCell } from "../components/DayCell.jsx";
import { MonthlyCalendar } from "../components/MonthlyCalendar.jsx";
import { SelectedDaySummary } from "../components/SelectedDaySummary.jsx";
import { TaskOccurrenceList } from "../components/TaskOccurrenceList.jsx";
import { SessionHistoryList } from "../components/SessionHistoryList.jsx";
import { EmptyState } from "../components/EmptyState.jsx";

describe("History V2 - Date & Calendar Utilities", () => {
  it("formats and parses product dates consistently without UTC shift", () => {
    const pDate = formatProductDate(2026, 9, 29);
    expect(pDate).toBe("2026-09-29");

    const parts = parseProductDate("2026-09-29");
    expect(parts).toEqual({ year: 2026, month: 9, day: 29 });
  });

  it("navigates months accurately across year boundaries", () => {
    expect(navigateMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(navigateMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(navigateMonth(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
  });

  it("generates a Monday-first calendar grid with correct cell count", () => {
    // September 2026 (30 days, starts on Tuesday -> 1 padding day on Mon)
    const grid = getMonthGrid(2026, 9);
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(30);

    const currentMonthCells = grid.filter((c) => c.isCurrentMonth);
    expect(currentMonthCells.length).toBe(30);
    expect(currentMonthCells[0].productDate).toBe("2026-09-01");
    expect(currentMonthCells[29].productDate).toBe("2026-09-30");
  });

  it("formats duration into human-readable strings", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(1500)).toBe("25m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("formats time ranges and display titles", () => {
    expect(formatTimeRange("09:00", "10:30")).toBe("09:00 – 10:30");
    expect(formatTimeRange("09:00", null)).toBe("09:00");
    expect(formatMonthYear(2026, 9)).toBe("September 2026");
  });
});

describe("History V2 - Day State Rendering", () => {
  const dayObj = {
    day: 15,
    year: 2026,
    month: 9,
    productDate: "2026-09-15",
    isCurrentMonth: true,
  };

  it("renders successful state (green) for day with >= 80% completion", () => {
    const stats = {
      state: "successful",
      tasksPlanned: 5,
      tasksCompleted: 4,
      tasksPartiallyCompleted: 1,
      tasksRescheduled: 0,
      tasksCancelled: 0,
      totalFocusMinutes: 120,
    };

    const html = renderToString(
      <DayCell
        dayObj={dayObj}
        stats={stats}
        isSelected={false}
        isToday={false}
        onClick={() => {}}
      />
    );

    expect(html).toContain('data-state="successful"');
    expect(html).toContain("4/5");
  });

  it("renders partial state (yellow) for partially completed day", () => {
    const stats = {
      state: "partial",
      tasksPlanned: 4,
      tasksCompleted: 1,
      tasksPartiallyCompleted: 1,
      tasksRescheduled: 0,
      tasksCancelled: 0,
      totalFocusMinutes: 60,
    };

    const html = renderToString(
      <DayCell
        dayObj={dayObj}
        stats={stats}
        isSelected={false}
        isToday={false}
        onClick={() => {}}
      />
    );

    expect(html).toContain('data-state="partial"');
    expect(html).toContain("1/4");
  });

  it("renders failed/missed state (red) when planned tasks were not completed", () => {
    const stats = {
      state: "failed",
      tasksPlanned: 3,
      tasksCompleted: 0,
      tasksPartiallyCompleted: 0,
      tasksMissed: 3,
      totalFocusMinutes: 0,
    };

    const html = renderToString(
      <DayCell
        dayObj={dayObj}
        stats={stats}
        isSelected={false}
        isToday={false}
        onClick={() => {}}
      />
    );

    expect(html).toContain('data-state="failed"');
    expect(html).toContain("0/3");
  });

  it("renders neutral state when no effective plan existed", () => {
    const stats = {
      state: "neutral",
      tasksPlanned: 0,
      tasksCompleted: 0,
      totalFocusMinutes: 0,
    };

    const html = renderToString(
      <DayCell
        dayObj={dayObj}
        stats={stats}
        isSelected={false}
        isToday={false}
        onClick={() => {}}
      />
    );

    expect(html).toContain('data-state="neutral"');
    expect(html).toContain("·");
  });
});

describe("History V2 - Selected Day Summary (Plan Outcome vs Focus Activity)", () => {
  it("clearly separates plan outcome metrics from focus telemetry without combining into a score", () => {
    const stats = {
      state: "successful",
      tasksPlanned: 6,
      tasksCompleted: 4,
      tasksPartiallyCompleted: 1,
      tasksMissed: 0,
      tasksRescheduled: 1,
      tasksCancelled: 0,
      totalFocusMinutes: 135,
    };

    const html = renderToString(
      <SelectedDaySummary
        productDate="2026-09-29"
        stats={stats}
        occurrenceCount={6}
        sessionCount={4}
      />
    );

    // Journal-style secondary line: "4/5 tasks done · 1 partial · 4 sessions · 2h 15m focused"
    expect(html).toContain("4/5 tasks done");
    expect(html).toContain("1 partial");
    expect(html).toContain("4 sessions");
    expect(html).toContain("2h 15m focused");
    // State label
    expect(html).toContain("All done");
  });

  it("shows neutral messaging when day had no effective plan, avoiding '0% productivity'", () => {
    const stats = {
      state: "neutral",
      tasksPlanned: 0,
      tasksCompleted: 0,
      totalFocusMinutes: 45,
    };

    const html = renderToString(
      <SelectedDaySummary
        productDate="2026-09-28"
        stats={stats}
        occurrenceCount={0}
        sessionCount={1}
      />
    );

    expect(html).toContain("No planned work");
    expect(html).not.toContain("0% productivity");
    expect(html).toContain("45m");
  });
});

describe("History V2 - Task Occurrence & Session History Rendering", () => {
  it("renders task occurrence using immutable taskSnapshot title and priority even if task is deleted", () => {
    const occurrences = [
      {
        _id: "occ-1",
        taskId: null, // Task deleted from active database
        taskSnapshot: {
          title: "Architecture Document Review",
          priority: "High",
          category: "Engineering",
        },
        outcome: "completed",
        completedAt: "2026-09-29T10:15:00.000Z",
      },
      {
        _id: "occ-2",
        taskId: "task-2",
        taskSnapshot: {
          title: "Database Index Migration",
          priority: "Medium",
        },
        outcome: "rescheduled",
        rescheduledToDate: "2026-09-30",
        notes: "Moved due to cluster maintenance",
      },
    ];

    const html = renderToString(
      <TaskOccurrenceList occurrences={occurrences} isLoading={false} />
    );

    // Snapshot title preserved
    expect(html).toContain("Architecture Document Review");
    expect(html).toContain("archived");
    expect(html).toContain("Completed");

    // Rescheduled destination and notes preserved
    expect(html).toContain("Database Index Migration");
    expect(html).toContain("2026-09-30");
    expect(html).toContain("Moved due to cluster maintenance");
  });

  it("renders session history with scheduleSnapshot details and handles legacy sessions safely", () => {
    const sessions = [
      {
        _id: "sess-1",
        title: "Focus Block",
        duration: 1800,
        completionType: "completed",
        scheduleSnapshot: {
          blockId: "block-1",
          taskTitle: "Scheduled Feature Build",
          startTime: "14:00",
          endTime: "14:30",
          plannedDurationMinutes: 30,
        },
        sessionStats: {
          focusSegmentsCompleted: 1,
          breakSegmentsCompleted: 0,
          interruptions: 0,
        },
      },
      {
        _id: "sess-legacy",
        title: "Legacy Ad-Hoc Session",
        duration: 900,
        completionType: "partial",
        // No scheduleSnapshot
        sessionStats: {
          focusSegmentsCompleted: 1,
          breakSegmentsCompleted: 0,
          interruptions: 2,
        },
      },
    ];

    const html = renderToString(
      <SessionHistoryList
        sessions={sessions}
        pagination={{ page: 1, totalPages: 1, total: 2 }}
        isLoading={false}
      />
    );

    // Snapshot session — planned duration no longer in rows (it's in detail drawer)
    expect(html).toContain("Scheduled Feature Build");
    expect(html).toContain("scheduled");
    expect(html).toContain("14:00 – 14:30");

    // Legacy session without scheduleSnapshot
    expect(html).toContain("Legacy Ad-Hoc Session");
    expect(html).toContain("2 pauses");
    expect(html).toContain("Partial");
  });
});

describe("History V2 - Empty States", () => {
  it("renders intentional neutral message for empty days", () => {
    const html = renderToString(<EmptyState type="no_plan" />);
    expect(html).toContain("Neutral Day");
    expect(html).toContain("Streak remains neutral and unaffected");
  });

  it("renders appropriate message when tasks were planned but no sessions were run", () => {
    const html = renderToString(<EmptyState type="plan_no_sessions" />);
    expect(html).toContain("No Sessions Executed");
  });
});
