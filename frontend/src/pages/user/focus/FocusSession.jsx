import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  useFocus,
  useFocusTimer,
  useFocusTasks,
  useNotes,
  FocusWorkspace,
} from "@/features/focus";

const FocusSession = () => {
  const location = useLocation();
  const {
    runtime,
    settings,
    modifySettings,
    resetSettings,
    userId,
    sessionReview,
    updateReview: handleReviewUpdate,
    toggleReviewDistraction: handleDistractionToggle,
    submitSessionReview: handleFinalSaveAndStartNew,
    isSubmittingReview,
  } = useFocus();

  // Navigation context passed by Today / Planner / Timeline
  const navContext = location.state || null;
  const navContextHandledRef = useRef(null);

  // Explicit user intent to start a new task session
  const isExplicitTaskRequest = Boolean(
    navContext &&
      navContext.source &&
      (navContext.title || (navContext.taskIds && navContext.taskIds.length > 0))
  );

  // If arriving with navigation context and runtime can accept new session (idle or completed)
  const canStartNew = runtime.isIdle || runtime.isCompleted;

  useEffect(() => {
    if (navContext && canStartNew && navContextHandledRef.current !== navContext) {
      navContextHandledRef.current = navContext;
      runtime.commands.startWithContext(navContext);
      try {
        window.history.replaceState({}, document.title);
      } catch {}
    }
  }, [navContext, canStartNew, runtime.commands]);

  // RAF-driven timer clock for display
  const { elapsed, timeLeft } = useFocusTimer({
    timerRef: runtime.timerRef,
    runtimeState: runtime.state,
  });

  // Dedicated task hydration and checklist hook
  const {
    allTasks,
    todos,
    newTodo,
    setNewTodo,
    onAddTodo,
    onUpdateTodoStatus,
    onDeleteTodo,
  } = useFocusTasks({ runtime });

  // Scratchpad notes
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  return (
    <FocusWorkspace
      userId={userId}
      runtime={runtime}
      timerData={{ elapsed, timeLeft }}
      settings={settings}
      modifySettings={modifySettings}
      resetSettings={resetSettings}
      notesProps={{
        notes,
        tasks: allTasks,
        createNote,
        updateNote,
        deleteNote,
      }}
      todos={todos}
      newTodo={newTodo}
      setNewTodo={setNewTodo}
      onAddTodo={onAddTodo}
      onUpdateTodoStatus={onUpdateTodoStatus}
      onDeleteTodo={onDeleteTodo}
      sessionReview={sessionReview}
      onReviewUpdate={handleReviewUpdate}
      onDistractionToggle={handleDistractionToggle}
      onFinalSaveAndStartNew={handleFinalSaveAndStartNew}
      isSubmittingReview={isSubmittingReview}
      navContext={navContext}
    />
  );
};

export default FocusSession;
