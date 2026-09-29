import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TodoList } from "../task/TodoList.jsx";
import { CurrentProgress } from "../progress/CurrentProgress.jsx";
import { Notes } from "../notes/Notes.jsx";
import { Settings } from "../settings/Setting.jsx";
import {
  ListTodo,
  Activity,
  AlertCircle,
  Smartphone,
  MessageSquare,
  Users,
  Music,
  Globe,
  CloudRain,
  Settings as SettingsIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const DISTRACTION_OPTIONS = [
  { label: "Phone", icon: Smartphone },
  { label: "Messages", icon: MessageSquare },
  { label: "People", icon: Users },
  { label: "Noise", icon: Music },
  { label: "Web Browsing", icon: Globe },
  { label: "Mind Wandering", icon: CloudRain },
];

export const FocusDrawers = ({
  activeDrawers,
  closeDrawer,
  // Todos & Progress
  todos,
  newTodo,
  setNewTodo,
  onAddTodo,
  onUpdateTodoStatus,
  onDeleteTodo,
  runtime,
  // Notes
  notesProps,
  // Settings
  settingsProps,
  // Distraction
  sessionReview,
  onDistractionToggle,
}) => {
  const [taskTab, setTaskTab] = useState("checklist"); // 'checklist' | 'active'
  const [customDistraction, setCustomDistraction] = useState("");

  const inProgressCount = todos.filter((t) => t.status === "In Progress").length;

  const handleLogCustomDistraction = () => {
    if (!customDistraction.trim()) return;
    onDistractionToggle(customDistraction.trim());
    toast.success(`Distraction logged: "${customDistraction.trim()}"`);
    setCustomDistraction("");
    closeDrawer("distraction");
  };

  return (
    <>
      {/* Tasks sheet */}
      <Sheet
        open={!!activeDrawers.todos}
        onOpenChange={(open) => {
          if (!open) closeDrawer("todos");
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
        >
          <SheetHeader className="pl-6 pr-12 pt-6 pb-3 border-b border-border/60 shrink-0">
            <SheetTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <ListTodo size={18} className="text-primary" />
              <span>Tasks & Execution</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Track tasks and focus goals for this session.
            </SheetDescription>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl mt-3">
              <button
                type="button"
                onClick={() => setTaskTab("checklist")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskTab === "checklist"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Checklist ({todos.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskTab("active")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  taskTab === "active"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity size={12} className={inProgressCount > 0 ? "text-amber-500 animate-pulse" : ""} />
                <span>Active ({inProgressCount})</span>
              </button>
            </div>
          </SheetHeader>

          {/* Drawer Body */}
          <div className="flex-1 min-h-0 flex flex-col">
            {taskTab === "checklist" ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <TodoList
                  todos={todos}
                  newTodo={newTodo}
                  setNewTodo={setNewTodo}
                  onAddTodo={onAddTodo}
                  onUpdateStatus={onUpdateTodoStatus}
                  onDeleteTodo={onDeleteTodo}
                  show={true}
                  hideHeader={true}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                <CurrentProgress
                  todos={todos}
                  runtime={runtime}
                  show={true}
                  hideHeader={true}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Focus notes sheet */}
      <Sheet
        open={!!activeDrawers.notes}
        onOpenChange={(open) => {
          if (!open) closeDrawer("notes");
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg p-0 flex flex-col bg-background border-l border-border"
        >
          <SheetHeader className="pl-6 pr-12 pt-6 pb-3 border-b border-border/60 shrink-0">
            <SheetTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Focus Notes</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Scratchpad and execution thoughts for this session.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col">
            {notesProps && (
              <Notes
                notes={notesProps.notes}
                todos={todos}
                createNote={notesProps.createNote}
                updateNote={notesProps.updateNote}
                deleteNote={notesProps.deleteNote}
                show={true}
                hideHeader={true}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Distraction modal */}
      <Dialog
        open={!!activeDrawers.distraction}
        onOpenChange={(open) => {
          if (!open) closeDrawer("distraction");
        }}
      >
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              <span>Log Distraction</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Acknowledge what pulled your attention, then return to focus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick chips */}
            <div className="grid grid-cols-2 gap-2">
              {DISTRACTION_OPTIONS.map(({ label, icon: Icon }) => {
                const isTagged = (sessionReview?.distractions || "")
                  .toLowerCase()
                  .includes(label.toLowerCase());

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      onDistractionToggle(label);
                      toast.success(
                        isTagged ? `Removed ${label}` : `Logged ${label}`
                      );
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isTagged
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-sm"
                        : "bg-secondary/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom note */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customDistraction}
                onChange={(e) => setCustomDistraction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogCustomDistraction();
                }}
                placeholder="Or type a specific distraction..."
                className="flex-1 px-3 py-2 rounded-xl bg-secondary/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleLogCustomDistraction}
                disabled={!customDistraction.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Log
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings sheet */}
      <Sheet
        open={!!activeDrawers.settings}
        onOpenChange={(open) => {
          if (!open) closeDrawer("settings");
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
        >
          <SheetHeader className="pl-6 pr-12 pt-6 pb-3 border-b border-border/60 shrink-0">
            <SheetTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <SettingsIcon size={18} className="text-primary" />
              <span>Settings</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Configure timer intervals, breaks, and transition sounds.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 flex flex-col">
            {settingsProps && (
              <Settings
                plannedDuration={settingsProps.plannedDuration}
                initialValues={settingsProps.settings}
                onSave={settingsProps.onSave}
                show={true}
                hideHeader={true}
                onClose={() => closeDrawer("settings")}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default FocusDrawers;
