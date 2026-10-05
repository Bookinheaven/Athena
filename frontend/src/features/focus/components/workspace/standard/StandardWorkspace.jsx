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
    if (state.taskIds?.length > 0) {
      const task = todos.find((t) => String(t.id) === String(state.taskIds[0]));
      return task?.title ?? navContext?.title ?? sessionTitle;
    }
    return sessionTitle;
  }, [state.taskIds, todos, navContext?.title, sessionTitle]);

  return (
    <div className="w-full flex flex-col items-center max-w-3xl mx-auto px-4 py-4 animate-in fade-in duration-300">
      <FocusTaskCard
        taskTitle={activeTaskTitle}
        setTaskTitle={(t) => commands.setTitle(t)}
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
