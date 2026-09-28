import { useMemo, useState } from "react";
import {
  Play,
  Trash2,
  CheckCircle2,
  SkipForward,
  MoreVertical,
  Target,
  GripVertical,
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

  // Task details
  const task = block.taskId || {};
  const taskTitle = typeof task === "object" ? task.title : "Untitled Task";
  const goalTitle = task?.goal?.title || null;
  const isCompleted = block.status === "completed";
  const isSkipped = block.status === "skipped";
  const isScheduled = block.status === "scheduled";

  // Position calculation
  const { topPercent, heightPercent, timeLabel } = useMemo(() => {
    const start = new Date(block.startTime);
    const end = new Date(block.endTime);

    const startMinutes = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const duration = block.durationMinutes || Math.max(15, Math.round((end - start) / (1000 * 60)));

    const top = Math.max(0, (startMinutes / TOTAL_MINUTES) * 100);
    const height = Math.max(2.5, (duration / TOTAL_MINUTES) * 100);

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
      className={`absolute z-10 mx-1 rounded-xl p-2.5 transition-all group flex flex-col justify-between overflow-hidden select-none border ${
        isScheduled
          ? "bg-card/95 hover:bg-card border-primary/40 hover:border-primary text-card-foreground shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md"
          : isCompleted
          ? "bg-secondary/50 border-border/40 text-muted-foreground opacity-80"
          : "bg-muted/30 border-dashed border-border/60 text-muted-foreground opacity-60"
      }`}
    >
      {/* Top resize handle */}
      {isScheduled && (
        <div
          onMouseDown={(e) => handleResizeStart(e, "top")}
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/30 z-20"
          title="Resize start time"
        />
      )}

      {/* Header row: Time label and action buttons */}
      <div className="flex items-start justify-between gap-1.5 min-w-0">
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
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {isScheduled && (
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(block);
              }}
              className="h-6 w-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
              title="Start Focus Session"
            >
              <Play className="w-3 h-3 fill-current" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBlock(block._id);
            }}
            className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Remove from schedule"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Task Title and Context */}
      <div className="my-auto py-0.5 min-w-0">
        <p
          className={`text-xs font-semibold leading-snug truncate ${
            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {taskTitle}
        </p>

        {goalTitle && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground truncate">
            <Target className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{goalTitle}</span>
          </div>
        )}
      </div>

      {/* Status indicator badge (for small blocks) */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="capitalize font-medium text-[10px]">
          {block.status}
        </span>
        {isScheduled && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateBlock(block._id, { status: "completed" });
              }}
              className="hover:text-emerald-500 transition-colors p-0.5"
              title="Mark completed"
            >
              <CheckCircle2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateBlock(block._id, { status: "skipped" });
              }}
              className="hover:text-amber-500 transition-colors p-0.5"
              title="Mark skipped"
            >
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom resize handle */}
      {isScheduled && (
        <div
          onMouseDown={(e) => handleResizeStart(e, "bottom")}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/30 z-20"
          title="Resize end time"
        />
      )}
    </div>
  );
}
