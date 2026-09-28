import { useState, useEffect } from "react";
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

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

export default function GoalModal({
  open,
  onOpenChange,
  goal = null,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (goal) {
        setTitle(goal.title || "");
        setDescription(goal.description || "");
        setColor(goal.color || "#6366f1");
        setStartDate(
          goal.startDate
            ? new Date(goal.startDate).toISOString().split("T")[0]
            : ""
        );
        setDueDate(
          goal.dueDate
            ? new Date(goal.dueDate).toISOString().split("T")[0]
            : ""
        );
      } else {
        setTitle("");
        setDescription("");
        setColor("#6366f1");
        setStartDate("");
        setDueDate("");
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        color,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      };

      await onSave(payload, goal?._id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-card border-border rounded-2xl shadow-lg">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            {goal ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {goal
              ? "Update your long-term goal and deadlines."
              : "Define a higher-level goal to organize your tasks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Goal Title <span className="text-destructive">*</span>
            </label>
            <Input
              required
              autoFocus
              placeholder="e.g., Launch Athena v2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <Textarea
              placeholder="What does success look like for this goal?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Color Accent
            </label>
            <div className="flex items-center gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Start Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4">
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
              className="rounded-xl font-semibold px-5 shadow-xs"
            >
              {goal ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
