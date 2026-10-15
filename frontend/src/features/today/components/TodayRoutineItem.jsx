import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  FastForward,
  ChevronDown,
  ChevronUp,
  Loader2,
  ListChecks,
  Check,
  RotateCcw,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { formatTargetTime } from "../../planner/utils/routineUtils.js";

export default function TodayRoutineItem({
  occurrence,
  onCompleteStep,
  onSkipOccurrence,
  onUnskipOccurrence,
  initiallyExpanded = false,
}) {
  let navigate = null;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [mutatingStepId, setMutatingStepId] = useState(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isUnskipping, setIsUnskipping] = useState(false);

  const isCompleted = occurrence.status === "completed";
  const isSkipped = occurrence.status === "skipped";
  const isInProgress = occurrence.status === "in_progress";
  const isPending = occurrence.status === "pending";

  const timeDisplay = formatTargetTime(occurrence.targetTime);
  const steps = Array.isArray(occurrence.steps) ? occurrence.steps : [];
  const isSingleStep = occurrence.totalSteps === 1 && steps.length === 1;
  const singleStep = isSingleStep ? steps[0] : null;

  const handleStepClick = async (step) => {
    if (mutatingStepId || isSkipping || isUnskipping) return;
    const nextCompleted = step.status !== "completed";
    setMutatingStepId(step.id || step._id);
    try {
      await onCompleteStep(occurrence.id || occurrence._id, step.id || step._id, nextCompleted);
    } finally {
      setMutatingStepId(null);
    }
  };

  const handleSkipClick = async (e) => {
    if (e) e.stopPropagation();
    if (isSkipped || isCompleted || isSkipping || isUnskipping || mutatingStepId) return;
    setIsSkipping(true);
    try {
      await onSkipOccurrence(occurrence.id || occurrence._id);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleUnskipClick = async (e) => {
    if (e) e.stopPropagation();
    if (!isSkipped || isUnskipping || isSkipping || mutatingStepId) return;
    if (!onUnskipOccurrence) return;
    setIsUnskipping(true);
    try {
      await onUnskipOccurrence(occurrence.id || occurrence._id);
    } finally {
      setIsUnskipping(false);
    }
  };

  const handleManageClick = (e) => {
    if (e) e.stopPropagation();
    navigate("/planner?tab=routines");
  };

  // Case 1: Single-step compact recurring task item
  if (isSingleStep && singleStep) {
    const isStepDone = singleStep.status === "completed";

    return (
      <div
        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all ${isCompleted
          ? "bg-emerald-500/5 border-emerald-500/20"
          : isSkipped
            ? "bg-muted/30 border-border/60 opacity-75 hover:opacity-100"
            : "bg-card border-border hover:border-border/80 shadow-2xs"
          }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Checkbox button */}
          <button
            type="button"
            disabled={mutatingStepId === (singleStep.id || singleStep._id) || isSkipping || isUnskipping}
            onClick={() => handleStepClick(singleStep)}
            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${isStepDone
              ? "bg-emerald-500 text-white"
              : "border border-muted-foreground/40 hover:border-primary text-transparent"
              } disabled:cursor-not-allowed`}
            title={
              isStepDone
                ? "Mark incomplete"
                : isSkipped
                  ? "Complete and unskip routine"
                  : "Mark step completed"
            }
          >
            {mutatingStepId === (singleStep.id || singleStep._id) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : isStepDone ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-medium leading-tight truncate ${isStepDone
                  ? "line-through text-muted-foreground"
                  : isSkipped
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                  }`}
              >
                {occurrence.snapshotTitle || occurrence.titleSnapshot || occurrence.title || "Routine"}
              </span>

              {/* Target time */}
              {timeDisplay && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Clock className="w-3 h-3" />
                  {timeDisplay}
                </span>
              )}

              {/* Skipped Badge */}
              {isSkipped && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Skipped
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side actions: Unskip / Skip + Options Menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Explicit Unskip button when skipped */}
          {isSkipped && onUnskipOccurrence && (
            <button
              type="button"
              disabled={isUnskipping}
              onClick={handleUnskipClick}
              className="text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/15 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Restore skipped routine"
            >
              {isUnskipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Unskip</span>
                </>
              )}
            </button>
          )}

          {/* Skip action when active */}
          {!isCompleted && !isSkipped && (
            <button
              type="button"
              disabled={isSkipping}
              onClick={handleSkipClick}
              className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 cursor-pointer"
              title="Skip this occurrence today"
            >
              {isSkipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Skip</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Multi-step routine expandable card
  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${isCompleted
        ? "bg-emerald-500/5 border-emerald-500/20"
        : isSkipped
          ? "bg-muted/20 border-border/60 opacity-80 hover:opacity-100"
          : isInProgress
            ? "bg-card border-primary/30 shadow-xs"
            : "bg-card border-border shadow-2xs"
        }`}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${isCompleted
              ? "bg-emerald-500/20 text-emerald-500"
              : isInProgress
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground"
              }`}
          >
            <ListChecks className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-semibold tracking-tight truncate ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
              >
                {occurrence.snapshotTitle || occurrence.titleSnapshot || occurrence.title || "Routine"}
              </h4>

              {/* Status pill */}
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${isCompleted
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : isSkipped
                    ? "bg-muted text-muted-foreground border-border"
                    : isInProgress
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-muted-foreground border-border/50"
                  }`}
              >
                {isCompleted
                  ? "Completed"
                  : isSkipped
                    ? "Skipped"
                    : isInProgress
                      ? "In Progress"
                      : "Pending"}
              </span>

              {/* Target time */}
              {timeDisplay && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <Clock className="w-3 h-3" />
                  {timeDisplay}
                </span>
              )}
            </div>

            {/* Step progress summary */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-medium">
                {occurrence.completedSteps} of {occurrence.totalSteps} steps completed
              </span>
              <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden shrink-0">
                <div
                  className={`h-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : "bg-primary"
                    }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (occurrence.completedSteps / Math.max(1, occurrence.totalSteps)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side controls: Unskip / Skip + Options Menu + Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Explicit Unskip button when skipped */}
          {isSkipped && onUnskipOccurrence && (
            <button
              type="button"
              disabled={isUnskipping}
              onClick={handleUnskipClick}
              className="text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/15 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Restore skipped routine"
            >
              {isUnskipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Unskip</span>
                </>
              )}
            </button>
          )}

          {/* Skip action when active */}
          {!isCompleted && !isSkipped && (
            <button
              type="button"
              disabled={isSkipping}
              onClick={handleSkipClick}
              className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Skip this occurrence today"
            >
              {isSkipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Skip</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? "Collapse checklist" : "Expand checklist"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable checklist steps */}
      {isExpanded && steps.length > 0 && (
        <div className="px-4 pb-4 pt-1 space-y-1.5 border-t border-border/50 bg-secondary/10 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider pt-2 pb-1">
            Checklist Steps
          </div>
          {steps.map((step, idx) => {
            const isStepDone = step.status === "completed";
            const stepId = step.id || step._id;
            const isMutatingThis = mutatingStepId === stepId;

            return (
              <div
                key={stepId || idx}
                onClick={() => handleStepClick(step)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${isStepDone
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-background border-border/70 hover:border-border"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={isMutatingThis || isSkipping || isUnskipping}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${isStepDone
                      ? "bg-emerald-500 text-white"
                      : "border border-muted-foreground/40 hover:border-primary text-transparent"
                      }`}
                  >
                    {isMutatingThis ? (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    ) : isStepDone ? (
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    ) : null}
                  </button>

                  <span
                    className={`text-xs font-medium truncate ${isStepDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                  >
                    {step.title || step.titleSnapshot || step.snapshotTitle || "Step"}
                  </span>
                </div>

                {step.estimatedMinutes && (
                  <span className="text-[10px] text-muted-foreground font-medium shrink-0 ml-2">
                    ~{step.estimatedMinutes}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
