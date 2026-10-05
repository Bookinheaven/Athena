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
      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground font-medium">Outcome:</span>
      <select
        value={completionType}
        onChange={(e) => onCompletionTypeChange?.(e.target.value)}
        className="text-xs bg-background border border-border/60 rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="all">All Outcomes</option>
        <option value="completed">Completed</option>
        <option value="partial">Partial</option>
        <option value="abandoned">Abandoned</option>
      </select>
    </div>
  );
}
