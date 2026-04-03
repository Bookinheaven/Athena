import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

import HeaderNav from "./components/FocusHeader.jsx";
import userService from "../../../../services/userService.js";

import { useNotes } from "./hooks/useNotes.js";
import { useSessionController } from "./hooks/useSessionController.js";
import { useFocusSessionInit } from "./hooks/useFocusSessionInit.js";
import { useSessionSettings } from "./hooks/useSessionSettings.js";

const FocusSession = () => {
  // Navigation states
  const [showQuotes, setShowQuotes] = useState(false);
  const [activePanels, setActivePanels] = useState({
    notes: false,
    todos: false,
    settings: false,
    progress: false
  });

  const togglePanel = (panelName) => {
    setActivePanels((prev) => ({
      ...prev,
      [panelName]: !prev[panelName]
    }));
  };

  // Control states
  // const hasLoggedStart = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const containerRef = useRef(null);
  
  
  // Settings state
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
  // Data states
  const [sessionStats, setSessionStats] = useSessionStorage("sessionStats", [{
    breakSegmentsCompleted: 0,
    focusSegmentsCompleted: 0,
    interruptions: 0,
    pauseCount: 0,
    totalPauseDuration: 0,
  }])
  
  const [sessionPlannedDuration, setSessionPlannedDuration] = useLocalStorage("sessionPlannedDuration", 25 * 60);
  const [todos, setTodos] = useSessionStorage("focusTodos", []);

  const {
    notes,
    setNotes,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  const [newTodo, setNewTodo] = useState("");
  const [sessionTitle, setSessionTitle] = useState("Untitled Work"); // later we can check if same name is there if so add (no.) [only for all Untitled Work and custom which are created in a same day.]
  const [newSession, setNewSession] = useState(false);
  const [sessionReview, setSessionReview] = useSessionStorage("sessionReview", {
    mood: null,
    focus: null,
    distractions: "",
  });

  // Initial Session
  const initialSession = useCallback(() => {
    const safeTotalFocus = sessionPlannedDuration ?? 25 * 60;
    const safeBreak = settings.breakDuration ?? 5 * 60;
    const safeBreaksNum = settings.breaksNumber ?? 4;
    const segments = createSessionData(
      safeTotalFocus,
      safeBreak,
      safeBreaksNum,
    );
    return {
      sessionId: uuidv4(),
      title: "Untitled Work",
      segmentIndex: 0,
      totalBreaks: segments.filter((s) => s.type === "break").length,
      breakDuration: safeBreak,
      maxBreaks: safeBreaksNum,
      backendCreated: false,
      currentDuration: 0,
      plannedDuration: safeTotalFocus,
      segments,
      timestamp: new Date().toISOString(),
    };
  }, [sessionPlannedDuration, settings.breakDuration, settings.breaksNumber, setSessionReview]);

  // Session storage (local)
  const [sessionData, setSessionData] = useSessionStorage(
    "sessionData",
    initialSession,
  );

  const modifySettings = async (changed) => {
    const merged = {
      ...settings,
      ...changed,
    };
    
    try {
      let res = await userService.updateSettings(merged, "session");
      console.log("Updated settings:", res);
    } catch (err) {
      console.error("Settings update failed:", err);
    }
  };

  //Auto save system && Time Engine
  const {
    machineState,
    dispatch,
    currentSegment,
    segmentIndex,
    elapsed,
    timeLeft,
    saveStatus,
    forceSave,
    timerStatus,
    onTitleSet,
    onReset,
    buildPayload
  } = useSessionController({
    sessionData,
    setSessionData,
    saveFunction: (payload) => sessionService.updateProgress(payload),
    sessionTitle,
    autoStartBreaks: settings.autoStartBreaks,
    skipBreaks: settings.skipBreaks,
    soundOnTransition: settings.soundOnTransition,
  });
  const isRunning = machineState.status === "running";
  
  const resetSession = () => {
    if (settings.confirmReset && isRunning) {
      if (!window.confirm("Reset the current session? Your progress will be lost.")) return;
    }
    const fresh = initialSession();
    setSessionData(fresh);
    setSessionReview({ mood: null, focus: null, distractions: "" });
    dispatch({ type: "RESET" })
    onReset();
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
    setTodos,
    createNote,
    setNewSession,
  });

  //Full screen mode
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
    if (isRunning) {
      setActivePanels((prev) => ({ ...prev, settings: false }));
    }
  }, [isRunning]);
  
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
    setTodos((t) => [
      ...t,
      {
        id: Date.now(),
        text: newTodo.trim(),
        status: "Not Started",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewTodo("");
  }, [newTodo, setTodos]);

  const handleFinalSaveAndStartNew = async () => {
    await forceSave();
    await sessionService.sessionFeedback({sessionId:sessionData.sessionId, playload:sessionReview});
    setNewSession(true);
  };

  const handleUpdateTodoStatus = useCallback(
    (id, status) => {
      setTodos((t) => t.map((x) => (x.id === id ? { ...x, status } : x)));
    },
    [setTodos],
  );

  const handleDeleteTodo = useCallback(
    (id) => {
      setTodos((t) => t.filter((x) => x.id !== id));
    },
    [setTodos],
  );

  // useEffect(() => {
  //   console.log("Machine data:", machineState);
  // }, [machineState]);

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
    breaksLeft: sessionData.segments?.filter((s) => s.type === "break" && !s.completedAt).length || 0,
    currentSegment,
    segmentIndex,
    totalSegments: sessionData.segments?.length || 1,
    totalFocusSegments: sessionData.segments?.filter((x) => x.type === "focus")?.length || 0,
    totalBreakSegments: sessionData.segments?.filter((x) => x.type === "break")?.length || 0,
    remainingFocusSegments: sessionData.segments?.filter((s) => s.type === "focus" && !s.completedAt).length,
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
      className="h-screen w-full flex flex-col relative theme-transition bg-background-color overflow-hidden"
    >
      {/* --- FLOATING TOASTS (For Saves) --- */}
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            key={saveStatus}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border backdrop-blur-md
              ${
                saveStatus === "saving"
                  ? "bg-blue-500/10 border-blue-400 text-blue-400"
                  : saveStatus === "error"
                  ? "bg-red-500/10 border-red-400 text-red-400"
                  : "bg-green-500/10 border-green-400 text-green-400"
              }`}
            >
              {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
              {saveStatus === "saved" && <CheckCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {saveStatus === "saving" && "Saving changes..."}
                {saveStatus === "error" && "Offline. Retrying..."}
                {saveStatus === "saved" && "All changes saved"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <motion.div
        drag
        dragConstraints={containerRef}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: "calc(50% - 200px)", top: "3vh" }} 
        className="absolute z-40 flex flex-col bg-card-background border border-card-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
      >
         <HeaderNav
            isDeepFocus={isDeepFocus}
            toggleDeepFocus={toggleDeepFocus}
            toggleMotivation={() => setShowQuotes((s) => !s)}
            isRunning={isRunning}
            togglePanel={togglePanel}
          />
      </motion.div>
      <motion.div
        drag
        dragConstraints={containerRef}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: "calc(50% - 200px)", top: "15vh" }} // 200px is half of the 400px width
        className="absolute z-40 flex flex-col bg-card-background border border-card-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/50 hover:bg-background-secondary/80 transition-colors shrink-0 border-b border-border-secondary">
          <div className="w-12 h-1 bg-border-primary rounded-full pointer-events-none" />
        </div>
        <div className="flex-1 overflow-hidden cursor-auto relative">
          <AnimatePresence mode="wait">
            {machineState.status === "finished" ? (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <Timer
                  timer={timerData}
                  session={sessionMetrics}
                  controls={controls}
                  sessionTitle={sessionTitle}
                  setSessionTitle={setSessionTitle}
                  sessionPlannedDuration={sessionData.plannedDuration}
                  setSessionPlannedDuration={setSessionPlannedDuration}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {activePanels.notes && (
          <motion.div
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ right: "40px", top: "100px" }}
            className="absolute w-[450px] h-[70vh] z-50 flex flex-col bg-card-background border border-card-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/50 hover:bg-background-secondary/80 transition-colors shrink-0 border-b border-border-secondary">
              <div className="w-12 h-1 bg-border-primary rounded-full pointer-events-none" />
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

      {/* TODOS WIDGET (Starts Top Left) */}
      <AnimatePresence>
        {activePanels.todos && (
          <motion.div
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ left: "40px", top: "100px" }}
            className="absolute w-[400px] h-[60vh] z-50 flex flex-col bg-card-background border border-card-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/50 hover:bg-background-secondary/80 transition-colors shrink-0 border-b border-border-secondary">
              <div className="w-12 h-1 bg-border-primary rounded-full pointer-events-none" />
            </div>
            <div className="flex-1 overflow-hidden cursor-auto relative">
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

      {/* SETTINGS WIDGET (Starts slightly off-center) */}
      <AnimatePresence>
        {activePanels.settings && (
          <motion.div
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ left: "calc(50% - 200px)", top: "20vh" }}
            className="absolute w-[400px] z-50 flex flex-col bg-card-background border border-card-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-secondary/50 hover:bg-background-secondary/80 transition-colors shrink-0 border-b border-border-secondary">
              <div className="w-12 h-1 bg-border-primary rounded-full pointer-events-none" />
            </div>
            <div className="overflow-hidden cursor-auto relative">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUOTES WIDGET (Starts Bottom Center) */}
      <AnimatePresence>
        {showQuotes && (
          <motion.div
            drag
            dragConstraints={containerRef}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ left: "calc(50% - 225px)", bottom: "40px" }} // 225px is half of 450px
            className="absolute w-[450px] z-50 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden"
          >
            <div className="h-6 w-full cursor-grab active:cursor-grabbing flex justify-center items-center bg-background-primary/90 hover:bg-background-primary transition-colors shrink-0 border-x border-t border-border-secondary rounded-t-2xl">
              <div className="w-12 h-1 bg-border-primary rounded-full pointer-events-none" />
            </div>
            <div className="cursor-auto relative bg-background-primary/80 backdrop-blur-2xl border border-border-secondary rounded-b-2xl overflow-hidden">
              <MotivationalQuotes
                show={showQuotes}
                onClose={() => setShowQuotes(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
  }

export default FocusSession;
