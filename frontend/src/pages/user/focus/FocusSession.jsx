import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import createSessionData from "./hooks/useSessionData";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSessionStorage } from "./hooks/useSessionStorage";
import { Settings } from "./components/Setting";
import { Timer } from "./components/Timer";
import { TodoList } from "./components/TodoList";
import MotivationalQuotes from "./components/MotivationalQuotes";
import CurrentProgress from "./components/CurrentProgress";
import Notes from "./components/Notes.jsx";
import { SessionReview } from "./components/SessionReview";
import sessionService from "../../../../services/sessionService";
import taskService from "../../../../services/taskService";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useLocation } from "react-router-dom";
import HeaderNav from "./components/FocusHeader.jsx";
import userService from "../../../../services/userService.js";
import { useNotes } from "./hooks/useNotes.js";
import { useSessionController } from "./hooks/useSessionController.js";
import { useFocusSessionInit } from "./hooks/useFocusSessionInit.js";
import { useSessionSettings } from "./hooks/useSessionSettings.js";
import { DraggablePanel } from "./components/DraggablePanel.jsx";
import { WorkflowDock } from "./components/WorkflowDock.jsx";

const FocusSession = () => {
  const location = useLocation();
  const plannerData = location.state || null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const dragControlsHeader = useDragControls();
  const dragControlsTimer = useDragControls();
  const dragControlsNotes = useDragControls();
  const dragControlsTodos = useDragControls();
  const dragControlsProgress = useDragControls();
  const dragControlsSettings = useDragControls();
  const dragControlsWorkflow = useDragControls();

  const [showQuotes, setShowQuotes] = useState(false);
  const [activePanels, setActivePanels] = useState({
    notes: false,
    todos: false,
    settings: false,
    progress: false,
    workflow: false,
  });

  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const toggleLayoutMode = useCallback(() => {
    setIsLayoutMode((prev) => !prev);
  }, []);

  const [layoutPreset, setLayoutPreset] = useLocalStorage("focus-layout", "default");
  
  const getPanelPosition = useCallback((panelName) => {
    switch (layoutPreset) {
      case "split":
        return {
          header: { x: 0, y: -30 },
          timer: { x: 0, y: -20 },
          notes: { x: 400, y: 0 },
          todos: { x: -400, y: 0 },
          progress: { x: -400, y: 200 },
          settings: { x: 0, y: 200 },
          workflow: { x: 0, y: 350 },
        }[panelName];
      case "zen":
        return {
          header: { x: 0, y: -30 },
          timer: { x: 0, y: 0 },
          notes: { x: 800, y: 0 },
          todos: { x: -800, y: 0 },
          progress: { x: 0, y: 500 },
          settings: { x: 0, y: -500 },
          workflow: { x: 0, y: 500 },
        }[panelName];
      case "custom":
        return {
          header: { x: 0, y: -30 },
          timer: { x: 0, y: 0 },
          notes: { x: 0, y: 0 },
          todos: { x: 0, y: 0 },
          progress: { x: 0, y: 0 },
          settings: { x: 0, y: 0 },
          workflow: { x: 0, y: 0 },
        }[panelName];
      default: // "default"
        return {
          header: { x: 0, y: -30 },
          timer: { x: 0, y: 0 },
          notes: { x: 300, y: 0 },
          todos: { x: -300, y: 0 },
          progress: { x: -300, y: 200 },
          settings: { x: 0, y: 200 },
          workflow: { x: 0, y: 350 },
        }[panelName];
    }
  }, [layoutPreset]);

  // Intelligent Layout Visibilities
  useEffect(() => {
    switch (layoutPreset) {
      case "default":
      case "split":
        setActivePanels((prev) => ({
          ...prev,
          notes: true,
          todos: true,
          workflow: true,
        }));
        setShowQuotes(true);
        break;
      case "zen":
        setActivePanels({
          notes: false,
          todos: false,
          settings: false,
          progress: false,
          workflow: false,
        });
        setShowQuotes(false);
        break;
      case "custom":
        break;
    }
  }, [layoutPreset]);

  const togglePanel = useCallback((panelName) => {
    setActivePanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const containerRef = useRef(null);

  const {
    settings,
    setBreakDuration,
    setAutoStartBreaks,
    setBreaksNumber,
    setSkipBreaks,
    setConfirmReset,
    setSoundOnTransition,
    setIsSoundEnabled,
  } = useSessionSettings();

  const [sessionStats, setSessionStats] = useSessionStorage("sessionStats",
    {
      breakSegmentsCompleted: 0,
      focusSegmentsCompleted: 0,
      interruptions: 0,
      pauseCount: 0,
      totalPauseDuration: 0,
    },
  );

  const [sessionPlannedDuration, setSessionPlannedDuration] = useLocalStorage(
    "sessionPlannedDuration",
    25 * 60,
  );
  const { notes, createNote, updateNote, deleteNote } = useNotes();

  const [newTodo, setNewTodo] = useState("");
  const [sessionTitle, setSessionTitle] = useState("Untitled Work");
  const [newSession, setNewSession] = useState(false);
  const [sessionReview, setSessionReview] = useSessionStorage("sessionReview", {
    mood: null,
    focus: null,
    distractions: "",
  });

  const initialSession = useCallback(() => {
    const isFromPlanner = !!plannerData?.taskIds;
    const safeTotalFocus = isFromPlanner
      ? plannerData?.plannedDuration || sessionPlannedDuration || 25 * 60
      : sessionPlannedDuration || 25 * 60;
    const safeBreak = settings.breakDuration ?? 5 * 60;
    const safeBreaksNum = settings.breaksNumber ?? 4;
    const segments = createSessionData(
      safeTotalFocus,
      safeBreak,
      safeBreaksNum,
    );
    return {
      sessionId: uuidv4(),
      title: plannerData?.title ? `${plannerData?.title} Session` : "Untitled Work",
      segmentIndex: 0,
      totalBreaks: segments.filter((s) => s.type === "break").length,
      breakDuration: safeBreak,
      maxBreaks: safeBreaksNum,
      backendCreated: false,
      currentDuration: 0,
      plannedDuration: isFromPlanner
        ? plannerData?.plannedDuration || sessionPlannedDuration || 25 * 60
        : safeTotalFocus,
      segments,
      taskIds: plannerData?.taskIds || [],
      sessionType: plannerData?.taskIds ? "task" : "quick",
      todos: plannerData?.title 
        ? [
          {
            id: Date.now(),
            title: `${plannerData?.title} Main Task`,
            status: "Not Started",
            createdAt: new Date().toISOString(),
          },
        ]
        : [],
      timestamp: new Date().toISOString(),
    };
  }, [
    plannerData,
    sessionPlannedDuration,
    settings.breakDuration,
    settings.breaksNumber,
  ]);

  const [sessionData, setSessionData] = useSessionStorage(
    "sessionData",
    initialSession,
  );
  const isPlannerSession =
    sessionData?.sessionType === "task" || sessionData?.taskIds?.length > 0;
  const todos = sessionData.todos || [];

  const activeTaskTitle = useMemo(() => {
    if (sessionData?.taskIds?.length > 0) {
      const task = todos.find(t => String(t.id) === String(sessionData.taskIds[0]));
      return task ? task.title : plannerData?.title || null;
    }
    return null;
  }, [sessionData?.taskIds, todos, plannerData?.title]);

  const modifySettings = async (changed) => {
    const merged = {
      ...settings,
      ...changed,
    };
    try {
      await userService.updateSettings(merged, "session");
    } catch (err) {
      console.error("Settings update failed:", err);
    }
  };

  const {
    machineState,
    dispatch,
    currentSegment,
    segmentIndex,
    elapsed,
    timeLeft,
    saveStatus,
    forceSave,
    onTitleSet,
    onTodoChange,
    onReset,
    buildPayload,
  } = useSessionController({
    sessionData,
    setSessionData,
    saveFunction: (payload) => sessionService.updateProgress(payload),
    autoStartBreaks: settings?.autoStartBreaks,
    skipBreaks: settings.skipBreaks,
    soundOnTransition: settings.soundOnTransition,
    todos: sessionData.todos,
    sessionStats,
    setSessionStats,
  });
  const isRunning = machineState.status === "running";

  const resetSession = () => {
    if (settings.confirmReset && isRunning) {
      if (
        !window.confirm(
          "Reset the current session? Your progress will be lost.",
        )
      )
        return;
    }
    const fresh = initialSession();
    setSessionData(fresh);
    setSessionTitle(fresh.title || "Untitled Work");
    setSessionReview({ mood: null, focus: null, distractions: "" });
    dispatch({ type: "RESET" });
    onReset();
  };

  const stopSession = () => {
    if (settings.confirmReset && isRunning) {
      if (
        !window.confirm(
          "Stop the current session? Your progress will be lost.",
        )
      )
        return;
    }
    const fresh = initialSession();
    setSessionData(fresh);
    setSessionTitle(fresh.title || "Untitled Work");
    setSessionReview({ mood: null, focus: null, distractions: "" });
    dispatch({ type: "STOP" });
    onReset();
  };

  const updateTodos = (newTodos) => {
    setSessionData((prev) => ({
      ...prev,
      todos: newTodos,
    }));
  };

  useFocusSessionInit({
    newSession,
    initialSession,
    setSessionData,
    setIsLoading,
    dispatch,
    setSessionTitle,
    setSessionPlannedDuration,
    setAutoStartBreaks,
    setBreakDuration,
    setBreaksNumber,
    setSkipBreaks,
    setConfirmReset,
    setSoundOnTransition,
    setIsSoundEnabled,
    resetSession,
    updateTodos,
    createNote,
    setNewSession,
    isPlanner: plannerData != null
  });

  const toggleDeepFocus = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen error:", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsDeepFocus(!!document.fullscreenElement);
    };
    const handleKeyDown = (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleDeepFocus();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await taskService.getTasks();
        const mappedTodos = tasks.map(task => ({
          id: task._id,
          title: task.title,
          status: task.status === "completed" ? "Completed"
            : task.status === "in-progress" ? "In Progress"
              : task.status === "cancelled" ? "Cancelled"
                : "Not Started",
          createdAt: task.createdAt
        }));
        updateTodos(mappedTodos);
      } catch (err) {
        console.error("Failed to fetch planner tasks for focus session", err);
      }
    };
    if (!isLoading) {
      fetchTasks();
    }
  }, [isLoading, isPlannerSession]);

  const handleReviewUpdate = useCallback(
    (field, value) => {
      setSessionReview((prev) => ({ ...prev, [field]: value }));
    },
    [setSessionReview],
  );

  const handleDistractionToggle = useCallback(
    (distraction) => {
      setSessionReview((prev) => {
        const currentDistractions = (prev.distractions || "")
          .split(",")
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);
        const distractionLower = distraction.toLowerCase();
        let newDistractions;
        if (currentDistractions.includes(distractionLower)) {
          newDistractions = currentDistractions
            .filter((d) => d !== distractionLower)
            .join(", ");
        } else {
          newDistractions = [...currentDistractions, distraction].join(", ");
        }
        return { ...prev, distractions: newDistractions };
      });
    },
    [setSessionReview],
  );

  // useEffect(() => {
  //   console.log(machineState)
  // }, [machineState])

  const handleAddTodo = useCallback(async () => {
    if (!newTodo.trim()) return;
    const optimisticId = Date.now().toString();
    const newTodoObj = {
      id: optimisticId,
      title: newTodo.trim(),
      status: "Not Started",
      createdAt: new Date().toISOString(),
    };
    const updated = [...todos, newTodoObj];
    updateTodos(updated);
    onTodoChange();
    setNewTodo("");

    try {
      const createdTask = await taskService.createTask({
        title: newTodoObj.title,
        dueDate: new Date(),
        priority: "medium",
      });
      setSessionData((prev) => ({
        ...prev,
        todos: prev.todos.map((t) => t.id === optimisticId ? { ...t, id: createdTask._id } : t)
      }));
    } catch (err) {
      console.error("Failed to create task in DB", err);
    }
  }, [newTodo, todos, updateTodos, onTodoChange, setSessionData]);

  const handleFinalSaveAndStartNew = async () => {
    await forceSave();
    await sessionService.sessionFeedback({
      sessionId: sessionData.sessionId,
      feedback: sessionReview,
    });
    setNewSession(true);
  };

  const handleUpdateTodoStatus = useCallback(
    async (id, status) => {
      const updated = todos.map((t) => (t.id === id ? { ...t, status } : t));
      updateTodos(updated);
      onTodoChange();

      try {
        const backendStatus = status === "Completed" ? "completed"
          : status === "In Progress" ? "in-progress"
            : status === "Cancelled" ? "cancelled"
              : "todo";
        await taskService.updateTask(id, { status: backendStatus });
      } catch (err) {
        console.error("Failed to adjust task status:", err);
      }
    },
    [todos, updateTodos, onTodoChange],
  );

  const handleDeleteTodo = useCallback(
    async (id) => {
      const updated = todos.filter((t) => t.id !== id);
      updateTodos(updated);
      onTodoChange();

      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error("Failed to delete task in DB:", err);
      }
    },
    [todos, updateTodos, onTodoChange],
  );

  useEffect(() => {
    if (machineState.status === "running") {
      setActivePanels((prev) => ({ ...prev, settings: false }));
    }
    if (machineState.status === "finished" || machineState.status === "idle") {
      setActivePanels({
        notes: false,
        todos: false,
        settings: false,
        progress: false,
        workflow: false,
      });
      setShowQuotes(false);
    }
  }, [machineState.status]);

  const timerData = {
    timeLeft,
    elapsed,
    status: machineState.status,
    isRunning: machineState.status === "running",
  };

  const sessionMetrics = {
    breaksLeft:
      sessionData.segments?.filter((s) => s.type === "break" && !s.completedAt)
        .length || 0,
    currentSegment,
    segmentIndex,
    totalSegments: sessionData.segments?.length || 1,
    totalFocusSegments:
      sessionData.segments?.filter((x) => x.type === "focus")?.length || 0,
    totalBreakSegments:
      sessionData.segments?.filter((x) => x.type === "break")?.length || 0,
    remainingFocusSegments: sessionData.segments?.filter(
      (s) => s.type === "focus" && !s.completedAt,
    ).length,
  };

  const controls = {
    start: async () => {
      try {
        if (!sessionData.backendCreated) {
          await sessionService.startSession(buildPayload("start"));
          setSessionData((prev) => ({
            ...prev,
            backendCreated: true,
          }));
        }
      } catch (err) {
        toast.error("Backend failed, starting locally");
      }
      dispatch({ type: "START" });
    },
    pause: () => dispatch({ type: "PAUSE" }),
    reset: () => dispatch({ type: "RESET" }),
    setNewSession: () => setNewSession(true),
    onTitleSet: () => onTitleSet(),
  };

  const headerPanel = useMemo(() => (
    <DraggablePanel
      id="header"
      isMobile={isMobile}
      isLayoutMode={isLayoutMode}
      dragControls={dragControlsHeader}
      initialPosition={getPanelPosition("header")}
      mobilePosition={{ y: 0, x: "-50%", left: "50%", top: "2vh" }}
      className={isMobile ? "w-[94%] left-1/2 -translate-x-1/2 top-[2vh]" : "w-fit min-w-[320px] left-[calc(50%-160px)] top-[5vh]"}
      showClose={false}
    >
      <div className="px-1.5 pb-1.5 pt-1 md:pt-0">
        <HeaderNav
          isDeepFocus={isDeepFocus}
          toggleDeepFocus={toggleDeepFocus}
          toggleMotivation={() => setShowQuotes((s) => !s)}
          togglePanel={togglePanel}
          activePanels={activePanels}
          isIdle={machineState.status === "idle"}
          isRunning={isRunning}
          isLayoutMode={isLayoutMode}
          toggleLayoutMode={toggleLayoutMode}
        />
      </div>
    </DraggablePanel>
  ), [isMobile, isLayoutMode, dragControlsHeader, isDeepFocus, toggleDeepFocus, togglePanel, activePanels, machineState.status, isRunning, toggleLayoutMode]);

  const notesPanel = useMemo(() => (
    <AnimatePresence>
      {activePanels.notes && (
        <DraggablePanel
          id="notes"
          isMobile={isMobile}
          isLayoutMode={isLayoutMode}
          dragControls={dragControlsNotes}
          initialPosition={getPanelPosition("notes")}
          className={isMobile ? "w-full h-full inset-0" : "left-[calc(50%-250px)] top-[10vh] w-[500px] h-[80vh]"}
          onClose={() => togglePanel("notes")}
        >
          <Notes
            notes={notes}
            todos={todos}
            createNote={createNote}
            updateNote={updateNote}
            deleteNote={deleteNote}
            show={true}
            onClose={() => togglePanel("notes")}
          />
        </DraggablePanel>
      )}
    </AnimatePresence>
  ), [activePanels.notes, isMobile, isLayoutMode, dragControlsNotes, notes, todos, createNote, updateNote, deleteNote, togglePanel]);

  const todosPanel = useMemo(() => (
    <AnimatePresence>
      {activePanels.todos && (
        <DraggablePanel
          id="todos"
          isMobile={isMobile}
          isLayoutMode={isLayoutMode}
          dragControls={dragControlsTodos}
          initialPosition={getPanelPosition("todos")}
          className={isMobile ? "w-full h-full inset-0" : "left-[calc(50%-210px)] top-[10vh] w-[420px] h-[70vh]"}
          onClose={() => togglePanel("todos")}
        >
          <TodoList
            todos={todos}
            newTodo={newTodo}
            setNewTodo={setNewTodo}
            onAddTodo={handleAddTodo}
            onUpdateStatus={handleUpdateTodoStatus}
            onDeleteTodo={handleDeleteTodo}
            show={true}
            onClose={() => togglePanel("todos")}
          />
        </DraggablePanel>
      )}
    </AnimatePresence>
  ), [activePanels.todos, isMobile, isLayoutMode, dragControlsTodos, todos, newTodo, setNewTodo, handleAddTodo, handleUpdateTodoStatus, handleDeleteTodo, togglePanel]);

  const progressPanel = useMemo(() => (
    <AnimatePresence>
      {activePanels.progress && (
        <DraggablePanel
          id="progress"
          isMobile={isMobile}
          isLayoutMode={isLayoutMode}
          dragControls={dragControlsProgress}
          initialPosition={getPanelPosition("progress")}
          className={isMobile ? "w-full h-full inset-0" : "left-[calc(50%-210px)] top-[32vh] w-[420px] h-[35vh]"}
          onClose={() => togglePanel("progress")}
        >
          <CurrentProgress
            todos={todos}
            show={true}
            onClose={() => togglePanel("progress")}
          />
        </DraggablePanel>
      )}
    </AnimatePresence>
  ), [activePanels.progress, isMobile, isLayoutMode, dragControlsProgress, todos, togglePanel]);

  const settingsPanel = useMemo(() => (
    <AnimatePresence>
      {activePanels.settings && (
        <DraggablePanel
          id="settings"
          isMobile={isMobile}
          isLayoutMode={isLayoutMode}
          dragControls={dragControlsSettings}
          initialPosition={getPanelPosition("settings")}
          className={isMobile ? "w-full h-full inset-0" : "left-[calc(50%-225px)] top-[17vh] w-[450px] h-[65vh]"}
          onClose={() => togglePanel("settings")}
        >
          <Settings
            plannedDuration={sessionData.plannedDuration}
            initialValues={settings}
            onSave={(values) => {
              setBreakDuration(values.breakDuration);
              setAutoStartBreaks(values.autoStartBreaks);
              setBreaksNumber(values.breaksNumber);
              setSkipBreaks(values.skipBreaks);
              setConfirmReset(values.confirmReset);
              setSoundOnTransition(values.soundOnTransition);
              setIsSoundEnabled(values.isSoundEnabled);
              modifySettings(values);
            }}
            show={true}
            onClose={() => togglePanel("settings")}
          />
        </DraggablePanel>
      )}
    </AnimatePresence>
  ), [activePanels.settings, isMobile, isLayoutMode, dragControlsSettings, sessionData.plannedDuration, settings, setBreakDuration, setAutoStartBreaks, setBreaksNumber, setSkipBreaks, setConfirmReset, setSoundOnTransition, setIsSoundEnabled, modifySettings, togglePanel, getPanelPosition]);

  const workflowPanel = useMemo(() => (
    <AnimatePresence>
      {activePanels.workflow && (
        <DraggablePanel
          id="workflow"
          isMobile={isMobile}
          isLayoutMode={isLayoutMode}
          dragControls={dragControlsWorkflow}
          initialPosition={getPanelPosition("workflow")}
          className={isMobile ? "w-full h-fit bottom-0" : "left-[calc(50%-350px)] top-[65vh] w-[700px] h-fit max-h-[140px]"}
          onClose={() => togglePanel("workflow")}
        >
          <WorkflowDock />
        </DraggablePanel>
      )}
    </AnimatePresence>
  ), [activePanels.workflow, isMobile, isLayoutMode, dragControlsWorkflow, togglePanel, getPanelPosition]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 font-sans flex items-center justify-center bg-background-color text-text-primary">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin mx-auto text-button-primary"
          />
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex flex-col theme-transition bg-background-color overflow-hidden select-none"
    >
      {/* Dynamic Ambient Glow */}
      <div 
        className={`absolute inset-0 opacity-20 transition-colors duration-[3000ms] pointer-events-none blur-[100px] ${
          currentSegment?.type === "break" ? "bg-success-bg" : "bg-button-primary"
        }`} 
        style={{
          background: `radial-gradient(circle at 50% 50%, var(${currentSegment?.type === "break" ? "--success-bg" : "--button-primary"}) 0%, transparent 60%)`
        }}
      />
      <AnimatePresence>
        {isLayoutMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[10vh] left-1/2 -translate-x-1/2 z-50 bg-card-background/80 backdrop-blur-3xl border border-button-primary/50 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl"
          >
            <span className="text-sm font-bold text-text-primary">Layouts:</span>
            <button onClick={() => setLayoutPreset('default')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${layoutPreset === 'default' ? 'bg-button-primary text-white' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}>Default</button>
            <button onClick={() => setLayoutPreset('custom')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${layoutPreset === 'custom' ? 'bg-button-primary text-white' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}>Custom</button>
            <button onClick={() => setLayoutPreset('split')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${layoutPreset === 'split' ? 'bg-button-primary text-white' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}>Split View</button>
            <button onClick={() => setLayoutPreset('zen')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${layoutPreset === 'zen' ? 'bg-button-primary text-white' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}>Zen Mode</button>
            <div className="w-px h-4 bg-white/20 mx-2" />
            <button onClick={toggleLayoutMode} className="text-xs font-black text-button-primary hover:text-white uppercase tracking-wider transition-colors">Done</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 ${saveStatus === "saving"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : saveStatus === "error"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-button-success/10 border-button-success/20 text-button-success"
                }`}
            >
              {saveStatus === "saving" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {saveStatus === "saving"
                  ? "Syncing..."
                  : saveStatus === "error"
                    ? "Sync Failed"
                    : "Cloud Synced"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {headerPanel}

      <DraggablePanel
        id="timer"
        isMobile={isMobile}
        isLayoutMode={isLayoutMode}
        dragControls={dragControlsTimer}
        initialPosition={getPanelPosition("timer")}
        className={isMobile ? "w-[94%] left-1/2 -translate-x-1/2 top-[14vh]" : "w-[540px] left-[calc(50%-270px)] top-[15vh]"}
        showClose={false}
      >
        <div className="flex-1 overflow-hidden relative min-h-[450px] flex flex-col">
          <AnimatePresence mode="wait">
            {machineState.status === "finished" ? (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full h-full"
              >
                <SessionReview
                  reviewData={sessionReview}
                  onUpdate={handleReviewUpdate}
                  onDistractionToggle={handleDistractionToggle}
                  onNewSession={handleFinalSaveAndStartNew}
                />
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-1 py-6 px-6"
              >
                <AnimatePresence>
                  {activeTaskTitle && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 px-5 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 backdrop-blur-md shadow-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-button-primary animate-pulse shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-button-primary/90">
                        Current Task
                      </span>
                      <div className="w-px h-3 bg-white/20" />
                      <span className="text-sm font-bold text-text-primary truncate max-w-[250px]">
                        {activeTaskTitle}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full flex justify-center bg-transparent">
                  <Timer
                    timer={timerData}
                    session={sessionMetrics}
                    controls={controls}
                    sessionTitle={sessionTitle}
                    setSessionTitle={setSessionTitle}
                    sessionPlannedDuration={sessionData.plannedDuration}
                    setSessionPlannedDuration={setSessionPlannedDuration}
                    stopSession={stopSession}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DraggablePanel>

      {notesPanel}
      {todosPanel}
      {progressPanel}
      {settingsPanel}
      {workflowPanel}

      <AnimatePresence>
        {showQuotes && (
          <DraggablePanel
            id="quotes"
            isMobile={isMobile}
            isLayoutMode={isLayoutMode}
            dragControls={dragControlsSettings} // reuse a control if needed, or don't use handle
            initialPosition={{ x: 0, y: 0 }}
            className={isMobile ? "w-[94%] left-[3%] bottom-[20px]" : "w-[480px] left-[calc(50%-240px)] bottom-[40px]"}
            onClose={() => setShowQuotes(false)}
            showClose={false}
          >
            <MotivationalQuotes
              show={showQuotes}
              onClose={() => setShowQuotes(false)}
            />
          </DraggablePanel>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FocusSession;
