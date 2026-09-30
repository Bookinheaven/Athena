import { useState, useEffect } from "react";
import { Calendar, Clock, Sun, CalendarDays, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const formatDateToInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export default function TaskModal({
  open,
  onOpenChange,
  task = null,
  goals = [],
  defaultGoalId = null,
  defaultPlannedToday = false,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [priority, setPriority] = useState("medium");

  // Planning state: 'today' | 'tomorrow' | 'custom' | 'none'
  const [planMode, setPlanMode] = useState("today");
  const [customPlannedDate, setCustomPlannedDate] = useState("");

  // Due date state
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setGoal(task.goal || "");
        setPriority(task.priority || "medium");

        // Determine planMode from existing task.plannedDate
        if (task.plannedDate) {
          const taskDate = new Date(task.plannedDate).toDateString();
          const todayDate = new Date().toDateString();
          const tomorrowDate = getTomorrowDate().toDateString();

          if (taskDate === todayDate) {
            setPlanMode("today");
            setCustomPlannedDate("");
          } else if (taskDate === tomorrowDate) {
            setPlanMode("tomorrow");
            setCustomPlannedDate("");
          } else {
            setPlanMode("custom");
            setCustomPlannedDate(formatDateToInput(task.plannedDate));
          }
        } else {
          setPlanMode("none");
          setCustomPlannedDate("");
        }

        // Determine dueDate
        if (task.dueDate) {
          setHasDueDate(true);
          setDueDate(formatDateToInput(task.dueDate));
        } else {
          setHasDueDate(false);
          setDueDate("");
        }
      } else {
        // New task creation default
        setTitle("");
        setDescription("");
        setGoal(defaultGoalId || "");
        setPriority("medium");
        setPlanMode(defaultPlannedToday ? "today" : "today");
        setCustomPlannedDate("");
        setHasDueDate(false);
        setDueDate("");
      }
    }
  }, [open, task, defaultGoalId, defaultPlannedToday]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalPlannedDate = null;
      if (planMode === "today") {
        finalPlannedDate = new Date();
      } else if (planMode === "tomorrow") {
        finalPlannedDate = getTomorrowDate();
      } else if (planMode === "custom" && customPlannedDate) {
        finalPlannedDate = customPlannedDate;
      }

      let finalDueDate = undefined;
      if (hasDueDate && dueDate) {
        finalDueDate = new Date(dueDate + "T23:59:59");
      } else if (task && task.dueDate && !hasDueDate) {
        finalDueDate = null;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        goal: goal || null,
        priority,
        plannedDate: finalPlannedDate,
        dueDate: finalDueDate,
      };

      await onSave(payload, task?._id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {task
              ? "Update task details, schedule, and assignments."
              : "Add a task to organize your day and goals."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task Title <span className="text-destructive">*</span>
            </label>
            <Input
              required
              autoFocus
              placeholder="e.g., Implement authentication flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl font-medium"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Add context, subtasks, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Goal & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Goal / Project
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">No goal (Standalone)</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* PART 1: Plan Section (When to work on this task) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Plan (When do you intend to work on this?)
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "today", label: "Today", icon: Sun },
                { id: "tomorrow", label: "Tomorrow", icon: CalendarDays },
                { id: "custom", label: "Pick date", icon: Calendar },
                { id: "none", label: "No date", icon: Ban },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = planMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPlanMode(item.id);
                      if (item.id === "custom" && !customPlannedDate) {
                        setCustomPlannedDate(formatDateToInput(new Date()));
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-semibold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Picker Input */}
            {planMode === "custom" && (
              <div className="pt-1">
                <Input
                  type="date"
                  value={customPlannedDate}
                  onChange={(e) => setCustomPlannedDate(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* PART 2: Due Date (Optional completion deadline) */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Due Date (Optional Deadline)
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHasDueDate(false)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    !hasDueDate
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  No due date
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasDueDate(true);
                    if (!dueDate) setDueDate(formatDateToInput(new Date()));
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    hasDueDate
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Set due date
                </button>
              </div>
            </div>

            {hasDueDate && (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="rounded-xl font-semibold px-6 shadow-xs"
            >
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
