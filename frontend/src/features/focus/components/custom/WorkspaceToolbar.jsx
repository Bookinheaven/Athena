import React, { useState } from "react";
import {
  SlidersHorizontal,
  Unlock,
  Plus,
  RotateCcw,
  Check,
} from "lucide-react";
import { WidgetPalette } from "./WidgetPalette.jsx";

export const WorkspaceToolbar = ({
  isEditMode,
  setIsEditMode,
  layout,
  onToggleWidget,
  onResetLayout,
  onSaveLayout,
}) => {
  const [showPalette, setShowPalette] = useState(false);

  return (
    <div className="w-full flex items-center justify-between mb-4 px-2 select-none">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <SlidersHorizontal size={13} className="text-primary" />
          <span>Custom Workspace</span>
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border transition-colors ${
            isEditMode
              ? "bg-primary/10 border-primary/30 text-primary animate-pulse"
              : "bg-secondary/60 border-border/40 text-muted-foreground"
          }`}
        >
          {isEditMode ? "Editing Mode" : "Locked"}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowPalette((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/60 text-xs font-bold text-foreground transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Plus size={13} />
          <span>Add Widget</span>
        </button>

        {showPalette && (
          <div className="absolute right-0 top-10 z-50">
            <WidgetPalette
              layout={layout}
              onToggleWidget={onToggleWidget}
              onClose={() => setShowPalette(false)}
            />
          </div>
        )}

        {isEditMode ? (
          <>
            <button
              onClick={onResetLayout}
              className="p-1.5 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all border border-border/40 cursor-pointer"
              title="Reset to Default Layout"
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={() => {
                setShowPalette(false);
                setIsEditMode(false);
                if (onSaveLayout) onSaveLayout();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all active:scale-95 cursor-pointer"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Lock Layout</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Unlock size={12} />
            <span>Edit Layout</span>
          </button>
        )}
      </div>
    </div>
  );
};
