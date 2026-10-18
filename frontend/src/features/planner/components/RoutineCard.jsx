import { useState } from "react";
import {
  Repeat,
  Clock,
  Target,
  Edit2,
  Trash2,
  Pause,
  Play,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { formatRecurrence, formatTargetTime } from "../utils/routineUtils.js";

export default function RoutineCard({
  routine,
  goals = [],
  onEdit,
  onToggleStatus,
  onArchive,
  onDelete,
}) {
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const linkedGoal = goals.find(
    (g) => (g._id || g.id) === (routine.goalId || routine.goal)
  );

  const recurrenceDisplay = formatRecurrence(
    routine.recurrenceType,
    routine.recurrenceDays
  );

  const timeDisplay = formatTargetTime(routine.targetTime);
  const steps = Array.isArray(routine.steps) ? routine.steps : [];
  const isActive = routine.status === "active";
  const isPaused = routine.status === "paused";
  const isArchived = routine.status === "archived";

  return (
    <Card className="border-border/80 bg-card hover:border-border transition-all shadow-xs rounded-2xl overflow-hidden group">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header row: Status, Title, Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : isPaused
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isActive ? "Active" : isPaused ? "Paused" : "Archived"}
              </span>

              {/* Recurrence Chip */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
                <Repeat className="w-3 h-3" />
                {recurrenceDisplay}
              </span>

              {/* Target Time if set */}
              {timeDisplay && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/80 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {timeDisplay}
                </span>
              )}

              {/* Estimated duration */}
              <span className="text-[11px] text-muted-foreground font-medium">
                ~{routine.estimatedMinutes || 15}m total
              </span>
            </div>

            {/* Routine Title */}
            <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight truncate">
              {routine.title}
            </h3>

            {/* Optional Description */}
            {routine.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {routine.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Pause / Resume Button */}
            {!isArchived && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleStatus(routine)}
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                title={isActive ? "Pause routine" : "Resume routine"}
              >
                {isActive ? (
                  <Pause className="w-4 h-4 text-amber-500" />
                ) : (
                  <Play className="w-4 h-4 text-emerald-500" />
                )}
              </Button>
            )}

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(routine)}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              title="Edit routine"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            {/* Archive / Restore Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onArchive(routine)}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              title={isArchived ? "Restore routine" : "Archive routine"}
            >
              {isArchived ? (
                <ArchiveRestore className="w-4 h-4 text-primary" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(routine)}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
              title="Delete routine"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Footer meta: Linked Goal + Steps toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
          {/* Linked Goal */}
          <div className="flex items-center gap-2">
            {linkedGoal ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-secondary/50 text-foreground font-medium">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: linkedGoal.color || "#6366f1" }}
                />
                <span className="truncate max-w-[150px]">{linkedGoal.title}</span>
              </div>
            ) : (
              <span className="text-muted-foreground/60">No goal linked</span>
            )}
          </div>

          {/* Steps count & expand toggle */}
          <button
            type="button"
            onClick={() => setStepsExpanded((p) => !p)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>
              {steps.length} {steps.length === 1 ? "step" : "steps"}
            </span>
            {stepsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Expanded Checklist Steps Preview */}
        {stepsExpanded && steps.length > 0 && (
          <div className="pt-2 space-y-1.5 border-t border-dashed border-border/60">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Checklist Steps:
            </div>
            <div className="space-y-1">
              {steps.map((step, idx) => (
                <div
                  key={step.id || step._id || idx}
                  className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-secondary/30 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-foreground">{step.title}</span>
                  </div>
                  {step.estimatedMinutes && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      ~{step.estimatedMinutes}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
