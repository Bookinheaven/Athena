import { useState, useRef, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import ScheduleBlockItem from "./ScheduleBlockItem.jsx";
import { START_HOUR, END_HOUR, TOTAL_MINUTES } from "../hooks/useTimelineData.js";

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function TimelineGrid({
  blocks = [],
  selectedDate,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onStartFocus,
  onEmptySlotClick,
}) {
  const gridRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [nowMinute, setNowMinute] = useState(null);

  // Check if viewing today to render current time line
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate === today;
  }, [selectedDate]);

  // Initial scroll to current time or morning on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      // Scroll to 1 hour before current time, or default 8 AM if earlier
      const targetHour = Math.max(START_HOUR, Math.min(END_HOUR - 4, (now.getHours() - 1) || 8));
      const targetScroll = ((targetHour - START_HOUR) / (END_HOUR - START_HOUR)) * scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = targetScroll;
    }
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
      setNowMinute(mins >= 0 && mins <= TOTAL_MINUTES ? mins : null);
    };
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute column layout for overlapping blocks using visual minutes on the day grid
  const positionedBlocks = useMemo(() => {
    if (!blocks.length) return [];

    // Parse each block's visual start and end minutes within the daily grid
    const parsedBlocks = blocks.map((block) => {
      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      const startMins = start.getHours() * 60 + start.getMinutes();
      const dur = block.durationMinutes || Math.max(15, Math.round((end - start) / (1000 * 60)));
      const endMins = startMins + dur;
      return {
        block,
        startMins,
        endMins,
      };
    });

    // Sort blocks by visual start minutes
    const sorted = [...parsedBlocks].sort((a, b) => a.startMins - b.startMins);

    // Group into overlap clusters based on visual minute intervals
    const clusters = [];
    let currentCluster = [];
    let clusterEndMins = -Infinity;

    for (const item of sorted) {
      if (item.startMins < clusterEndMins) {
        currentCluster.push(item);
        clusterEndMins = Math.max(clusterEndMins, item.endMins);
      } else {
        if (currentCluster.length) {
          clusters.push(currentCluster);
        }
        currentCluster = [item];
        clusterEndMins = item.endMins;
      }
    }
    if (currentCluster.length) {
      clusters.push(currentCluster);
    }

    // Assign column index within each cluster
    const result = [];
    for (const cluster of clusters) {
      const columns = []; // array of end times for each column

      for (const item of cluster) {
        let assignedCol = -1;
        for (let i = 0; i < columns.length; i++) {
          if (columns[i] <= item.startMins) {
            assignedCol = i;
            columns[i] = item.endMins;
            break;
          }
        }

        if (assignedCol === -1) {
          assignedCol = columns.length;
          columns.push(item.endMins);
        }

        result.push({
          block: item.block,
          column: assignedCol,
          totalColumns: columns.length,
        });
      }

      // Normalize totalColumns for all blocks in cluster
      const maxCols = columns.length;
      for (const resItem of result) {
        const resId = resItem.block._id || resItem.block.id;
        if (cluster.some((c) => (c.block._id || c.block.id) === resId)) {
          resItem.totalColumns = maxCols;
        }
      }
    }

    return result;
  }, [blocks]);

  // Drag over grid calculation
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, offsetY / rect.height));

    const rawMinutes = Math.round(ratio * TOTAL_MINUTES) + START_HOUR * 60;
    const snappedMinutes = Math.floor(rawMinutes / 15) * 15; // snap to 15 min

    const startMinutesInGrid = snappedMinutes - START_HOUR * 60;
    const topPercent = (startMinutesInGrid / TOTAL_MINUTES) * 100;
    const durationMinutes = 60; // default 60 min preview
    const heightPercent = (durationMinutes / TOTAL_MINUTES) * 100;

    const hours = Math.floor(snappedMinutes / 60);
    const mins = snappedMinutes % 60;
    const timeLabel = `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;

    setDragPreview({
      topPercent,
      heightPercent,
      timeLabel,
      snappedMinutes,
    });
  };

  const handleDragLeave = (e) => {
    if (gridRef.current && !gridRef.current.contains(e.relatedTarget)) {
      setDragPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragPreview(null);
    if (!gridRef.current) return;

    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      const rect = gridRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const ratio = Math.max(0, Math.min(1, offsetY / rect.height));

      const rawMinutes = Math.round(ratio * TOTAL_MINUTES) + START_HOUR * 60;
      const snappedMinutes = Math.floor(rawMinutes / 15) * 15;

      const durationMinutes = data.durationMinutes || 60;

      // Construct start and end Date on selectedDate
      const [year, month, day] = selectedDate.split("-").map(Number);
      const startHour = Math.floor(snappedMinutes / 60);
      const startMin = snappedMinutes % 60;

      const startTime = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      if (data.type === "new_task") {
        onCreateBlock({
          taskId: data.taskId,
          startTime,
          endTime,
          date: selectedDate,
        });
      } else if (data.type === "new_routine") {
        onCreateBlock({
          routineOccurrenceId: data.routineOccurrenceId,
          startTime,
          endTime,
          date: selectedDate,
        });
      } else if (data.type === "move_block") {
        onUpdateBlock(data.blockId, {
          startTime,
          endTime,
          date: selectedDate,
        });
      }
    } catch (err) {
      console.error("Drop parsing error:", err);
    }
  };

  const handleGridClick = (e) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, offsetY / rect.height));
    const rawMinutes = Math.round(ratio * TOTAL_MINUTES) + START_HOUR * 60;
    const snappedMinutes = Math.floor(rawMinutes / 15) * 15;

    if (onEmptySlotClick) {
      onEmptySlotClick(snappedMinutes);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-card/60 border border-border/60 rounded-2xl p-4 overflow-hidden backdrop-blur-xs h-[560px] sm:h-[600px] shadow-xs">
      <div ref={scrollContainerRef} className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth focus:outline-none">
        {/* Exact-height content canvas to prevent any empty space during scrolling */}
        <div className="flex relative w-full" style={{ height: `${(END_HOUR - START_HOUR) * 48}px` }}>
          {/* Left Column: Hour labels */}
          <div className="w-16 shrink-0 relative select-none">
            {HOURS.map((hour, idx) => {
              const formattedHour =
                hour === 0 || hour === 24
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`;

              const translateClass =
                idx === 0
                  ? "translate-y-0"
                  : idx === HOURS.length - 1
                  ? "-translate-y-full"
                  : "-translate-y-1/2";

              return (
                <div
                  key={hour}
                  style={{ top: `${(idx / (HOURS.length - 1)) * 100}%` }}
                  className={`absolute right-3 ${translateClass} text-[11px] font-mono font-medium text-muted-foreground whitespace-nowrap`}
                >
                  {formattedHour}
                </div>
              );
            })}
          </div>

          {/* Right Column: Interactive Grid Container */}
          <div
            ref={gridRef}
            onClick={handleGridClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="timeline-grid-container flex-1 relative border-l border-border/60 h-full cursor-pointer select-none"
          >
          {/* Hour grid lines */}
          {HOURS.map((hour, idx) => (
            <div
              key={hour}
              style={{ top: `${(idx / (HOURS.length - 1)) * 100}%` }}
              className="absolute left-0 right-0 border-t border-border/30 pointer-events-none"
            >
              {/* Subtle 30-minute divider */}
              {idx < HOURS.length - 1 && (
                <div className="w-full border-t border-border/15 border-dashed mt-6 pointer-events-none" />
              )}
            </div>
          ))}

          {/* Current time indicator line */}
          {isToday && nowMinute !== null && (
            <div
              style={{ top: `${(nowMinute / TOTAL_MINUTES) * 100}%` }}
              className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1.25 shadow-xs animate-pulse" />
              <div className="flex-1 border-t-2 border-primary shadow-xs" />
            </div>
          )}

          {/* Drag & Drop Hover Preview */}
          {dragPreview && (
            <div
              style={{
                top: `${dragPreview.topPercent}%`,
                height: `${dragPreview.heightPercent}%`,
              }}
              className="absolute left-2 right-2 z-20 rounded-xl border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center pointer-events-none animate-in fade-in duration-100"
            >
              <span className="text-xs font-semibold text-primary font-mono bg-background/90 px-2 py-0.5 rounded-md shadow-xs">
                {dragPreview.timeLabel} (Drop to schedule)
              </span>
            </div>
          )}

          {/* Schedule Blocks */}
          {positionedBlocks.map(({ block, column, totalColumns }) => (
            <ScheduleBlockItem
              key={block._id}
              block={block}
              column={column}
              totalColumns={totalColumns}
              onStartFocus={onStartFocus}
              onUpdateBlock={onUpdateBlock}
              onDeleteBlock={onDeleteBlock}
            />
          ))}

          {/* Empty State Callout when no blocks scheduled */}
          {blocks.length === 0 && !dragPreview && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
              <div className="max-w-xs space-y-1.5 p-4 rounded-2xl bg-secondary/30 border border-border/40 backdrop-blur-xs">
                <p className="text-xs font-semibold text-foreground">
                  Nothing scheduled yet
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Drag tasks from the queue on the right or click anywhere on the timeline to schedule work.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
