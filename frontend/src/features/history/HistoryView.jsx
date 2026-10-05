import React, { useState, useMemo, useCallback } from "react";
import { HistoryHeader } from "./components/HistoryHeader.jsx";
import { MonthlyCalendar } from "./components/MonthlyCalendar.jsx";
import { SelectedDaySummary } from "./components/SelectedDaySummary.jsx";
import { TaskOccurrenceList } from "./components/TaskOccurrenceList.jsx";
import { SessionHistoryList } from "./components/SessionHistoryList.jsx";
import { HistoryFilters } from "./components/HistoryFilters.jsx";
import { useMonthlyHistory, useDayHistory } from "./hooks/index.js";
import {
  getTodayProductDate,
  parseProductDate,
  navigateMonth,
} from "./utils/dateUtils.js";
import { AlertTriangle, Zap, Target } from "lucide-react";

// ─── Main HistoryView ─────────────────────────────────────────────────────────
export function HistoryView() {
  const todayDate = useMemo(() => getTodayProductDate(), []);
  const { year: initYear, month: initMonth } = useMemo(
    () => parseProductDate(todayDate),
    [todayDate]
  );

  const [currentYear, setCurrentYear] = useState(initYear);
  const [currentMonth, setCurrentMonth] = useState(initMonth);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionFilters, setSessionFilters] = useState({
    completionType: "all",
  });

  const { statsMap, isLoading: isLoadingMonthly, error: monthlyError } =
    useMonthlyHistory(currentYear, currentMonth);

  const {
    occurrences,
    sessions,
    pagination,
    isLoadingOccurrences,
    isLoadingSessions,
    error: dayError,
  } = useDayHistory(selectedDate, sessionPage, sessionFilters);

  const handleNavigateMonth = useCallback(
    (delta) => {
      const { year, month } = navigateMonth(currentYear, currentMonth, delta);
      setCurrentYear(year);
      setCurrentMonth(month);
    },
    [currentYear, currentMonth]
  );

  const handleGoToToday = useCallback(() => {
    const { year, month } = parseProductDate(todayDate);
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDate(todayDate);
    setSessionPage(1);
  }, [todayDate]);

  // Changing day resets the session page; inline expansion resets inside
  // SessionHistoryList (it holds its own expandedId state).
  const handleSelectDate = useCallback((date) => {
    setSelectedDate(date);
    setSessionPage(1);
  }, []);

  const selectedDayStats = statsMap.get(selectedDate);
  const hasSessions = sessions?.length > 0;
  const sessionTotal = pagination.total ?? sessions.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page container */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ── */}
        <HistoryHeader />

        {/* ── Error ── */}
        {(monthlyError || dayError) && (
          <div className="flex items-center gap-2 text-xs text-rose-500 py-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {monthlyError || dayError}
          </div>
        )}

        {/* ── Main: two-column on desktop ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 lg:gap-10 items-start">

          {/* ── Left: Calendar ── */}
          <div className="lg:sticky lg:top-6">
            <MonthlyCalendar
              year={currentYear}
              month={currentMonth}
              selectedDate={selectedDate}
              todayDate={todayDate}
              statsMap={statsMap}
              isLoading={isLoadingMonthly}
              onSelectDate={handleSelectDate}
              onNavigateMonth={handleNavigateMonth}
              onGoToToday={handleGoToToday}
            />
          </div>

          {/* ── Right: Journal content ── */}
          <div className="space-y-6 min-w-0">

            {/* Day summary */}
            <SelectedDaySummary
              productDate={selectedDate}
              stats={selectedDayStats}
              occurrenceCount={occurrences.length}
              sessionCount={sessionTotal}
            />

            {/* ── Planned Tasks ── */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Planned Tasks
                {occurrences.length > 0 && (
                  <span className="font-normal text-muted-foreground/60">
                    ({occurrences.length})
                  </span>
                )}
              </h2>
              <TaskOccurrenceList
                occurrences={occurrences}
                isLoading={isLoadingOccurrences}
              />
            </section>

            {/* ── Focus Sessions ── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Focus Sessions
                  {sessionTotal > 0 && (
                    <span className="font-normal text-muted-foreground/60">
                      ({sessionTotal})
                    </span>
                  )}
                </h2>
                {hasSessions && (
                  <HistoryFilters
                    completionType={sessionFilters.completionType}
                    onCompletionTypeChange={(val) => {
                      setSessionFilters((p) => ({
                        ...p,
                        completionType: val,
                      }));
                      setSessionPage(1);
                    }}
                  />
                )}
              </div>
              <SessionHistoryList
                sessions={sessions}
                pagination={pagination}
                isLoading={isLoadingSessions}
                onPageChange={setSessionPage}
              />
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
