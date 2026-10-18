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
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Repeat,
  Clock,
  Target,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { ISO_WEEKDAYS, validateRoutinePayload } from "../utils/routineUtils.js";

const DEFAULT_STEP = { title: "", estimatedMinutes: "" };

export default function RoutineModal({
  open,
  onOpenChange,
  routine = null,
  goals = [],
  onSave,
}) {
  const [title, setTitle] = useState(routine?.title || "");
  const [description, setDescription] = useState(routine?.description || "");
  const [goalId, setGoalId] = useState(routine?.goalId || routine?.goal || "");
  const [recurrenceType, setRecurrenceType] = useState(
    routine?.recurrenceType || "daily"
  );
  const [recurrenceDays, setRecurrenceDays] = useState(
    Array.isArray(routine?.recurrenceDays) && routine.recurrenceDays.length > 0
      ? routine.recurrenceDays
      : [1, 2, 3, 4, 5, 6, 7]
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    routine?.estimatedMinutes || 15
  );
  const [targetTime, setTargetTime] = useState(routine?.targetTime || "");
  const [steps, setSteps] = useState(
    Array.isArray(routine?.steps) && routine.steps.length > 0
      ? [...routine.steps]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((s) => ({
            id: s.id || s._id,
            title: s.title || "",
            estimatedMinutes: s.estimatedMinutes ?? "",
          }))
      : [{ ...DEFAULT_STEP, title: routine?.title || "" }]
  );

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (routine) {
        setTitle(routine.title || "");
        setDescription(routine.description || "");
        setGoalId(routine.goalId || routine.goal || "");
        setRecurrenceType(routine.recurrenceType || "daily");
        setRecurrenceDays(
          Array.isArray(routine.recurrenceDays) && routine.recurrenceDays.length > 0
            ? routine.recurrenceDays
            : [1, 2, 3, 4, 5, 6, 7]
        );
        setEstimatedMinutes(routine.estimatedMinutes || 15);
        setTargetTime(routine.targetTime || "");

        if (Array.isArray(routine.steps) && routine.steps.length > 0) {
          const sorted = [...routine.steps].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
          );
          setSteps(
            sorted.map((s) => ({
              id: s.id || s._id,
              title: s.title || "",
              estimatedMinutes: s.estimatedMinutes ?? "",
            }))
          );
        } else {
          setSteps([{ ...DEFAULT_STEP, title: routine.title || "Step 1" }]);
        }
      } else {
        // Reset to initial new routine state
        setTitle("");
        setDescription("");
        setGoalId("");
        setRecurrenceType("daily");
        setRecurrenceDays([1, 2, 3, 4, 5, 6, 7]);
        setEstimatedMinutes(15);
        setTargetTime("");
        setSteps([{ ...DEFAULT_STEP, title: "" }]);
      }
    }
  }, [open, routine]);

  // Recurrence days toggling
  const toggleDay = (dayNum) => {
    setRecurrenceDays((prev) => {
      const exists = prev.includes(dayNum);
      if (exists) {
        return prev.filter((d) => d !== dayNum);
      } else {
        return [...prev, dayNum].sort((a, b) => a - b);
      }
    });
    if (errors.recurrenceDays) {
      setErrors((prev) => ({ ...prev, recurrenceDays: null }));
    }
  };

  const selectQuickDays = (type) => {
    if (type === "all") setRecurrenceDays([1, 2, 3, 4, 5, 6, 7]);
    if (type === "weekdays") setRecurrenceDays([1, 2, 3, 4, 5]);
    if (type === "weekends") setRecurrenceDays([6, 7]);
    if (errors.recurrenceDays) {
      setErrors((prev) => ({ ...prev, recurrenceDays: null }));
    }
  };

  // Step operations
  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      { ...DEFAULT_STEP, title: `Step ${prev.length + 1}` },
    ]);
    if (errors.steps || errors.stepTitles) {
      setErrors((prev) => ({ ...prev, steps: null, stepTitles: null }));
    }
  };

  const handleUpdateStep = (index, field, value) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    if (field === "title" && errors.stepTitles) {
      setErrors((prev) => ({ ...prev, stepTitles: null }));
    }
  };

  const handleRemoveStep = (index) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const preparedSteps = steps.map((s, idx) => ({
      ...(s.id ? { id: s.id } : {}),
      title: s.title.trim(),
      sortOrder: idx,
      estimatedMinutes: s.estimatedMinutes ? Number(s.estimatedMinutes) : null,
    }));

    const formData = {
      title: title.trim(),
      description: description.trim(),
      goalId: goalId || null,
      recurrenceType,
      recurrenceDays:
        recurrenceType === "daily" ? [1, 2, 3, 4, 5, 6, 7] : recurrenceDays,
      estimatedMinutes: Math.max(1, Number(estimatedMinutes) || 15),
      targetTime: targetTime ? targetTime.slice(0, 5) : null,
      steps: preparedSteps,
    };

    const validation = validateRoutinePayload(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData, routine?.id || routine?._id);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save routine:", err);
      setErrors({ form: err.message || "Failed to save routine" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border rounded-2xl shadow-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            {routine ? "Edit Routine" : "Create New Routine"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {routine
              ? "Update routine parameters and checklist steps. Future unstarted occurrences will update automatically."
              : "Define a recurring daily or scheduled routine with multi-step checklist items."}
          </DialogDescription>
        </DialogHeader>

        {errors.form && (
          <div className="flex items-center gap-2 p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Routine Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: null }));
              }}
              placeholder="e.g. Morning Focus Ritual"
              className="rounded-xl border-border bg-background focus-visible:ring-primary/20 text-sm h-10"
              maxLength={150}
              autoFocus
            />
            {errors.title && (
              <p className="text-xs text-destructive font-medium">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, intentions, or notes for this routine..."
              className="rounded-xl border-border bg-background focus-visible:ring-primary/20 text-sm min-h-[70px] resize-none"
              rows={2}
            />
          </div>

          {/* Goal & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Goal Association */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Associated Goal
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">No goal linked</option>
                {goals.map((g) => (
                  <option key={g._id || g.id} value={g._id || g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Estimated Total (min)
              </label>
              <Input
                type="number"
                min={1}
                max={480}
                value={estimatedMinutes}
                onChange={(e) => {
                  setEstimatedMinutes(e.target.value);
                  if (errors.estimatedMinutes)
                    setErrors((p) => ({ ...p, estimatedMinutes: null }));
                }}
                className="rounded-xl border-border bg-background text-sm h-10"
              />
              {errors.estimatedMinutes && (
                <p className="text-xs text-destructive font-medium">
                  {errors.estimatedMinutes}
                </p>
              )}
            </div>
          </div>

          {/* Recurrence Selection */}
          <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-secondary/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-primary" /> Recurrence Pattern
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 cursor-pointer">
                  <Clock className="w-3 h-3" /> Preferred Time:
                  <input
                    type="time"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    className="ml-1 px-2 py-0.5 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </label>
              </div>
            </div>

            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecurrenceType("daily")}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  recurrenceType === "daily"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary/40"
                }`}
              >
                Every Day (Daily)
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceType("selected_days")}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  recurrenceType === "selected_days"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary/40"
                }`}
              >
                Selected Weekdays
              </button>
            </div>

            {/* Weekdays picker (shown if selected_days) */}
            {recurrenceType === "selected_days" && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Select active days:
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => selectQuickDays("weekdays")}
                      className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuickDays("weekends")}
                      className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Weekends
                    </button>
                    <button
                      type="button"
                      onClick={() => selectQuickDays("all")}
                      className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {ISO_WEEKDAYS.map((w) => {
                    const isSelected = recurrenceDays.includes(w.day);
                    return (
                      <button
                        key={w.day}
                        type="button"
                        onClick={() => toggleDay(w.day)}
                        className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                            : "bg-background border border-border text-muted-foreground hover:border-foreground/40"
                        }`}
                        title={w.label}
                      >
                        <span>{w.short}</span>
                      </button>
                    );
                  })}
                </div>

                {errors.recurrenceDays && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.recurrenceDays}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Checklist Steps Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Checklist Steps <span className="text-destructive">*</span>
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Order your steps from first to last. Single-step recurring tasks need only 1 step.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                className="h-8 rounded-xl text-xs gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </Button>
            </div>

            {errors.stepTitles && (
              <p className="text-xs text-destructive font-medium">{errors.stepTitles}</p>
            )}
            {errors.steps && (
              <p className="text-xs text-destructive font-medium">{errors.steps}</p>
            )}

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-background hover:border-border transition-colors group"
                >
                  <div className="flex items-center text-muted-foreground/60 gap-0.5">
                    <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Step Title Input */}
                  <Input
                    value={step.title}
                    onChange={(e) => handleUpdateStep(idx, "title", e.target.value)}
                    placeholder={`Step ${idx + 1} action (e.g. Drink glass of water)`}
                    className="flex-1 rounded-lg border-border bg-card text-xs h-8.5 focus-visible:ring-primary/20"
                    maxLength={150}
                  />

                  {/* Step Duration (optional) */}
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={step.estimatedMinutes}
                      onChange={(e) =>
                        handleUpdateStep(idx, "estimatedMinutes", e.target.value)
                      }
                      placeholder="min"
                      className="rounded-lg border-border bg-card text-xs h-8.5 text-center"
                      title="Estimated minutes for this step"
                    />
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, -1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move step up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === steps.length - 1}
                      onClick={() => handleMoveStep(idx, 1)}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move step down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    disabled={steps.length <= 1}
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors rounded-lg"
                    title={steps.length <= 1 ? "At least one step is required" : "Remove step"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-medium h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-semibold text-xs h-9 px-5 shadow-xs"
            >
              {isSubmitting ? "Saving..." : routine ? "Save Changes" : "Create Routine"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
