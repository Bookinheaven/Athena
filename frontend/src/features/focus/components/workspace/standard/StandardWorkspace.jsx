import React, { useMemo } from "react";
import { FocusTaskCard } from "../../task/FocusTaskCard.jsx";
import { FocusTimerDisplay } from "../FocusTimerDisplay.jsx";
import { FocusControls } from "../FocusControls.jsx";
import { MotivationalBanner } from "../../shared/MotivationalBanner.jsx";

export const StandardWorkspace = ({
  runtime,
  timerData,
  todos,
  navContext,
  handleStart,
  handleStop,
  handleReset,
  selectedDuration,
  setSelectedDuration,
  showQuotes,
  setShowQuotes,
  onDistractionToggle,
  onUpdateTodoTitle,
}) => {
  const {
    phase,
    sessionTitle,
    currentSegment,
    segmentIndex,
    segments,
    isRunning,
    isPaused,
    isIdle,
    isCompleting,
    commands,
    state,
  } = runtime;

  const { timeLeft, elapsed } = timerData;

  const totalFocusSegments = segments.filter((s) => s.type === "focus").length || 1;
  const completedFocusSegments = segments.filter((s) => s.type === "focus" && s.completedAt).length;
  const totalBreakSegments = segments.filter((s) => s.type === "break").length || 0;
  const completedBreakSegments = segments.filter((s) => s.type === "break" && s.completedAt).length;

  const activeTaskTitle = useMemo(() => {
    if (sessionTitle && sessionTitle !== "Untitled Work") {
      return sessionTitle;
    }
    if (state.taskIds?.length > 0) {
      const task = todos?.find((t) => String(t.id || t._id) === String(state.taskIds[0]));
      if (task?.title) return task.title;
    }
    return navContext?.title || sessionTitle || "Focus Session";
  }, [sessionTitle, state.taskIds, todos, navContext?.title]);

  const handleUpdateTitle = (newTitle) => {
    const trimmed = newTitle?.trim();
    if (!trimmed) return;
    commands.setTitle(trimmed);
    const linkedTaskId = state.taskIds?.[0];
    if (linkedTaskId && onUpdateTodoTitle) {
      onUpdateTodoTitle(linkedTaskId, trimmed);
    }
  };

  return (
    <div className="w-full flex flex-col items-center max-w-3xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <FocusTaskCard
        taskTitle={activeTaskTitle}
        setTaskTitle={handleUpdateTitle}
        navContext={navContext}
        isScheduled={state.isScheduled}
        scheduleBlock={state.scheduleBlockId}
        currentSegment={currentSegment}
        segmentIndex={segmentIndex}
        totalSegments={segments.length}
        totalFocusSegments={totalFocusSegments}
        totalBreakSegments={totalBreakSegments}
        plannedDuration={state.plannedDuration}
        todos={todos}
      />

      <FocusTimerDisplay
        timeLeft={isIdle && elapsed === 0 ? selectedDuration : timeLeft}
        elapsed={elapsed}
        currentSegment={currentSegment}
        isIdle={isIdle}
        isRunning={isRunning}
        plannedDuration={selectedDuration}
        onSelectDuration={(d) => setSelectedDuration(d)}
        totalFocusSegments={totalFocusSegments}
        completedFocusSegments={completedFocusSegments}
        totalBreakSegments={totalBreakSegments}
        completedBreakSegments={completedBreakSegments}
      />

      <FocusControls
        phase={phase}
        isRunning={isRunning}
        isPaused={isPaused}
        isCompleting={isCompleting}
        currentSegment={currentSegment}
        onStart={handleStart}
        onPause={() => commands.pause()}
        onResume={() => commands.resume()}
        onStop={handleStop}
        onReset={handleReset}
        onSkipBreak={() => commands.skipBreak()}
        onSelectPauseReason={(reason) => onDistractionToggle(reason)}
      />

      <MotivationalBanner
        show={showQuotes}
        onClose={() => setShowQuotes(false)}
      />
    </div>
  );
};

export default StandardWorkspace;
