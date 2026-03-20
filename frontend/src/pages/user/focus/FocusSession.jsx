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

import HeaderNav from "../components/FocusHeader.jsx";
import userService from "../../../../services/userService.js";
import { loadSessionData } from "./utils/loadSessionData.js";
import { useSessionController } from "./hooks/useSessionController";

const FocusSession = () => {
  // Navigation states
  const [showQuotes, setShowQuotes] = useState(false);
  const [activePanel, setActivePanel] = useState("");

  // Control states
  // const hasLoggedStart = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const containerRef = useRef(null);

  // Settings state
  const [breakDuration, setBreakDuration] = useLocalStorage(
    "breakDuration",
    5 * 60,
  );
  const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage(
    "autoStartBreaks",
    true,
  );
  const [breaksNumber, setBreaksNumber] = useLocalStorage("breaksNumber", 4);
  const [sessionPlannedDuration, setSessionPlannedDuration] = useLocalStorage(
    "sessionPlannedDuration",
    25 * 60,
  );

  // Data states
  const [todos, setTodos] = useSessionStorage("focusTodos", []);
  const [notes, setNotes] = useSessionStorage("notes", [
    {
      id: 1,
      text: "Welcome to your notes!",
      taskId: "",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      text: "Try editing this note.",
      taskId: "",
      createdAt: new Date().toISOString(),
    },
  ]);

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
    const safeBreak = breakDuration ?? 5 * 60;
    const safeBreaksNum = breaksNumber ?? 4;
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
  }, [sessionPlannedDuration, breakDuration, breaksNumber, setSessionReview]);

  // Session storage (local)
  const [sessionData, setSessionData] = useSessionStorage(
    "sessionData",
    initialSession,
  );

  useEffect(() => {
    const update = async () => {
      try {
        const res = await userService.updateSettings(
          {
            breakDuration,
            autoStartBreaks,
            breaksNumber,
          },
          "session",
        );
        console.log("Updated settings:", res);
      } catch (err) {
        console.error("Settings update failed:", err);
      }
    };
    update();
    // send payload
  }, [breakDuration, autoStartBreaks, breaksNumber]);

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
    onReset
  } = useSessionController({
    sessionData,
    setSessionData,
    saveFunction: (payload) => sessionService.updateProgress(payload),
    sessionTitle,
    autoStartBreaks
  });
  const isRunning = machineState.status === "running";
  
  useEffect(() => {
    if (newSession) return;
    loadSessionData({
      initialSession,
      setSessionData,
      setIsLoading,
      dispatch,
      setSessionTitle,
      setSessionPlannedDuration,
    });
  }, []);

  const resetSession = () => {
    const fresh = initialSession();
    setSessionData(fresh);
    setSessionReview({ mood: null, focus: null, distractions: "" });
    dispatch({ type: "RESET" })
    onReset();
  };

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

  // New Session
  useEffect(() => {
    if (!newSession) return;

    resetSession();

    setSessionTitle("Untitled Work");
    // setSessionHistory([]);
    setTodos([]);
    setNotes([
      {
        id: 1,
        text: "Welcome to your notes!",
        taskId: "",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        text: "Try editing this note.",
        taskId: "",
        createdAt: new Date().toISOString(),
      },
    ]);

    setNewSession(false);
  }, [newSession]);
  
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
    await sessionService.sessionFeedback(sessionData.sessionId, sessionReview);
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

  const handlePanelToggle = (panelName) => {
    setActivePanel((current) => (current === panelName ? null : panelName));
  };

  useEffect(() => {
    // console.log("Machine status changed:", machineState.status);
    console.log("Machine data:", machineState);
  }, [machineState]);

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
      className=" lg:pt-2 min-h-screen flex flex-col lg:p-4 relative theme-transition bg-background-color"
    >
      <AnimatePresence>
        {saveStatus !== "idle" && (
          <motion.div
            key={saveStatus}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50"
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
              {saveStatus === "saving" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
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

      <div className="w-full mb-3 fade-in flex justify-center">
        <HeaderNav
          isDeepFocus={isDeepFocus}
          toggleDeepFocus={toggleDeepFocus}
          toggleMotivation={() => setShowQuotes((s) => !s)}
          isRunning={isRunning}
          handlePanelToggle={handlePanelToggle}
        ></HeaderNav>
      </div>

      <div className="flex justify-center items-center flex-grow">
        <Settings
          breakDuration={breakDuration}
          setBreakDuration={setBreakDuration}
          autoStartBreaks={autoStartBreaks}
          setAutoStartBreaks={setAutoStartBreaks}
          totalBreaks={breaksNumber}
          setTotalBreaks={setBreaksNumber}
          // onClearHistory={handleClearHistory}
          show={activePanel === "settings" } // it should only display before a session start, not (paused / ready/ running)
          onClose={() => setActivePanel(null)}
        />

        <motion.div
          layout
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex flex-col items-center w-full lg:w-0 h-full lg:flex-row md:mt-2 lg:mt-10 relative"
        >
          <AnimatePresence mode="wait">
            {machineState.status === "finished" ? (
              <motion.div
                key="review"
                layout
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full flex justify-center"
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
                layout
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full flex justify-center"
              >
                <Timer
                  timeLeft={timeLeft}
                  elapsed={elapsed}
                  isStarted={machineState.status === "running"}
                  timerStatus= {machineState.status}
                  start={async () => {
                    try {
                      if (!sessionData.backendCreated) {
                        await sessionService.startSession({
                          sessionId: sessionData.sessionId,
                          title: sessionTitle,
                          plannedDuration: sessionData.plannedDuration,
                          sessionSegments: sessionData.segments,
                        });

                        setSessionData((prev) => ({
                          ...prev,
                          backendCreated: true,
                        }));
                      }
                    } catch (err) {
                      toast.error("Backend failed, starting locally");
                    }

                    dispatch({ type: "START" });
                  }}
                  pause={() => {
                    dispatch({ type: "PAUSE" });
                  }}
                  reset={() => {
                    dispatch({ type: "RESET" });
                  }}
                  sessionTitle={sessionTitle}
                  setSessionTitle={setSessionTitle}
                  setSessionPlannedDuration={setSessionPlannedDuration}
                  sessionPlannedDuration={sessionData.plannedDuration}
                  breaksLeft={
                    sessionData.segments?.filter(
                      (s) => s.type === "break" && !s.completedAt,
                    ).length || 0
                  }
                  currentSegmentData={currentSegment}
                  currentSegmentIndex={segmentIndex}
                  totalSegments={sessionData.segments?.length || 1}
                  totalfocusSegments={
                    sessionData.segments?.filter((x) => x.type === "focus")
                      ?.length || 1
                  }
                  totalbreakSegments={
                    sessionData.segments?.filter((x) => x.type === "break")
                      ?.length || 1
                  }
                  focusSegments={
                    sessionData.segments?.filter(
                      (s) => s.type === "focus" && !s.completedAt,
                    ).length
                  }
                  setNewSession={() => setNewSession(true)}
                  onTitleSet={() => onTitleSet()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout>
            <CurrentProgress
              todos={todos}
              show={activePanel === "progress"}
              onClose={() => setActivePanel(null)}
            />
          </motion.div>

          <motion.div layout>
            <Notes
              notes={notes}
              todos={todos}
              setNotes={setNotes}
              show={activePanel === "notes"}
              onClose={() => setActivePanel(null)}
            />
          </motion.div>
        </motion.div>

        <TodoList
          todos={todos}
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          onAddTodo={handleAddTodo}
          onUpdateStatus={handleUpdateTodoStatus}
          onDeleteTodo={handleDeleteTodo}
          show={activePanel === "todos"}
          onClose={() => setActivePanel(null)}
        />
      </div>

      <AnimatePresence>
        {showQuotes && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-row justify-around transition-all duration-300"
          >
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
