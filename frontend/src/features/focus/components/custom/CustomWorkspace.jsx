import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getUserScopedKey } from "@services/userStateService";
import { WorkspaceToolbar } from "./WorkspaceToolbar.jsx";
import { WorkspaceWidget } from "./WorkspaceWidget.jsx";
import { WIDGET_METADATA } from "./WidgetPalette.jsx";
import {
  SNAP_GRID,
  findNearestFreePosition,
  constrainResize,
} from "./layoutEngine.js";
import { FocusTaskCard } from "../FocusTaskCard.jsx";
import { FocusTimerDisplay } from "../FocusTimerDisplay.jsx";
import { FocusControls } from "../FocusControls.jsx";
import { TodoList } from "@/pages/user/focus/components/TodoList";
import { CurrentProgress } from "@/pages/user/focus/components/CurrentProgress";
import Notes from "@/pages/user/focus/components/Notes";
import { DistractionsWidget } from "./widgets/DistractionsWidget.jsx";
import { SessionStatsWidget } from "./widgets/SessionStatsWidget.jsx";
import { WorkflowDockV2 } from "../WorkflowDockV2.jsx";
import { MotivationalBanner } from "../MotivationalBanner.jsx";
import toast from "react-hot-toast";

export const DEFAULT_CUSTOM_LAYOUT = [
  { id: "task", visible: true, x: 16, y: 16, width: 720, height: 176, zIndex: 1 },
  { id: "stats", visible: false, x: 752, y: 16, width: 432, height: 176, zIndex: 1 },
  { id: "timer", visible: true, x: 16, y: 208, width: 352, height: 416, zIndex: 2 },
  { id: "controls", visible: true, x: 384, y: 208, width: 352, height: 192, zIndex: 2 },
  { id: "checklist", visible: true, x: 384, y: 416, width: 352, height: 384, zIndex: 2 },
  { id: "notes", visible: true, x: 752, y: 208, width: 432, height: 416, zIndex: 2 },
  { id: "progress", visible: false, x: 16, y: 640, width: 352, height: 256, zIndex: 1 },
  { id: "distractions", visible: false, x: 752, y: 640, width: 432, height: 256, zIndex: 1 },
  { id: "workflow", visible: true, x: 16, y: 816, width: 1168, height: 128, zIndex: 1 },
  { id: "motivation", visible: false, x: 16, y: 960, width: 1168, height: 96, zIndex: 1 },
];

function sanitizeLayout(rawLayout) {
  if (!Array.isArray(rawLayout) || rawLayout.length === 0) return DEFAULT_CUSTOM_LAYOUT;
  return DEFAULT_CUSTOM_LAYOUT.map((defaultWidget) => {
    const existing = rawLayout.find((w) => w.id === defaultWidget.id);
    if (!existing) return defaultWidget;
    return {
      ...defaultWidget,
      ...existing,
      x: typeof existing.x === "number" ? existing.x : defaultWidget.x,
      y: typeof existing.y === "number" ? existing.y : defaultWidget.y,
      width: typeof existing.width === "number" ? existing.width : defaultWidget.width,
      height: typeof existing.height === "number" ? existing.height : defaultWidget.height,
      visible: typeof existing.visible === "boolean" ? existing.visible : defaultWidget.visible,
      zIndex: typeof existing.zIndex === "number" ? existing.zIndex : defaultWidget.zIndex,
    };
  });
}

