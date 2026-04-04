import { useState, useEffect, useCallback, useRef } from "react";
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
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useLocation } from "react-router-dom";
import HeaderNav from "./components/FocusHeader.jsx";
import userService from "../../../../services/userService.js";
import { useNotes } from "./hooks/useNotes.js";
import { useSessionController } from "./hooks/useSessionController.js";
import { useFocusSessionInit } from "./hooks/useFocusSessionInit.js";
import { useSessionSettings } from "./hooks/useSessionSettings.js";

const FocusSession = () => {
  const location = useLocation();
  const plannerData = location.state || null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const dragControls = useDragControls();

  const [showQuotes, setShowQuotes] = useState(false);
  const [activePanels, setActivePanels] = useState({
    notes: false,
    todos: false,
    settings: false,
    progress: false,
  });

  const togglePanel = (panelName) => {
    setActivePanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName],
    }));
  };

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

  const [sessionStats, setSessionStats] = useSessionStorage("sessionStats", [
    {
      breakSegmentsCompleted: 0,
      focusSegmentsCompleted: 0,
      interruptions: 0,
      pauseCount: 0,
      totalPauseDuration: 0,
    },
  ]);

  const [sessionPlannedDuration, setSessionPlannedDuration] = useLocalStorage(
    "sessionPlannedDuration",
    25 * 60,
  );
  const { notes, setNotes, createNote, updateNote, deleteNote } = useNotes();

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
      title: plannerData?.title || "Untitled Work",
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
              title: plannerData.title,
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
  const activeTaskTitle =
    sessionData?.taskIds?.length > 0 ? sessionData.title : null;
  const todos = sessionData.todos || [];

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
    sessionTitle,
    autoStartBreaks: settings.autoStartBreaks,
    skipBreaks: settings.skipBreaks,
    soundOnTransition: settings.soundOnTransition,
    todos: sessionData.todos,
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
    setSessionReview({ mood: null, focus: null, distractions: "" });
    dispatch({ type: "RESET" });
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

  const handleAddTodo = useCallback(() => {
    if (!newTodo.trim()) return;
    const updated = [
      ...todos,
      {
        id: Date.now(),
        title: newTodo.trim(),
        status: "Not Started",
        createdAt: new Date().toISOString(),
      },
    ];
    updateTodos(updated);
    onTodoChange();
    setNewTodo("");
  }, [newTodo, todos]);

  const handleFinalSaveAndStartNew = async () => {
    await forceSave();
    await sessionService.sessionFeedback({
      sessionId: sessionData.sessionId,
      feedback: sessionReview,
    });
    setNewSession(true);
  };

  const handleUpdateTodoStatus = useCallback(
    (id, status) => {
      const updated = todos.map((t) => (t.id === id ? { ...t, status } : t));
      updateTodos(updated);
      onTodoChange();
    },
    [todos],
  );

  const handleDeleteTodo = useCallback(
    (id) => {
      const updated = todos.filter((t) => t.id !== id);
      updateTodos(updated);
      onTodoChange();
    },
    [todos],
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
      });
      setShowQuotes(false);
    }
  }, [machineState.status]);

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

  return (
    <div
      ref={containerRef}
      className="h-screen w-full flex flex-col relative theme-transition bg-background-color overflow-hidden select-none"
    >
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-500 ${
                saveStatus === "saving"
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

      <motion.div
        drag={!isMobile}
        dragConstraints={containerRef}
        dragMomentum={false}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={
          isMobile
            ? { left: "50%", x: "-50%", top: "2vh" }
            : { left: "calc(50% - 175px)", top: "3vh" }
        }
        className="absolute z-40 flex flex-col items-center shadow-2xl rounded-full border border-border-primary/40 bg-card-background/80 backdrop-blur-xl w-fit min-w-[320px]"
      >
        {!isMobile && (
          <div className="h-4 w-full cursor-grab active:cursor-grabbing flex justify-center items-center group shrink-0 pt-1">
            <div className="w-8 h-1 bg-border-primary/40 group-hover:bg-button-primary/40 rounded-full transition-colors" />
          </div>
        )}
        <div className="px-1.5 pb-1.5 pt-1 md:pt-0">
          <HeaderNav
            isDeepFocus={isDeepFocus}
            toggleDeepFocus={toggleDeepFocus}
            toggleMotivation={() => setShowQuotes((s) => !s)}
            togglePanel={togglePanel}
            activePanels={activePanels}
            isIdle={machineState.status === "idle"}
            isRunning={isRunning}
          />
        </div>
      </motion.div>

      <motion.div
        drag={!isMobile}
        dragConstraints={containerRef}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={
          isMobile
            ? { left: "50%", x: "-50%", top: "14vh", width: "94%" }
            : { left: "calc(50% - 270px)", top: "15vh", width: "540px" }
        }
        className="absolute z-40 flex flex-col bg-card-background/60 backdrop-blur-2xl border border-card-border rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {!isMobile && (
          <div className="h-8 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/20 hover:bg-background-secondary/40 transition-colors shrink-0 border-b border-border-secondary/20">
            <div className="w-14 h-1 bg-border-primary/30 rounded-full" />
          </div>
        )}

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
                        Current Focus
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
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {activePanels.notes && (
          <motion.div
            drag={!isMobile}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={
              isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, x: 20 }
            }
            animate={{ y: 0, opacity: 1, scale: 1, x: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, x: 20 }}
            style={
              isMobile
                ? { inset: 0, width: "100%", height: "100%" }
                : { right: "40px", top: "80px", width: "500px", height: "80vh" }
            }
            className="absolute z-50 flex flex-col bg-card-background border border-card-border md:rounded-[32px] shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div
              onPointerDown={(e) => !isMobile && dragControls.start(e)}
              className="h-12 md:h-7 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/40 shrink-0 border-b border-border-secondary relative"
            >
              <div className="w-12 h-1 bg-border-primary/40 rounded-full" />
              {isMobile && (
                <button
                  onClick={() => togglePanel("notes")}
                  className="absolute right-5 text-xs font-black uppercase text-button-primary"
                >
                  Close
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden cursor-auto relative">
              <Notes
                notes={notes}
                todos={todos}
                createNote={createNote}
                updateNote={updateNote}
                deleteNote={deleteNote}
                show={true}
                onClose={() => togglePanel("notes")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanels.todos && (
          <motion.div
            drag={!isMobile}
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={
              isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, x: -20 }
            }
            animate={{ y: 0, opacity: 1, scale: 1, x: 0 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9, x: -20 }}
            style={
              isMobile
                ? { inset: 0, width: "100%", height: "100%" }
                : { left: "40px", top: "80px", width: "420px", height: "70vh" }
            }
            className="absolute z-50 flex flex-col bg-card-background border border-card-border md:rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="h-12 md:h-7 w-full flex justify-center items-center bg-background-secondary/40 shrink-0 border-b border-border-secondary relative">
              <div className="w-12 h-1 bg-border-primary/40 rounded-full" />
              {isMobile && (
                <button
                  onClick={() => togglePanel("todos")}
                  className="absolute right-5 text-xs font-black uppercase text-button-primary"
                >
                  Done
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanels.progress && (
          <motion.div
            drag={!isMobile}
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9 }}
            style={
              isMobile
                ? { inset: 0, width: "100%", height: "100%" }
                : {
                    left: "100px",
                    top: "150px",
                    width: "420px",
                    height: "35vh",
                  }
            }
            className="absolute z-50 flex flex-col bg-card-background border border-card-border md:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-12 md:h-7 w-full flex justify-center items-center bg-background-secondary/40 shrink-0 border-b border-border-secondary relative">
              <div className="w-12 h-1 bg-border-primary/40 rounded-full" />
              {isMobile && (
                <button
                  onClick={() => togglePanel("progress")}
                  className="absolute right-5 text-xs font-black uppercase text-button-primary"
                >
                  Close
                </button>
              )}
            </div>
            <CurrentProgress
              todos={todos}
              show={true}
              onClose={() => togglePanel("progress")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePanels.settings && (
          <motion.div
            drag={!isMobile}
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.9 }}
            style={
              isMobile
                ? { inset: 0, width: "100%", height: "100%" }
                : {
                    left: "calc(50% - 200px)",
                    top: "20vh",
                    width: "400px",
                    height: "65vh",
                  }
            }
            className="absolute z-50 flex flex-col bg-card-background border border-card-border md:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-12 md:h-7 w-full flex justify-center items-center bg-background-secondary/40 shrink-0 border-b border-border-secondary relative">
              <div className="w-12 h-1 bg-border-primary/40 rounded-full" />
              {isMobile && (
                <button
                  onClick={() => togglePanel("settings")}
                  className="absolute right-5 text-xs font-black uppercase text-button-primary"
                >
                  Save
                </button>
              )}
            </div>
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
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuotes && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={
              isMobile
                ? { left: "3%", bottom: "20px", width: "94%" }
                : { left: "calc(50% - 240px)", bottom: "40px", width: "480px" }
            }
            className="absolute z-50 flex flex-col shadow-2xl rounded-[32px] overflow-hidden border border-border-secondary bg-background-primary/90 backdrop-blur-2xl"
          >
            <div className="h-6 w-full flex justify-center items-center shrink-0 pt-2">
              <div className="w-10 h-1 bg-border-primary/30 rounded-full" />
            </div>
            <MotivationalQuotes
              show={showQuotes}
              onClose={() => setShowQuotes(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FocusSession;
