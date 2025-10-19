import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ListTodo, Quote, Settings as SettingsIcon } from "lucide-react";
import createSessionData from "./hooks/useSessionData";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Settings } from "./components/Setting";
import { useTimer } from "./hooks/useTimer";
import { Timer } from "./components/Timer";
import { TodoList } from "./components/TodoList";
import MotivationalQuotes from "./components/MotivationalQuotes";
import CurrentProgress from "./components/CurrentProgress";

const FocusSession = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [showQuotes, setShowQuotes] = useState(true);

  const [breakDuration, setBreakDuration] = useLocalStorage(
    "breakDuration",
    60
  );
  const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage(
    "autoStartBreaks",
    true
  );
  const [breaksNumber, setBreaksNumber] = useLocalStorage("breaksNumber", 4);
  const [totalFocusDuration, setTotalFocusDuration] = useLocalStorage(
    "totalFocusDuration",
    25 * 60
  );

  const [todos, setTodos] = useLocalStorage("focusTodos", []);
  const [newTodo, setNewTodo] = useState("");
  const [sessionHistory, setSessionHistory] = useLocalStorage(
    "sessionHistory",
    []
  );

  const [sessionTitle, setSessionTitle] = useState("Pomodoro");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentFocusDuration, setCurrentFocusDuration] = useLocalStorage(0);
  const [newSession, setNewSession] = useState(false);

  const initialSession = () => {
    const segments = createSessionData(
      totalFocusDuration,
      breakDuration,
      breaksNumber
    );
    return {
      title: sessionTitle,
      segmentIndex: 0,
      totalBreaks: segments.filter((s) => s.type === "break").length,
      breakDuration,
      maxBreaks: breaksNumber,
      currentDuration: 0,
      totalDuration: totalFocusDuration,
      segments,
      isDone: false,
      timestamp: new Date().toISOString(),
    };
  };

  const [sessionData, setSessionData] = useLocalStorage(
    "sessionData",
    initialSession
  );

  useEffect(() => {
    setCurrentSegmentIndex(sessionData?.segmentIndex || 0);
  }, []);

  useEffect(() => {
    console.log("data ", sessionData)
  }, [sessionData]);

  useEffect(() => {
    if (newSession) {
      setSessionData(initialSession());
      setCurrentSegmentIndex(0);
      setNewSession(p=> false);
    }
  }, [newSession]);

  const initialTimeLeft = useMemo(() => {
    const segment = sessionData.segments?.[currentSegmentIndex];
    console.log("called initialTimeLeft");
    if (!segment) return 0;
    if (!segment.startTimestamp) return (segment.totalDuration) - (segment.duration || 0);
    const startTime = new Date(segment.startTimestamp).getTime();
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - startTime) / 1000);
    const totalElapsed = (segment.duration || 0) + elapsedSinceStart;
    return Math.max((segment.totalDuration || totalFocusDuration) - totalElapsed, 0);
  }, [sessionData.segments, currentSegmentIndex, totalFocusDuration]);

  
  const timerControls = useTimer(initialTimeLeft, () => {
    const seg = sessionData.segments[currentSegmentIndex];
    setSessionHistory((h) => [...h, { ...seg, completedAt: new Date().toISOString() }]);
    if (currentSegmentIndex + 1 < sessionData.segments.length) {
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);
      setSessionData((prev) => {
        const newSegments = [...prev.segments];
        newSegments[nextIndex] = {
          ...newSegments[nextIndex],
          startTimestamp: null,
          duration: 0,
        };
        return { ...prev, segments: newSegments, segmentIndex: nextIndex };
      });
    } else {
      setSessionData((prev) => ({ ...prev, isDone: true }));
    }
  });

  const updateSegment = (index, updates) => {
    setSessionData((prev) => {
      const newSegments = prev.segments.map((seg, idx) => idx === index ? { ...seg, ...updates } : seg);
      return { ...prev, segments: newSegments };
    });

  };

  useEffect(() => {
    if (
      sessionData?.segments &&
      sessionData.segments.length > 0 &&
      sessionData.segments[currentSegmentIndex] &&
      sessionData.segments[currentSegmentIndex]?.length > 0
    ) {
      timerControls.start();
    }
  }, [currentSegmentIndex, sessionData.segments, timerControls]);

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

  const handleUpdateTodoStatus = useCallback(
    (id, status) =>
      setTodos((t) => t.map((x) => (x.id === id ? { ...x, status } : x))),
    [setTodos]
  );

  const handleDeleteTodo = useCallback(
    (id) => setTodos((t) => t.filter((x) => x.id !== id)),
    [setTodos]
  );

  const handleShowQuotes = () => {
    setShowQuotes(!showQuotes);
    setShowSettings(false);
    setShowTodos(false);
  };

  return (
    <div className="pt-23 lg:pt-2 min-h-screen flex flex-col p-4 relative theme-transition bg-background-color">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse bg-button-primary"
          style={{ opacity: 0.1, animationDuration: "4s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse bg-text-accent"
          style={{
            opacity: 0.1,
            animationDuration: "6s",
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="w-full mb-6 relative z-10 fade-in">
        <div className="flex justify-end">
          <div className="flex gap-2">
            <button
              onClick={handleShowQuotes}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover transition-colors"
              title="Get motivated"
            >
              <Quote className="w-5 h-5" />
              <span className="text-sm">Inspire Me</span>
            </button>
            <button
              onClick={() => {
                setShowTodos((v) => !v);
                setShowSettings(false);
              }}
              className={`p-3 rounded-xl shadow-md transition-all duration-300 border border-card-border ${
                showTodos
                  ? "bg-button-primary text-button-primary-text"
                  : "bg-card-background text-text-primary"
              }`}
              aria-label="Toggle tasks"
            >
              <ListTodo className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowSettings((v) => !v);
                setShowTodos(false);
              }}
              className={`p-3 rounded-xl shadow-md transition-all duration-300 border border-card-border ${
                showSettings
                  ? "bg-button-primary text-button-primary-text"
                  : "bg-card-background text-text-primary"
              }`}
              aria-label="Toggle settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center flex-grow">
        <Settings
          show={showSettings}
          breakDuration={breakDuration}
          setBreakDuration={setBreakDuration}
          autoStartBreaks={autoStartBreaks}
          setAutoStartBreaks={setAutoStartBreaks}
          totalBreaks={breaksNumber}
          setTotalBreaks={setBreaksNumber}
          onClose={() => setShowSettings(false)}
        />

        <div className="flex flex-col gap-10 lg:flex-row mt-2 lg:mt-10">
          {sessionData?.segments && sessionData.segments.length > 0 && (
            <Timer
              timeLeft={timerControls.timeLeft}
              isStarted={timerControls.isStarted}
              start={timerControls.start}
              pause={timerControls.pause}
              reset={timerControls.reset}
              isBreak={
                sessionData.segments[currentSegmentIndex]?.type === "break"
              }
              sessionType={sessionTitle}
              setSessionType={setSessionTitle}
              setTotalFocusDuration={setTotalFocusDuration}
              totalFocusDuration={totalFocusDuration}
              breaksLeft={sessionData.segments.filter((s) => s.type === "break" && s.completedAt == null).length}
              currentFocusDuration={currentFocusDuration}
              setCurrentFocusDuration={setCurrentFocusDuration}
              currentSegmentData={sessionData.segments[currentSegmentIndex]}
              onSegmentUpdate={(x) => updateSegment(currentSegmentIndex, x)}
              setNewSession={() => setNewSession(p => true)}
            />
          )}
          <CurrentProgress todos={todos} />
        </div>

        <TodoList
          todos={todos}
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          onAddTodo={handleAddTodo}
          onUpdateStatus={handleUpdateTodoStatus}
          onDeleteTodo={handleDeleteTodo}
          show={showTodos}
          onClose={() => setShowTodos(false)}
        />
      </div>

      <div className="flex flex-row justify-around transition-all duration-300">
        <MotivationalQuotes
          show={showQuotes}
          onClose={() => setShowQuotes(false)}
        />
      </div>
    </div>
  );
};

export default FocusSession;
