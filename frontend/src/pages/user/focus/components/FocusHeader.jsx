import { useCallback, useEffect, useState } from "react";
import {
  Maximize,
  Minimize,
  Flame,
  ListTodo,
  Settings,
  Quote,
  NotebookPen,
  List,
} from "lucide-react";
import streakService from "../../../../../services/streakService";

export default function HeaderNav({
  isDeepFocus,
  toggleDeepFocus,
  toggleMotivation,
  togglePanel,
  activePanels = {},
  isIdle,
  isRunning,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [time, setTime] = useState(new Date());
  const [streakNo, setStreakNo] = useState(0);

  const handlePanelToggle = (panelName) => {
    if (panelName === "settings" && !isIdle) return;
    if (panelName !== "settings" && !isRunning) return;

    togglePanel(panelName);
  };

  // Keep the header hidden when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Streak
  const updateStreak = useCallback(async () => {
    try {
      const streak = await streakService.fetchStreakDetails("currentStreak");
      if (streak && streak.currentStreak !== undefined) {
        setStreakNo(streak.currentStreak);
      }
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updateStreak(); 
    const streakInterval = setInterval(updateStreak, 30000);
    return () => clearInterval(streakInterval);
  }, [updateStreak]);

  useEffect(() => {
    if (isIdle) {
      updateStreak();
    }
  }, [isIdle, updateStreak]);

  return (
    <header
      className={`
        flex items-center justify-between 
        px-1.5 shadow-none bg-transparent
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        w-[95%] sm:w-fit min-w-[320px]
        ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"} 
      `}
    >
      <div className="flex items-center gap-1.5 border-r border-border-primary/40 pr-3 pl-1">
        <button
          onClick={toggleDeepFocus}
          className={`
            p-2 rounded-full transition-all duration-300
            ${
              isDeepFocus
                ? "text-button-primary bg-button-primary/15 hover:bg-button-primary/25"
                : "text-text-muted hover:text-button-primary hover:bg-button-primary/10"
            }
          `}
          title={isDeepFocus ? "Exit Deep Focus" : "Enter Deep Focus"}
        >
          {isDeepFocus ? (
            <Minimize size={18} strokeWidth={2.5} />
          ) : (
            <Maximize size={18} strokeWidth={2.5} />
          )}
        </button>

        <div
          className="fire-badge-container flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-default relative border transition-transform hover:scale-105"
          title="Current Streak"
        >
          <Flame
            size={16}
            strokeWidth={2.5}
            className="text-orange-500 animate-flame"
          />
          <span className="text-sm font-black tabular-nums tracking-wide bg-gradient-to-b from-orange-400 to-red-500 bg-clip-text text-transparent relative z-10">
            {streakNo}
          </span>
        </div>
      </div>

      <div className="px-6 text-xl font-black text-text-primary tabular-nums tracking-wider cursor-default select-none drop-shadow-sm">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      <div className="flex items-center gap-1.5 border-l border-border-primary/40 pl-3 pr-1">
        <button
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-all duration-300"
          title="Get a motivational quote"
          onClick={toggleMotivation}
        >
          <Quote
            size={14}
            strokeWidth={2.5}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="hidden sm:inline relative">
            Inspire Me
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-button-primary transition-all duration-300 group-hover:w-full rounded-full" />
          </span>
        </button>

        <div className="w-px h-6 bg-border-primary/40 mx-1" />

        <button
          disabled={!isRunning}
          className={`p-2 rounded-full transition-all duration-300 ${
            !isRunning
              ? "opacity-40 cursor-not-allowed text-text-muted"
              : activePanels.todos
                ? "bg-button-primary text-button-primary-text shadow-md scale-105"
                : "text-text-muted hover:bg-background-secondary hover:text-text-primary"
          }`}
          title="Tasks"
          onClick={() => handlePanelToggle("todos")}
        >
          <ListTodo size={18} strokeWidth={2.5} />
        </button>

        <button
          disabled={!isRunning}
          className={`p-2 rounded-full transition-all duration-300 ${
            !isRunning
              ? "opacity-40 cursor-not-allowed text-text-muted"
              : activePanels.notes
                ? "bg-button-primary text-button-primary-text shadow-md scale-105"
                : "text-text-muted hover:bg-background-secondary hover:text-text-primary"
          }`}
          title="Notes"
          onClick={() => handlePanelToggle("notes")}
        >
          <NotebookPen size={18} strokeWidth={2.5} />
        </button>

        <button
          disabled={!isRunning}
          className={`p-2 rounded-full transition-all duration-300 ${
            !isRunning
              ? "opacity-40 cursor-not-allowed text-text-muted"
              : activePanels.progress
                ? "bg-button-primary text-button-primary-text shadow-md scale-105"
                : "text-text-muted hover:bg-background-secondary hover:text-text-primary"
          }`}
          title="Progress"
          onClick={() => handlePanelToggle("progress")}
        >
          <List size={18} strokeWidth={2.5} />
        </button>

        <div className="w-px h-6 bg-border-primary/40 mx-1" />

        <button
          disabled={!isIdle}
          className={`p-2 rounded-full transition-all duration-300 ${
            !isIdle
              ? "opacity-40 cursor-not-allowed text-text-muted"
              : activePanels.settings
                ? "bg-button-primary text-button-primary-text shadow-md scale-105"
                : "text-text-muted hover:text-text-primary hover:bg-background-secondary"
          }`}
          title="Focus Settings"
          onClick={() => handlePanelToggle("settings")}
        >
          <Settings
            size={18}
            strokeWidth={2.5}
            className={
              activePanels.settings ? "animate-[spin_4s_linear_infinite]" : ""
            }
          />
        </button>
      </div>
    </header>
  );
}
