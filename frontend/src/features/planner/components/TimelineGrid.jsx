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
  const [dragPreview, setDragPreview] = useState(null);
  const [nowMinute, setNowMinute] = useState(null);

  // Check if viewing today to render current time line
  const isToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return selectedDate === today;
  }, [selectedDate]);

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

  // Compute column layout for overlapping blocks
  const positionedBlocks = useMemo(() => {
    if (!blocks.length) return [];

    // Sort blocks by start time
    const sorted = [...blocks].sort((a, b) => {
      const aStart = new Date(a.startTime).getTime();
      const bStart = new Date(b.startTime).getTime();
      return aStart - bStart;
    });

    // Group into overlap clusters
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -Infinity;

    for (const block of sorted) {
      const start = new Date(block.startTime).getTime();
      const end = new Date(block.endTime).getTime();

      if (start < clusterEnd) {
        currentCluster.push(block);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        if (currentCluster.length) {
          clusters.push(currentCluster);
        }
        currentCluster = [block];
        clusterEnd = end;
      }
    }
    if (currentCluster.length) {
      clusters.push(currentCluster);
    }

    // Assign column index within each cluster
    const result = [];
    for (const cluster of clusters) {
      const columns = []; // array of end times for each column

      for (const block of cluster) {
        const start = new Date(block.startTime).getTime();
        const end = new Date(block.endTime).getTime();

        let assignedCol = -1;
        for (let i = 0; i < columns.length; i++) {
          if (columns[i] <= start) {
            assignedCol = i;
            columns[i] = end;
            break;
          }
        }

        if (assignedCol === -1) {
          assignedCol = columns.length;
          columns.push(end);
        }

        result.push({
          block,
          column: assignedCol,
          totalColumns: cluster.length > 1 ? Math.max(columns.length, 2) : 1,
        });
      }

      // Normalize totalColumns for all blocks in cluster
      const maxCols = columns.length;
      for (const item of result) {
        if (cluster.some((b) => b._id === item.block._id)) {
          item.totalColumns = maxCols;
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
    <div className="flex flex-col flex-1 bg-card/60 border border-border/60 rounded-2xl p-4 overflow-hidden backdrop-blur-xs min-h-[700px]">
      <div className="flex flex-1 relative overflow-y-auto">
        {/* Left Column: Hour labels */}
        <div className="w-14 shrink-0 flex flex-col justify-between py-2 text-right pr-3 select-none">
          {HOURS.map((hour) => (
            <div key={hour} className="h-14 -mt-2 text-xs font-mono font-medium text-muted-foreground">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Right Column: Interactive Grid Container */}
        <div
          ref={gridRef}
          onClick={handleGridClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="timeline-grid-container flex-1 relative border-l border-border/60 min-h-[900px] cursor-pointer"
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
                <div className="w-full border-t border-border/15 border-dashed mt-7 pointer-events-none" />
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
  );
}
