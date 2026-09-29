import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PHASES } from "../../runtime/constants.js";
import { getUserScopedKey } from "@services/userStateService";
import { FocusHeader } from "./FocusHeader.jsx";
import { StandardWorkspace } from "./standard/StandardWorkspace.jsx";
import { ZenWorkspace } from "./zen/ZenWorkspace.jsx";
import { CustomWorkspace } from "./custom/CustomWorkspace.jsx";
import { FocusDrawers } from "./FocusDrawers.jsx";
import { SessionReview } from "../review/SessionReview.jsx";
import { AlertCircle, Loader2 } from "lucide-react";
import { createSegments } from "../../runtime/segmentUtils.js";

export const FocusWorkspace = ({
  userId,
  runtime,
  timerData,
  settings,
  modifySettings,
  notesProps,
  todos,
  newTodo,
  setNewTodo,
  onAddTodo,
  onUpdateTodoStatus,
  onDeleteTodo,
  sessionReview,
  onReviewUpdate,
  onDistractionToggle,
  onFinalSaveAndStartNew,
  navContext,
}) => {
  const containerRef = useRef(null);

  // Duration selection in IDLE state before start
  const [selectedDuration, setSelectedDuration] = useState(
    runtime.state.plannedDuration || 1500
  );

  useEffect(() => {
    if (runtime.state.plannedDuration) {
      setSelectedDuration(runtime.state.plannedDuration);
    }
  }, [runtime.state.plannedDuration]);

  const effectiveNavContext = useMemo(() => {
    if (navContext?.source) return navContext;
    if (runtime?.state?.source) return { ...navContext, source: runtime.state.source };
    return navContext;
  }, [navContext, runtime?.state?.source]);

  // Workspace mode: standard | zen | custom
  const modeKey = useMemo(
    () => getUserScopedKey("focus_workspace_mode_v3", userId),
    [userId]
  );

  const [workspaceMode, setWorkspaceModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(modeKey);
      if (saved === "standard" || saved === "zen" || saved === "custom") return saved;
    } catch {}
    return "standard";
  });

  const lastNonZenModeRef = useRef(
    workspaceMode === "zen" ? "standard" : workspaceMode
  );

  const setWorkspaceMode = useCallback(
    (newMode) => {
      if (newMode !== "zen") {
        lastNonZenModeRef.current = newMode;
      }
      setWorkspaceModeState(newMode);
      try {
        localStorage.setItem(modeKey, newMode);
      } catch {}
    },
    [modeKey]
  );

  const toggleZenMode = useCallback(() => {
    setWorkspaceMode(
      workspaceMode === "zen" ? lastNonZenModeRef.current : "zen"
    );
  }, [workspaceMode, setWorkspaceMode]);

  // Fullscreen support
  const [isDeepFocus, setIsDeepFocus] = useState(false);

  const toggleDeepFocus = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsDeepFocus(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  // Quotes banner toggle
  const [showQuotes, setShowQuotes] = useState(false);

  // Drawers state
  const [activeDrawers, setActiveDrawers] = useState({
    todos: false,
    notes: false,
    distraction: false,
    workflow: false,
    settings: false,
  });

  const toggleDrawer = useCallback((name) => {
    setActiveDrawers((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  const closeDrawer = useCallback((name) => {
    setActiveDrawers((prev) => ({
      ...prev,
      [name]: false,
    }));
  }, []);

  const {
    phase,
    saveStatus,
    completionError,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    isCompleting,
    commands,
  } = runtime;

  // Todo counts
  const todoCount = useMemo(
    () => ({
      completed: todos.filter((t) => t.status === "Completed").length,
      total: todos.length,
    }),
    [todos]
  );

  // Primary controls actions
  const handleStart = useCallback(() => {
    if (isIdle) {
      const s = settings;
      const segs = createSegments(
        selectedDuration,
        s.breakDuration ?? 5 * 60,
        s.breaksNumber ?? 4
      );
      commands.start(segs);
    } else {
      commands.start();
    }
  }, [isIdle, selectedDuration, settings, commands]);

  const handleStartPause = useCallback(() => {
    if (isRunning) {
      commands.pause();
    } else if (isPaused) {
      commands.resume();
    } else {
      handleStart();
    }
  }, [isRunning, isPaused, commands, handleStart]);

  const handleStop = useCallback(() => {
    if (settings.confirmReset && isRunning) {
      if (!window.confirm("Stop and discard the current session?")) return;
    }
    commands.stop();
  }, [settings.confirmReset, isRunning, commands]);

  const handleReset = useCallback(() => {
    if (settings.confirmReset && (isRunning || isPaused)) {
      if (!window.confirm("Reset the current session back to start?")) return;
    }
    commands.reset();
  }, [settings.confirmReset, isRunning, isPaused, commands]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping =
        /^(input|textarea)$/i.test(e.target.tagName) ||
        e.target.isContentEditable ||
        e.target.closest(".ProseMirror");

      if (isTyping) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleStartPause();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        toggleZenMode();
      } else if (e.key === "F11") {
        e.preventDefault();
        toggleDeepFocus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStartPause, handleReset, toggleZenMode, toggleDeepFocus]);

  // Loading state
  if (phase === PHASES.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading Focus workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col bg-background text-foreground overflow-x-hidden select-none"
    >
      {/* Header hidden in Zen mode */}
      {workspaceMode !== "zen" && (
        <FocusHeader
          isDeepFocus={isDeepFocus}
          toggleDeepFocus={toggleDeepFocus}
          workspaceMode={workspaceMode}
          setWorkspaceMode={setWorkspaceMode}
          toggleQuotes={() => setShowQuotes((q) => !q)}
          showQuotes={showQuotes}
          activeDrawers={activeDrawers}
          toggleDrawer={toggleDrawer}
          isRunning={isRunning}
          isPaused={isPaused}
          isIdle={isIdle}
          saveStatus={saveStatus}
          todoCount={todoCount}
        />
      )}

      <main className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-4 w-full relative z-10">
        {/* Completion review */}
        {isCompleted || isCompleting ? (
          <div className="w-full max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl animate-in zoom-in-95 duration-300">
            {isCompleting && completionError ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <AlertCircle className="text-destructive w-10 h-10" />
                <h3 className="text-lg font-bold">Sync Failed</h3>
                <p className="text-xs text-muted-foreground">{completionError}</p>
                <button
                  onClick={() => commands.retryComplete()}
                  className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-md"
                >
                  Retry Sync
                </button>
              </div>
            ) : (
              <SessionReview
                reviewData={sessionReview}
                onUpdate={onReviewUpdate}
                onDistractionToggle={onDistractionToggle}
                onNewSession={onFinalSaveAndStartNew}
              />
            )}
          </div>
        ) : workspaceMode === "zen" ? (
          <ZenWorkspace
            runtime={runtime}
            timerData={timerData}
            todos={todos}
            navContext={effectiveNavContext}
            handleStart={handleStart}
            handleStop={handleStop}
            handleReset={handleReset}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            toggleZenMode={toggleZenMode}
            onDistractionToggle={onDistractionToggle}
          />
        ) : workspaceMode === "custom" ? (
          <CustomWorkspace
            userId={userId}
            runtime={runtime}
            timerData={timerData}
            settings={settings}
            notesProps={notesProps}
            todos={todos}
            newTodo={newTodo}
            setNewTodo={setNewTodo}
            onAddTodo={onAddTodo}
            onUpdateTodoStatus={onUpdateTodoStatus}
            onDeleteTodo={onDeleteTodo}
            sessionReview={sessionReview}
            onDistractionToggle={onDistractionToggle}
            navContext={effectiveNavContext}
            handleStart={handleStart}
            handleStop={handleStop}
            handleReset={handleReset}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
          />
        ) : (
          <StandardWorkspace
            runtime={runtime}
            timerData={timerData}
            todos={todos}
            navContext={effectiveNavContext}
            handleStart={handleStart}
            handleStop={handleStop}
            handleReset={handleReset}
            selectedDuration={selectedDuration}
            setSelectedDuration={setSelectedDuration}
            showQuotes={showQuotes}
            setShowQuotes={setShowQuotes}
            showWorkflow={activeDrawers.workflow}
            setShowWorkflow={() => toggleDrawer("workflow")}
            onDistractionToggle={onDistractionToggle}
          />
        )}
      </main>

      {/* Drawers and modals */}
      <FocusDrawers
        activeDrawers={activeDrawers}
        closeDrawer={closeDrawer}
        todos={todos}
        newTodo={newTodo}
        setNewTodo={setNewTodo}
        onAddTodo={onAddTodo}
        onUpdateTodoStatus={onUpdateTodoStatus}
        onDeleteTodo={onDeleteTodo}
        runtime={runtime}
        notesProps={notesProps}
        settingsProps={{
          plannedDuration: runtime.state.plannedDuration,
          settings,
          onSave: modifySettings,
        }}
        sessionReview={sessionReview}
        onDistractionToggle={onDistractionToggle}
      />
    </div>
  );
};

export default FocusWorkspace;
