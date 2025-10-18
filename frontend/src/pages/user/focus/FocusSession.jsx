import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ListTodo, Quote, Settings as SettingsIcon } from "lucide-react";
import { useTimer } from "./hooks/useTimer";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Settings } from "./components/Setting";
import { Timer } from "./components/Timer";
import { TodoList } from "./components/TodoList";
import MotivationalQuotes from './components/MotivationalQuotes'
import CurrentProgress from "./components/CurrentProgress";

const FocusSession = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [showQuotes, setShowQuotes] = useState(true)
  const [breakDuration, setBreakDuration] = useLocalStorage("breakDuration", 5 * 60);
  const [autoStartBreaks, setAutoStartBreaks] = useLocalStorage("autoStartBreaks", false);

  const [todos, setTodos] = useLocalStorage("focusTodos", []);
  const [newTodo, setNewTodo] = useState("");

  const [sessionHistory, setSessionHistory] = useLocalStorage("sessionHistory", []);

  const [sessionState, setSessionState] = useLocalStorage("focusSessionState", {
    isBreak: false,
    breaksLeft: 4,
    totalBreaks: 4,
    sessionType: "Pomodoro",
  });
  const [isBreak, setIsBreak] = useState(sessionState.isBreak);
  const [breaksLeft, setBreaksLeft] = useState(sessionState.breaksLeft);
  const [totalBreaks, setTotalBreaks] = useState(sessionState.totalBreaks);
  const [sessionType, setSessionType] = useState(sessionState.sessionType);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    setSessionState((prev) => {
      if (
        prev.isBreak === isBreak &&
        prev.breaksLeft === breaksLeft &&
        prev.totalBreaks === totalBreaks &&
        prev.sessionType === sessionType
      ) {
        return prev;
      }
      return { isBreak, breaksLeft, totalBreaks, sessionType };
    });
  }, [isBreak, breaksLeft, totalBreaks, sessionType, setSessionState]);

  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      const sessionData = {
        type: sessionType,
        duration: timer.duration,
        completedAt: new Date().toISOString(),
      };
      setSessionHistory((prev) => [...prev, sessionData]);

      if (breaksLeft > 0) {
        setIsBreak(true);
        timer.setNewDuration(breakDuration);
        setBreaksLeft((prev) => prev - 1);
        if (autoStartBreaks) setTimeout(() => timer.start(), 1000);
      } else {
        setBreaksLeft(totalBreaks);
      }
    } else {
      setIsBreak(false);
      const baseDuration =
        sessionType === "Pomodoro"
          ? 25 * 60
          : sessionType === "Short"
          ? 15 * 60
          : 45 * 60;
      timer.setNewDuration(baseDuration);
    }
  }, [isBreak, breaksLeft, sessionType, breakDuration, totalBreaks, autoStartBreaks, setSessionHistory]);

  const timer = useTimer(
    isBreak ? breakDuration : 25 * 60,
    handleTimerComplete,
    isBreak ? "timerStateBreak" : "timerStateFocus"
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem("focusTabHiddenAt", new Date().toISOString());
      } else {
        const hiddenAt = localStorage.getItem("focusTabHiddenAt");
        if (hiddenAt && timer.isStarted) {
          // Timer will auto-adjust on next interval tick
        }
        localStorage.removeItem("focusTabHiddenAt");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timer.isStarted]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        timer.isStarted ? timer.pause() : timer.start();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReset();
      } else if (e.key === "Escape") {
        setShowSettings(false);
        setShowTodos(false);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [timer]);

  const handleReset = useCallback(() => {
    timer.reset();
    setIsBreak(false);
    setBreaksLeft(totalBreaks);
  }, [timer, totalBreaks]);

  const handleAddTodo = useCallback(() => {
    if (newTodo.trim()) {
      setTodos((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: newTodo.trim(),
          status: "Not Started",
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewTodo("");
    }
  }, [newTodo, setTodos]);

  const handleUpdateTodoStatus = useCallback(
    (id, newStatus) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    },
    [setTodos]
  );

  const handleDeleteTodo = useCallback(
    (id) => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    },
    [setTodos]
  );

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySessions = sessionHistory.filter(
      (s) => new Date(s.completedAt).toDateString() === today
    );
    return {
      today: todaySessions.length,
      todayMinutes: Math.round(todaySessions.reduce((sum, s) => sum + s.duration / 60, 0)),
      total: sessionHistory.length,
    };
  }, [sessionHistory]);
  const handleShowQuotes = () => {
    setShowQuotes(!showQuotes);
    setShowSettings(false);
    setShowTodos(false);
  };
  return (
    <div className="pt-23 lg:pt-2 min-h-screen flex flex-col p-4 relative theme-transition bg-background-color">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
            isBreak ? "bg-button-success" : "bg-button-primary"
          }`}
          style={{ opacity: 0.1, animationDuration: "4s" }}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
            isBreak ? "bg-button-success" : "bg-text-accent"
          }`}
          style={{ opacity: 0.1, animationDuration: "6s", animationDelay: "1s" }}
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
          onClose={() => setShowSettings(false)}
          autoStartBreaks={autoStartBreaks}
          setAutoStartBreaks={setAutoStartBreaks}
          breakDuration={breakDuration}
          setBreakDuration={setBreakDuration}
          totalBreaks={totalBreaks}
          setTotalBreaks={setTotalBreaks}
          setBreaksLeft={setBreaksLeft}
        />
        <div className="flex flex-col gap-10 lg:flex-row">
          <Timer
            timer={timer}
            isBreak={isBreak}
            sessionType={sessionType}
            setSessionType={setSessionType}
            breaksLeft={breaksLeft}
            onReset={handleReset}
          />
          <CurrentProgress todos={todos}/>
        </div>
        <TodoList
          show={showTodos}
          onClose={() => setShowTodos(false)}
          todos={todos}
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          onAddTodo={handleAddTodo}
          onUpdateStatus={handleUpdateTodoStatus}
          onDeleteTodo={handleDeleteTodo}
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
