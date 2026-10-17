import React, { useState, useMemo, useCallback } from "react";
import { HistoryHeader } from "./components/HistoryHeader.jsx";
import { MonthlyCalendar } from "./components/MonthlyCalendar.jsx";
import { SelectedDaySummary } from "./components/SelectedDaySummary.jsx";
import { TaskOccurrenceList } from "./components/TaskOccurrenceList.jsx";
import { SessionHistoryList } from "./components/SessionHistoryList.jsx";
import { HistoryFilters } from "./components/HistoryFilters.jsx";
import { useMonthlyHistory, useDayHistory } from "./hooks/index.js";
import { EmptyState } from "./components/EmptyState.jsx";
import { Card } from "@/components/ui/card";
import {
  getTodayProductDate,
  parseProductDate,
  navigateMonth,
} from "./utils/dateUtils.js";
import { AlertTriangle, Zap, Target, Clock, CheckCircle2, Calendar } from "lucide-react";

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

  const { statsMap, isLoading: isLoadingMonthly, error: monthlyError, refetch: refetchMonthly } =
    useMonthlyHistory(currentYear, currentMonth);

  const {
    occurrences,
    sessions,
    pagination,
    isLoadingOccurrences,
    isLoadingSessions,
    error: dayError,
    refetchAll: refetchDay,
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

  const handleRefresh = useCallback(() => {
    refetchMonthly();
    refetchDay();
  }, [refetchMonthly, refetchDay]);

  const selectedDayStats = statsMap.get(selectedDate);
  const hasSessions = sessions?.length > 0;
  const sessionTotal = pagination.total ?? sessions.length;

  const computedStats = useMemo(() => {
    if (selectedDayStats?.totalFocusMinutes !== undefined && selectedDayStats?.totalFocusMinutes > 0) {
      return selectedDayStats;
    }
    const liveFocusMinutes = (sessions || []).reduce((acc, s) => {
      const mins = s.totalFocusMinutes ?? Math.round((s.duration || 0) / 60);
      return acc + mins;
    }, 0);
    return {
      ...(selectedDayStats || {}),
      totalFocusMinutes: liveFocusMinutes > 0 ? liveFocusMinutes : (selectedDayStats?.totalFocusMinutes ?? 0),
    };
  }, [selectedDayStats, sessions]);

  // Monthly Overview aggregate metrics directly from statsMap
  const monthOverview = useMemo(() => {
    let totalFocusMins = 0;
    let totalCompletedTasks = 0;
    let totalSessions = 0;
    let activeDaysCount = 0;

    for (const [dateKey, stat] of statsMap.entries()) {
      const isSelected = dateKey === selectedDate;
      const liveSessionsCount = isSelected ? (pagination?.total || sessions?.length || 0) : 0;
      const liveFocusMins = isSelected
        ? (sessions || []).reduce((acc, s) => acc + (s.totalFocusMinutes ?? Math.round((s.duration || 0) / 60)), 0)
        : 0;

      const focus = Math.max(Number(stat.focusMinutes ?? stat.totalFocusMinutes ?? 0), liveFocusMins);
      const completed = Number(stat.tasksCompleted ?? 0);
      const sess = Math.max(Number(stat.sessions ?? stat.sessionCount ?? stat.totalSessions ?? 0), liveSessionsCount);

      totalFocusMins += focus;
      totalCompletedTasks += completed;
      totalSessions += sess;
      if (focus > 0 || completed > 0 || sess > 0) {
        activeDaysCount++;
      }
    }

    const hours = Math.floor(totalFocusMins / 60);
    const mins = totalFocusMins % 60;
    const focusStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return {
      focusStr,
      totalCompletedTasks,
      totalSessions,
      activeDaysCount,
    };
  }, [statsMap, selectedDate, pagination, sessions]);

  const isDayEmpty =
    !isLoadingOccurrences &&
    !isLoadingSessions &&
    occurrences.length === 0 &&
    (!sessions || sessions.length === 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page container */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Header ── */}
        <HistoryHeader
          onRefresh={handleRefresh}
          isRefreshing={isLoadingMonthly || isLoadingOccurrences || isLoadingSessions}
        />

        {/* ── Monthly Overview KPI Banner ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="py-3 px-3.5 bg-card/60 border-border/60 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Month Focus
            </span>
            <p className="text-base font-bold font-mono text-foreground mt-1">{monthOverview.focusStr}</p>
          </Card>
          <Card className="py-3 px-3.5 bg-card/60 border-border/60 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tasks Done
            </span>
            <p className="text-base font-bold font-mono text-emerald-500 mt-1">{monthOverview.totalCompletedTasks}</p>
          </Card>
          <Card className="py-3 px-3.5 bg-card/60 border-border/60 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Sessions
            </span>
            <p className="text-base font-bold font-mono text-foreground mt-1">{monthOverview.totalSessions}</p>
          </Card>
          <Card className="py-3 px-3.5 bg-card/60 border-border/60 backdrop-blur-sm shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Active Days
            </span>
            <p className="text-base font-bold font-mono text-blue-500 mt-1">{monthOverview.activeDaysCount} days</p>
          </Card>
        </div>

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
              stats={computedStats}
              occurrenceCount={occurrences.length}
              sessionCount={sessionTotal}
            />

            {isDayEmpty ? (
              <EmptyState type="no_plan" />
            ) : (
              <>
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
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
