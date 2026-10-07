import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  useFocus,
  useFocusTimer,
  useFocusTasks,
  useNotes,
  FocusWorkspace,
  ActiveSessionPromptModal,
} from "@/features/focus";
import toast from "react-hot-toast";

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
  // Must NOT trigger while active session decision prompt is open!
  const canStartNew =
    (runtime.isIdle || runtime.isCompleted) && !runtime.pendingSessionPrompt;

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
    onUpdateTodoTitle,
  } = useFocusTasks({ runtime });

  // Scratchpad notes
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  const handleResumePrompt = () => {
    runtime.commands.resolveSessionPrompt("resume");
    toast.success("Resumed in-progress session");
  };

  const handleStartNewPrompt = () => {
    runtime.commands.resolveSessionPrompt("new");
    toast.success("Started fresh session");
  };

  return (
    <>
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
        onUpdateTodoTitle={onUpdateTodoTitle}
        sessionReview={sessionReview}
        onReviewUpdate={handleReviewUpdate}
        onDistractionToggle={handleDistractionToggle}
        onFinalSaveAndStartNew={handleFinalSaveAndStartNew}
        isSubmittingReview={isSubmittingReview}
        navContext={navContext}
      />

      {/* Cross-device / Reopened Session Choice Modal */}
      {runtime.pendingSessionPrompt && (
        <ActiveSessionPromptModal
          session={runtime.pendingSessionPrompt.session}
          incomingContext={runtime.pendingSessionPrompt.incomingContext}
          onResume={handleResumePrompt}
          onStartNew={handleStartNewPrompt}
        />
      )}
    </>
  );
};

export default FocusSession;
