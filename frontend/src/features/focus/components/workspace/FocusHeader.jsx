import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Flame,
  ListTodo,
  Settings,
  Quote,
  NotebookPen,
  AlertCircle,
  Blocks,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Check,
  Sparkles,
  Minimize2,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import streakService from "@services/streakService";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const WORKSPACE_MODES = [
  {
    id: "standard",
    name: "Standard",
    description: "Athena's recommended workspace",
    icon: Sparkles,
  },
  {
    id: "zen",
    name: "Zen",
    description: "Timer and current work only",
    icon: Minimize2,
  },
  {
    id: "custom",
    name: "Custom",
    description: "Arrange the workspace yourself",
    icon: SlidersHorizontal,
  },
];

export const FocusHeader = ({
  isDeepFocus,
  toggleDeepFocus,
  workspaceMode = "standard",
  setWorkspaceMode,
  toggleQuotes,
  showQuotes,
  activeDrawers,
  toggleDrawer,
  isRunning,
  isPaused,
  isIdle,
  saveStatus,
  todoCount = { completed: 0, total: 0 },
  portalContainer,
}) => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [streakNo, setStreakNo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
    updateStreak();
    const interval = setInterval(updateStreak, 60000);
    return () => clearInterval(interval);
  }, [updateStreak]);

  const handleBack = () => {
    if (isRunning) {
      if (!window.confirm("You have an active Focus session running. Leave page?")) {
        return;
      }
    }
    navigate(-1);
  };

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-30 transition-all select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          title="Exit Focus Workspace"
        >
          <ArrowLeft size={18} />
        </button>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 cursor-default"
          title={`Current Streak: ${streakNo} days`}
        >
          <Flame size={15} className="animate-flame" />
          <span className="text-xs font-black tabular-nums tracking-wide">
            {streakNo}d
          </span>
        </div>

        <button
          onClick={toggleDeepFocus}
          className={`p-2 rounded-xl transition-all ${
            isDeepFocus
              ? "text-primary bg-primary/15 hover:bg-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title={isDeepFocus ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
        >
          {isDeepFocus ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-base sm:text-lg font-black tracking-wider text-foreground tabular-nums select-none">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>

        <div className="hidden sm:inline-block w-px h-4 bg-border/60" />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-xs font-bold text-foreground transition-all cursor-pointer outline-none focus-visible:ring-1.5 focus-visible:ring-primary shadow-2xs select-none"
            aria-label="Select Focus Mode"
          >
            {(() => {
              const current = WORKSPACE_MODES.find((m) => m.id === workspaceMode) || WORKSPACE_MODES[0];
              const Icon = current.icon;
              return (
                <>
                  <Icon size={13} className="text-primary" />
                  <span>{current.name}</span>
                  <ChevronDown size={12} className="text-muted-foreground ml-0.5" />
                </>
              );
            })()}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            container={portalContainer}
            align="center"
            sideOffset={8}
            className="w-64 p-1.5 bg-popover/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl select-none"
          >
            <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground select-none">
              Focus Workspace
            </div>
            <DropdownMenuSeparator className="my-1 border-border/40" />

            {WORKSPACE_MODES.map((mode) => {
              const isSelected = workspaceMode === mode.id;
              const Icon = mode.icon;
              return (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => setWorkspaceMode(mode.id)}
                  className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-secondary/70 text-foreground"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-none">
                        {mode.name}
                      </span>
                      {isSelected && (
                        <Check size={13} className="text-primary shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-normal mt-1 leading-snug">
                      {mode.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {saveStatus && saveStatus !== "idle" && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mr-1 ${
              saveStatus === "saving"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : saveStatus === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {saveStatus === "saving" && <Loader2 size={11} className="animate-spin" />}
            {saveStatus === "saved" && <CheckCircle size={11} />}
            {saveStatus === "error" && <AlertTriangle size={11} />}
            <span>{saveStatus === "saving" ? "Syncing" : saveStatus === "error" ? "Sync Failed" : "Synced"}</span>
          </div>
        )}

        <button
          onClick={toggleQuotes}
          className={`p-2 rounded-xl transition-all ${
            showQuotes
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title="Toggle Inspiration Quote"
        >
          <Quote size={18} />
        </button>

        <button
          onClick={() => toggleDrawer("todos")}
          className={`relative p-2 rounded-xl transition-all ${
            activeDrawers.todos
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title="Tasks & Checklist"
        >
          <ListTodo size={18} />
          {todoCount.total > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-primary text-primary-foreground border border-background">
              {todoCount.completed}/{todoCount.total}
            </span>
          )}
        </button>

        <button
          onClick={() => toggleDrawer("notes")}
          className={`p-2 rounded-xl transition-all ${
            activeDrawers.notes
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title="Focus Notes"
        >
          <NotebookPen size={18} />
        </button>

        <button
          onClick={() => toggleDrawer("distraction")}
          className="p-2 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-secondary/60 transition-all"
          title="Log Distraction"
        >
          <AlertCircle size={18} />
        </button>

        <button
          onClick={() => toggleDrawer("workflow")}
          className={`p-2 rounded-xl transition-all ${
            activeDrawers.workflow
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title="Workflow Resources"
        >
          <Blocks size={18} />
        </button>

        <button
          onClick={() => toggleDrawer("settings")}
          className={`p-2 rounded-xl transition-all ${
            activeDrawers.settings
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          title="Focus Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

export default FocusHeader;
