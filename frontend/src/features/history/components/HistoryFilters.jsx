import React from "react";
import { Filter } from "lucide-react";

/**
 * Filter controls for Focus Sessions list.
 * Only uses filters strictly supported by the backend:
 * - completionType ('all' | 'completed' | 'partial' | 'abandoned')
 */
export function HistoryFilters({
  completionType = "all",
  onCompletionTypeChange,
}) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
      <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Outcome:</span>
      <select
        value={completionType}
        onChange={(e) => onCompletionTypeChange?.(e.target.value)}
        className="text-xs bg-muted/30 border border-border/70 rounded-lg px-2.5 py-1 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <option value="all">All Outcomes</option>
        <option value="completed">Completed</option>
        <option value="partial">Partial</option>
        <option value="abandoned">Abandoned</option>
      </select>
    </div>
  );
}
