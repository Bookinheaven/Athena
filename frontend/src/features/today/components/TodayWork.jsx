import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import TodayTaskItem from "./TodayTaskItem.jsx";
import { PLACEHOLDERS } from "@/constants/placeholders.js";

export default function TodayWork({
  tasks = [],
  completedTasks = [],
  goals = [],
  onToggleStatus,
  onStartFocus,
  onQuickAddTask,
  isAddingTask,
  setIsAddingTask,
}) {
  const navigate = useNavigate();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onQuickAddTask(newTaskTitle.trim());
    if (success) {
      setNewTaskTitle("");
      setIsAddingTask(false);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="lg:col-span-7 xl:col-span-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Work
          </h2>
          {tasks.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            >
              {completedTasks.length}/{tasks.length} done
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isAddingTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg px-2.5"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add task
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg px-2.5"
            onClick={() => navigate("/planner")}
          >
            Planner <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Inline Quick Add Task Input */}
      {isAddingTask && (
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 p-2 bg-card border border-primary/40 rounded-xl shadow-xs"
        >
          <Input
            autoFocus
            placeholder={PLACEHOLDERS.tasks.quickAdd}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-9 bg-transparent"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newTaskTitle.trim() || isSubmitting}
            className="rounded-lg text-xs font-semibold px-3 h-8"
          >
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddingTask(false);
              setNewTaskTitle("");
            }}
            className="rounded-lg text-xs font-medium px-2.5 h-8 text-muted-foreground"
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Task list */}
      <div className="space-y-2.5">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const goalObj = goals.find((g) => g._id === task.goal);
            return (
              <TodayTaskItem
                key={task._id}
                task={task}
                goalObj={goalObj}
                onToggleStatus={onToggleStatus}
                onStartFocus={onStartFocus}
              />
            );
          })
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-card/40 text-center space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              No tasks scheduled for today
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-medium text-xs"
              onClick={() => setIsAddingTask(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add your first task
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
