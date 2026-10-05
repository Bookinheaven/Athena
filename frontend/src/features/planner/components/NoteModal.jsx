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
import { PLACEHOLDERS } from "@/constants/placeholders.js";

const getPlainText = (html = "") => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
};

export default function NoteModal({
  open,
  onOpenChange,
  note = null,
  goals = [],
  tasks = [],
  defaultGoalId = null,
  defaultTaskId = null,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [goal, setGoal] = useState("");
  const [task, setTask] = useState("");
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (note) {
        setTitle(note.title || "");
        setContent(getPlainText(note.content || ""));
        setGoal(note.goal || "");
        setTask(note.task || note.taskId || "");
        setPinned(!!note.pinned);
      } else {
        setTitle("");
        setContent("");
        setGoal(defaultGoalId || "");
        setTask(defaultTaskId || "");
        setPinned(false);
      }
    }
  }, [open, note, defaultGoalId, defaultTaskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let formattedContent = content.trim();
      if (!formattedContent.startsWith("<p>") && !formattedContent.startsWith("<h")) {
        formattedContent = `<p>${formattedContent
          .replace(/\n\n/g, "</p><p>")
          .replace(/\n/g, "<br />")}</p>`;
      }

      const payload = {
        title: title.trim(),
        content: formattedContent,
        goal: goal || null,
        task: task || null,
        pinned,
      };

      await onSave(payload, note?._id || note?.id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 bg-card border-border rounded-2xl shadow-lg">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            {note ? "Edit Note" : "Create Note"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {note
              ? "Update your planning note or context."
              : "Capture ideas, references, or context for your work."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <Input
              autoFocus
              placeholder={PLACEHOLDERS.notes.optionalTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Content <span className="text-destructive">*</span>
            </label>
            <Textarea
              required
              placeholder={PLACEHOLDERS.notes.content}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Associations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Linked Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Linked Task
              </label>
              <select
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-card text-foreground text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
              />
              Pin to top
            </label>
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
              disabled={!content.trim() || isSubmitting}
              className="rounded-xl font-semibold px-5 shadow-xs"
            >
              {note ? "Save Changes" : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
