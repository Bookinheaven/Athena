import React from "react";
import { getUserTimezone } from "../utils/dateUtils.js";

/**
 * Minimal page header — title + subtitle only.
 * No back link — History is a primary navigation destination.
 */
export function HistoryHeader() {
  const timezone = getUserTimezone();

  return (
    <div className="flex items-baseline justify-between gap-4 pb-5 border-b border-border">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          History
        </h1>
        <p className="text-sm text-muted-foreground">Your work journal</p>
      </div>
      <span className="text-[11px] font-mono text-muted-foreground/50 shrink-0">
        {timezone}
      </span>
    </div>
  );
}