export const CustomWorkspace = ({
  userId,
  runtime,
  timerData,
  settings,
  notesProps,
  todos,
  newTodo,
  setNewTodo,
  onAddTodo,
  onUpdateTodoStatus,
  onDeleteTodo,
  sessionReview,
  onDistractionToggle,
  navContext,
  handleStart,
  handleStop,
  handleReset,
  selectedDuration,
  setSelectedDuration,
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState(null);

  // Dragging state and collision-free drop preview
  const [draggedWidgetId, setDraggedWidgetId] = useState(null);
  const [dropPreview, setDropPreview] = useState(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // User-scoped layout persistence key
  const storageKey = useMemo(
    () => getUserScopedKey("focus_custom_layout_v3", userId),
    [userId]
  );

  // Initial load
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeLayout(parsed);
      }
    } catch {}
    return DEFAULT_CUSTOM_LAYOUT;
  });

  // Re-read if user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLayout(sanitizeLayout(parsed));
        return;
      }
    } catch {}
    setLayout(DEFAULT_CUSTOM_LAYOUT);
  }, [storageKey]);

  // Persist layout to storage
  const saveLayoutToStorage = useCallback(
    (newLayout) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newLayout));
      } catch (err) {
        console.error("Failed to save custom layout:", err);
      }
    },
    [storageKey]
  );

  // Bring selected widget to front
  const bringToFront = useCallback(
    (widgetId) => {
      setLayout((prev) => {
        const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex || 1), 1);
        const updated = prev.map((w) =>
          w.id === widgetId ? { ...w, zIndex: maxZ + 1 } : w
        );
        saveLayoutToStorage(updated);
        return updated;
      });
    },
    [saveLayoutToStorage]
  );

  // Toggle widget visibility with automatic collision-free placement
  const handleToggleWidget = useCallback(
    (widgetId) => {
      setLayout((prev) => {
        const target = prev.find((w) => w.id === widgetId);
        if (!target) return prev;

        const willBeVisible = !target.visible;
        let nextPos = { x: target.x, y: target.y };

        if (willBeVisible) {
          // Find nearest available free position
          const otherVisible = prev.filter((w) => w.visible && w.id !== widgetId);
          nextPos = findNearestFreePosition({
            targetX: target.x || SNAP_GRID,
            targetY: target.y || SNAP_GRID,
            width: target.width,
            height: target.height,
            otherWidgets: otherVisible,
            containerWidth,
          });
        }

        const updated = prev.map((w) =>
          w.id === widgetId
            ? { ...w, visible: willBeVisible, x: nextPos.x, y: nextPos.y }
            : w
        );
        saveLayoutToStorage(updated);
        return updated;
      });
    },
    [saveLayoutToStorage, containerWidth]
  );

  // Reset to default layout
  const handleResetLayout = useCallback(() => {
    if (window.confirm("Reset custom workspace back to default layout?")) {
      setLayout(DEFAULT_CUSTOM_LAYOUT);
      saveLayoutToStorage(DEFAULT_CUSTOM_LAYOUT);
      toast.success("Workspace reset to default layout");
    }
  }, [saveLayoutToStorage]);

  // Drag and drop with collision detection
  const handleDragStart = (widgetId, e) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedWidgetId(widgetId);
    setDraggedWidgetId(widgetId);
    bringToFront(widgetId);

    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const targetWidget = layout.find((w) => w.id === widgetId);
    if (!targetWidget) return;

    const initialX = targetWidget.x;
    const initialY = targetWidget.y;
    const otherVisible = layout.filter((w) => w.visible && w.id !== widgetId);

    // Initial preview at current spot
    setDropPreview({
      x: initialX,
      y: initialY,
      width: targetWidget.width,
      height: targetWidget.height,
    });

    let currentBestFreePos = { x: initialX, y: initialY };

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startPointerX;
      const dy = moveEvent.clientY - startPointerY;

      const rawX = initialX + dx;
      const rawY = initialY + dy;

      // Keep dragged visual directly tracking cursor
      const boundedVisualX = Math.max(
        SNAP_GRID,
        Math.min(containerWidth - targetWidget.width - SNAP_GRID, rawX)
      );
      const boundedVisualY = Math.max(SNAP_GRID, rawY);

      // Dynamically calculate nearest valid free drop position
      const freePos = findNearestFreePosition({
        targetX: boundedVisualX,
        targetY: boundedVisualY,
        width: targetWidget.width,
        height: targetWidget.height,
        otherWidgets: otherVisible,
        containerWidth,
      });

      currentBestFreePos = freePos;

      // Update drop preview box
      setDropPreview({
        x: freePos.x,
        y: freePos.y,
        width: targetWidget.width,
        height: targetWidget.height,
      });

      // Update dragged item visual position during drag
      setLayout((prev) =>
        prev.map((w) =>
          w.id === widgetId
            ? { ...w, x: boundedVisualX, y: boundedVisualY }
            : w
        )
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      setDraggedWidgetId(null);
      setDropPreview(null);

      // Snap to the verified non-overlapping free position
      setLayout((prev) => {
        const updated = prev.map((w) =>
          w.id === widgetId
            ? {
                ...w,
                x: currentBestFreePos.x,
                y: currentBestFreePos.y,
              }
            : w
        );
        saveLayoutToStorage(updated);
        return updated;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Resize with collision constraints
  const handleResizeStart = (widgetId, e) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedWidgetId(widgetId);
    bringToFront(widgetId);

    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const targetWidget = layout.find((w) => w.id === widgetId);
    if (!targetWidget) return;

    const initialW = targetWidget.width;
    const initialH = targetWidget.height;
    const meta = WIDGET_METADATA[widgetId] || {};
    const minW = meta.minWidth || 280;
    const minH = meta.minHeight || 120;
    const otherVisible = layout.filter((w) => w.visible && w.id !== widgetId);

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startPointerX;
      const dy = moveEvent.clientY - startPointerY;

      const rawW = initialW + dx;
      const rawH = initialH + dy;

      // Constrain resize so it never collides with neighboring widgets
      const constrained = constrainResize({
        targetWidget,
        intendedWidth: rawW,
        intendedHeight: rawH,
        otherWidgets: otherVisible,
        containerWidth,
        minWidth: minW,
        minHeight: minH,
      });

      setLayout((prev) =>
        prev.map((w) =>
          w.id === widgetId
            ? { ...w, width: constrained.width, height: constrained.height }
            : w
        )
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      setLayout((latest) => {
        saveLayoutToStorage(latest);
        return latest;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Dynamic canvas height to ensure all widgets have full breathing room
  const canvasHeight = useMemo(() => {
    const visibleWidgets = layout.filter((w) => w.visible);
    if (visibleWidgets.length === 0) return 600;
    const maxY = Math.max(
      ...visibleWidgets.map((w) => (w.y || 0) + (w.height || 200))
    );
    return Math.max(880, maxY + 80);
  }, [layout]);

  const {
    phase,
    sessionTitle,
    currentSegment,
    segmentIndex,
    segments,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    isCompleting,
    commands,
    state,
  } = runtime;

  const { timeLeft, elapsed } = timerData;

  const totalFocusSegments = segments.filter((s) => s.type === "focus").length || 1;
  const completedFocusSegments = segments.filter((s) => s.type === "focus" && s.completedAt).length;
  const totalBreakSegments = segments.filter((s) => s.type === "break").length || 0;
  const completedBreakSegments = segments.filter((s) => s.type === "break" && s.completedAt).length;

  const activeTaskTitle = useMemo(() => {
    if (state.taskIds?.length > 0) {
      const task = todos.find((t) => String(t.id) === String(state.taskIds[0]));
      return task?.title ?? navContext?.title ?? sessionTitle;
    }
    return sessionTitle;
  }, [state.taskIds, todos, navContext?.title, sessionTitle]);

  // Render individual widget contents directly as clean content surfaces
  const renderWidgetContent = (widgetId) => {
    switch (widgetId) {
      case "task":
        return (
          <div className="p-3 sm:p-5 h-full flex flex-col justify-center">
            <FocusTaskCard
              taskTitle={activeTaskTitle}
              setTaskTitle={(t) => commands.setTitle(t)}
              onTitleSet={() => {}}
              navContext={navContext}
              isScheduled={state.isScheduled}
              scheduleBlock={state.scheduleBlockId}
              currentSegment={currentSegment}
              segmentIndex={segmentIndex}
              totalSegments={segments.length}
              totalFocusSegments={totalFocusSegments}
              totalBreakSegments={totalBreakSegments}
              plannedDuration={state.plannedDuration}
              todos={todos}
            />
          </div>
        );

      case "timer":
        return (
          <div className="p-3 sm:p-4 flex items-center justify-center h-full">
            <FocusTimerDisplay
              timeLeft={isIdle && elapsed === 0 ? selectedDuration : timeLeft}
              elapsed={elapsed}
              currentSegment={currentSegment}
              isIdle={isIdle}
              isRunning={isRunning}
              plannedDuration={selectedDuration}
              onSelectDuration={(d) => setSelectedDuration(d)}
              totalFocusSegments={totalFocusSegments}
              completedFocusSegments={completedFocusSegments}
              totalBreakSegments={totalBreakSegments}
              completedBreakSegments={completedBreakSegments}
            />
          </div>
        );

      case "controls":
        return (
          <div className="p-3 sm:p-4 flex items-center justify-center h-full">
            <FocusControls
              phase={phase}
              isRunning={isRunning}
              isPaused={isPaused}
              isCompleting={isCompleting}
              isCompleted={isCompleted}
              currentSegment={currentSegment}
              onStart={handleStart}
              onPause={() => commands.pause()}
              onResume={() => commands.resume()}
              onStop={handleStop}
              onReset={handleReset}
              onSkipBreak={() => commands.skipBreak()}
              onReview={() => {}}
              onSelectPauseReason={(reason) => onDistractionToggle(reason)}
            />
          </div>
        );

      case "checklist":
        return (
          <div className="p-3 sm:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/40 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Task Checklist
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-foreground">
                {todos.filter((t) => t.status === "Completed").length} / {todos.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <TodoList
                todos={todos}
                newTodo={newTodo}
                setNewTodo={setNewTodo}
                onAddTodo={onAddTodo}
                onUpdateStatus={onUpdateTodoStatus}
                onDeleteTodo={onDeleteTodo}
                show={true}
                onClose={() => {}}
              />
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="p-3 sm:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/40 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Focus Scratchpad
              </span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              {notesProps && (
                <Notes
                  notes={notesProps.notes}
                  todos={todos}
                  createNote={notesProps.createNote}
                  updateNote={notesProps.updateNote}
                  deleteNote={notesProps.deleteNote}
                  show={true}
                  onClose={() => {}}
                />
              )}
            </div>
          </div>
        );

      case "progress":
        return (
          <div className="p-3 sm:p-4 flex flex-col h-full">
            <CurrentProgress todos={todos} show={true} onClose={() => {}} />
          </div>
        );

      case "distractions":
        return (
          <div className="p-2 sm:p-3 h-full">
            <DistractionsWidget
              sessionReview={sessionReview}
              onDistractionToggle={onDistractionToggle}
            />
          </div>
        );

      case "workflow":
        return (
          <div className="p-2 sm:p-3 h-full flex items-center justify-center">
            <WorkflowDockV2 show={true} onClose={() => {}} />
          </div>
        );

      case "motivation":
        return (
          <div className="p-2 sm:p-3 h-full flex items-center justify-center">
            <MotivationalBanner show={true} onClose={() => {}} />
          </div>
        );

      case "stats":
        return (
          <div className="p-2 sm:p-3 h-full">
            <SessionStatsWidget
              runtime={runtime}
              timerData={timerData}
              totalFocusSegments={totalFocusSegments}
              completedFocusSegments={completedFocusSegments}
              totalBreakSegments={totalBreakSegments}
              completedBreakSegments={completedBreakSegments}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const visibleWidgets = layout.filter((w) => w.visible);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 flex flex-col animate-in fade-in duration-300">
      {/* Workspace Toolbar */}
      <WorkspaceToolbar
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        layout={layout}
        onToggleWidget={handleToggleWidget}
        onResetLayout={handleResetLayout}
        onSaveLayout={() => saveLayoutToStorage(layout)}
      />

      {/* Mobile stacked layout */}
      {isMobile ? (
        <div className="flex flex-col gap-3 w-full">
          {visibleWidgets.map((widget) => (
            <WorkspaceWidget
              key={widget.id}
              widget={widget}
              isEditMode={false}
              isSelected={false}
              isDragging={false}
              isMobile={true}
              onSelect={() => {}}
              onDragStart={() => {}}
              onResizeStart={() => {}}
              onHide={() => handleToggleWidget(widget.id)}
            >
              {renderWidgetContent(widget.id)}
            </WorkspaceWidget>
          ))}
        </div>
      ) : (
        /* Desktop freeform canvas */
        <div
          ref={containerRef}
          onClick={() => {
            if (isEditMode) setSelectedWidgetId(null);
          }}
          className={`relative w-full rounded-3xl transition-colors duration-200 select-none ${
            isEditMode
              ? "bg-secondary/20 border-2 border-dashed border-primary/25"
              : "bg-transparent border border-transparent"
          }`}
          style={{ minHeight: `${canvasHeight}px` }}
        >
          {/* Subtle Grid Dots Guide (Edit Layout Mode Only) */}
          {isEditMode && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20 rounded-3xl"
              style={{
                backgroundImage:
                  "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: `${SNAP_GRID * 2}px ${SNAP_GRID * 2}px`,
              }}
            />
          )}

          {/* Real-time Collision-Free Drop Preview Ghost Box */}
          {draggedWidgetId && dropPreview && (
            <div
              style={{
                position: "absolute",
                left: `${dropPreview.x}px`,
                top: `${dropPreview.y}px`,
                width: `${dropPreview.width}px`,
                height: `${dropPreview.height}px`,
                zIndex: 4,
              }}
              className="rounded-3xl border-2 border-dashed border-primary/70 bg-primary/10 shadow-inner pointer-events-none transition-all duration-75 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-background/90 shadow-2xs border border-primary/30">
                Placement Area
              </span>
            </div>
          )}

          {/* Render Active Widgets */}
          {visibleWidgets.map((widget) => (
            <WorkspaceWidget
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              isSelected={selectedWidgetId === widget.id}
              isDragging={draggedWidgetId === widget.id}
              isMobile={false}
              onSelect={() => {
                setSelectedWidgetId(widget.id);
                bringToFront(widget.id);
              }}
              onDragStart={(e) => handleDragStart(widget.id, e)}
              onResizeStart={(e) => handleResizeStart(widget.id, e)}
              onHide={() => handleToggleWidget(widget.id)}
            >
              {renderWidgetContent(widget.id)}
            </WorkspaceWidget>
          ))}
        </div>
      )}
    </div>
  );
};
