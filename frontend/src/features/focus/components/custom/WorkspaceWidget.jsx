import React, { useState } from "react";
import { GripVertical, X } from "lucide-react";

export const WorkspaceWidget = ({
  widget,
  isEditMode,
  isSelected,
  isDragging,
  isMobile,
  onSelect,
  onDragStart,
  onResizeStart,
  onHide,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mobile presentation: clean stacked cards
  if (isMobile) {
    return (
      <div className="w-full rounded-3xl bg-card/85 border border-border/60 shadow-sm overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-1">
          {children}
        </div>
      </div>
    );
  }

  // Desktop / Tablet presentation: clean freeform surface
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={() => {
        if (isEditMode) onSelect();
      }}
      style={{
        position: "absolute",
        left: `${widget.x}px`,
        top: `${widget.y}px`,
        width: `${widget.width}px`,
        height: `${widget.height}px`,
        zIndex: isDragging ? 50 : isSelected ? 30 : widget.zIndex || 1,
        opacity: isDragging ? 0.65 : 1,
      }}
      className={`group rounded-3xl bg-card/85 border backdrop-blur-md overflow-hidden flex flex-col transition-all duration-150 select-none ${
        isDragging ? "shadow-2xl scale-[1.01] pointer-events-none" : ""
      } ${
        isEditMode
          ? isSelected
            ? "border-primary ring-2 ring-primary/40 shadow-xl"
            : "border-border/70 hover:border-primary/40 shadow-sm"
          : "border-border/60 shadow-xs hover:border-border/80"
      }`}
    >
      {/* Floating controls in edit mode */}
      {isEditMode && (
        <div
          className={`absolute top-2.5 right-2.5 z-40 flex items-center gap-1 px-1.5 py-1 rounded-xl bg-background/95 backdrop-blur-md border border-border/80 shadow-lg transition-opacity duration-150 ${
            isSelected || isHovered
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            onPointerDown={onDragStart}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-primary hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reposition widget"
          >
            <GripVertical size={13} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider select-none">
              Drag
            </span>
          </div>

          <div className="w-px h-3 bg-border/50 mx-0.5" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Hide widget from canvas"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Widget content surface */}
      <div
        className="flex-1 overflow-y-auto min-h-0 custom-scrollbar select-text flex flex-col"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (isEditMode) onSelect();
        }}
      >
        {children}
      </div>

      {/* Resize corner in edit mode */}
      {isEditMode && (isSelected || isHovered) && (
        <div
          onPointerDown={onResizeStart}
          className="absolute bottom-1.5 right-1.5 w-5 h-5 cursor-se-resize flex items-center justify-center text-primary/70 hover:text-primary z-40 select-none p-1 transition-transform hover:scale-110"
          title="Drag to resize widget"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="4" cy="8" r="1.2" />
            <circle cx="8" cy="4" r="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
};
