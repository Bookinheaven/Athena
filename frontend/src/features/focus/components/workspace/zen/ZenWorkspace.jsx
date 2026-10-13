import React, { useMemo } from "react";
import { FocusTimerDisplay } from "../FocusTimerDisplay.jsx";
import { FocusControls } from "../FocusControls.jsx";
import { FocusTaskCard } from "../../task/FocusTaskCard.jsx";
import { Eye } from "lucide-react";

export const ZenWorkspace = ({
  runtime,
  timerData,
  todos,
  navContext,
  handleStart,
  handleStop,
  handleReset,
  selectedDuration,
  setSelectedDuration,
  toggleZenMode,
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
    isCompleted,
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
    <div className="relative w-full flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto select-none animate-in fade-in duration-500">
      <div className="absolute top-0 right-4 z-40">
        <button
          type="button"
          onClick={toggleZenMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-sm"
          title="Exit Zen Mode (Z)"
        >
          <Eye size={13} />
          <span>Exit Zen</span>
          <kbd className="text-[10px] opacity-60">Z</kbd>
        </button>
      </div>

      <div className="w-full mb-2">
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
      </div>

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
    </div>
  );
};

export default ZenWorkspace;
