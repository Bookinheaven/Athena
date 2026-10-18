import { useMemo, useState } from "react";
import {
  Play,
  Trash2,
  CheckCircle2,
  SkipForward,
  MoreVertical,
  Target,
  GripVertical,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { START_HOUR, TOTAL_MINUTES } from "../hooks/useTimelineData.js";

export default function ScheduleBlockItem({
  block,
  column = 0,
  totalColumns = 1,
  onStartFocus,
  onUpdateBlock,
  onDeleteBlock,
}) {
  const [isResizing, setIsResizing] = useState(null); // 'top' | 'bottom' | null

  // Task or Routine details
  const isRoutine = Boolean(block.routineOccurrenceId || block.routineOccurrence);
  const routineOcc = block.routineOccurrence || {};
  const task = block.taskId || {};

  const title = isRoutine
    ? (routineOcc.snapshotTitle || routineOcc.titleSnapshot || routineOcc.title || "Routine")
    : ((typeof task === "object" ? task.title : null) || "Untitled Task");
  const goalTitle = isRoutine ? null : (task?.goal?.title || null);

  const isCompleted = block.status === "completed" || (isRoutine && routineOcc.status === "completed");
  const isSkipped = block.status === "skipped" || (isRoutine && routineOcc.status === "skipped");
  const isScheduled = block.status === "scheduled" && !isCompleted && !isSkipped;

  const totalSteps = routineOcc.totalSteps ?? (Array.isArray(routineOcc.steps) ? routineOcc.steps.length : null);
  const completedSteps = routineOcc.completedSteps ?? (Array.isArray(routineOcc.steps) ? routineOcc.steps.filter((s) => s.status === "completed").length : 0);
  const hasStepProgress = isRoutine && totalSteps != null && totalSteps > 0;

  // Position calculation
  const { topPercent, heightPercent, timeLabel } = useMemo(() => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);

    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const duration = block.durationMinutes || Math.max(15, Math.round((end - start) / (1000 * 60)));

    const top = Math.max(0, Math.min(100, (startMinutes / TOTAL_MINUTES) * 100));
    // Visual height scales accurately with duration to prevent overlapping adjacent blocks
    const rawHeight = (duration / TOTAL_MINUTES) * 100;
    const height = Math.max(1.8, Math.min(100 - top, rawHeight));

    const formatTime = (d) =>
      d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

    return {
      topPercent: top,
      heightPercent: height,
      timeLabel: `${formatTime(start)} – ${formatTime(end)}`,
    };
  }, [block.startTime, block.endTime, block.durationMinutes]);

  // Overlap positioning
  const leftPercent = (column / totalColumns) * 100;
  const widthPercent = (1 / totalColumns) * 100;

  // Determine if this is a compact block (under 45 minutes)
  const isCompact = (block.durationMinutes || 60) < 45;

  // Drag start handler for moving existing block
  const handleDragStart = (e) => {
    if (!isScheduled) return;
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "move_block",
        blockId: block._id,
        durationMinutes: block.durationMinutes,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  // Resize handler using mouse interaction
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(direction);

    const gridContainer = e.currentTarget.closest(".timeline-grid-container");
    if (!gridContainer) return;

    const gridRect = gridContainer.getBoundingClientRect();
    const gridHeight = gridRect.height;

    const handleMouseMove = (moveEvent) => {
      const offsetY = moveEvent.clientY - gridRect.top;
      const ratio = Math.max(0, Math.min(1, offsetY / gridHeight));
      const rawMinutes = Math.round(ratio * TOTAL_MINUTES) + START_HOUR * 60;
      // Snap to 15-min intervals
      const snappedMinutes = Math.round(rawMinutes / 15) * 15;

      const currentStart = new Date(block.startTime);
      const currentEnd = new Date(block.endTime);

      if (direction === "bottom") {
        const newEnd = new Date(currentStart);
        newEnd.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);
        if (newEnd.getTime() > currentStart.getTime() + 15 * 60 * 1000) {
          onUpdateBlock(block._id, { endTime: newEnd });
        }
      } else if (direction === "top") {
        const newStart = new Date(currentEnd);
        newStart.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);
        if (newStart.getTime() < currentEnd.getTime() - 15 * 60 * 1000) {
          onUpdateBlock(block._id, { startTime: newStart });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      draggable={isScheduled}
      onDragStart={handleDragStart}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        left: `${leftPercent}%`,
        width: `calc(${widthPercent}% - 6px)`,
      }}
      className={`absolute z-10 hover:z-20 mx-1 rounded-xl transition-all group flex flex-col justify-center overflow-hidden select-none border ${
        isCompact ? "py-0.5 px-2" : "py-1.5 px-2.5 justify-start gap-1"
      } ${
        isScheduled
          ? isRoutine
            ? "bg-card/95 hover:bg-card border-violet-500/40 hover:border-violet-500 text-card-foreground shadow-2xs cursor-grab active:cursor-grabbing hover:shadow-md"
            : "bg-card/95 hover:bg-card border-primary/40 hover:border-primary text-card-foreground shadow-2xs cursor-grab active:cursor-grabbing hover:shadow-md"
          : isCompleted
          ? "bg-secondary/50 border-border/40 text-muted-foreground opacity-80"
          : "bg-muted/30 border-dashed border-border/60 text-muted-foreground opacity-60"
      }`}
      data-testid={isRoutine ? `routine-block-${block._id || block.id}` : `task-block-${block._id || block.id}`}
    >
      {/* Top resize handle */}
      {isScheduled && !isCompact && (
        <div
          onMouseDown={(e) => handleResizeStart(e, "top")}
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/30 z-20"
          title="Resize start time"
        />
      )}

      {isCompact ? (
        /* Compact single-row layout for blocks under 45m: prevents text trimming and height clipping */
        <div className="flex items-center justify-between gap-1.5 min-w-0 w-full">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            {isScheduled && (
              <GripVertical className="w-3 h-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
            {isSkipped && (
              <SkipForward className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span
              className={`text-xs font-semibold leading-tight truncate ${
                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
              }`}
              title={title}
            >
              {title}
            </span>
            {isRoutine && (
              <span
                data-testid="routine-indicator"
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25 shrink-0"
                title="Routine"
              >
                <Repeat className="w-2.5 h-2.5" />
                <span>Routine</span>
              </span>
            )}
            {isRoutine && hasStepProgress && (
              <span
                data-testid="routine-step-progress"
                className="text-[9px] text-muted-foreground truncate shrink-0 hidden sm:inline"
                title={`${completedSteps} of ${totalSteps} steps completed`}
              >
                {completedSteps} of {totalSteps} steps completed
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {block.durationMinutes}m
            </span>
          </div>

          {/* Action buttons on hover */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {isScheduled && (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocus(block);
                  }}
                  className="h-4.5 w-4.5 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                  title="Start Focus Session"
                >
                  <Play className="w-2 h-2 fill-current" />
                </Button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBlock(block._id || block.id, { status: "completed" });
                  }}
                  className="p-0.5 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  title="Mark completed"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateBlock(block._id || block.id, { status: "skipped" });
                  }}
                  className="p-0.5 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                  title="Mark skipped"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock(block._id || block.id);
              }}
              className="h-4.5 w-4.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Remove from schedule"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </Button>
          </div>
        </div>
      ) : (
        /* Multi-row layout for larger blocks (>= 45m) */
        <>
          {/* Header row: Time label and action buttons */}
          <div className="flex items-center justify-between gap-1.5 min-w-0 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {isScheduled && (
                <GripVertical className="w-3 h-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
              {isCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              {isSkipped && (
                <SkipForward className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-[11px] font-mono font-medium text-muted-foreground truncate">
                {timeLabel}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-secondary text-foreground font-semibold shrink-0">
                {block.durationMinutes}m
              </span>
              {isRoutine && (
                <span
                  data-testid="routine-indicator"
                  className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25 shrink-0"
                  title="Routine"
                >
                  <Repeat className="w-2.5 h-2.5" />
                  <span>Routine</span>
                </span>
              )}
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {isScheduled && (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartFocus(block);
                    }}
                    className="h-5 w-5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
                    title="Start Focus Session"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock(block._id || block.id, { status: "completed" });
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                    title="Mark completed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBlock(block._id || block.id, { status: "skipped" });
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                    title="Mark skipped"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block._id || block.id);
                }}
                className="h-5 w-5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Remove from schedule"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Title, Context, and Progress */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <p
              className={`text-xs font-semibold leading-tight truncate ${
                isCompleted ? "line-through text-muted-foreground" : "text-foreground"
              }`}
              title={title}
            >
              {title}
            </p>

            {isRoutine && hasStepProgress && (
              <div
                data-testid="routine-step-progress"
                className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground truncate"
              >
                <span>{completedSteps} of {totalSteps} steps completed</span>
              </div>
            )}

            {goalTitle && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground truncate">
                <Target className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{goalTitle}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom resize handle */}
      {isScheduled && !isCompact && (
        <div
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/30 z-20"
          title="Resize end time"
        />
      )}
    </div>
  );
}
