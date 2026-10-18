import { getUserTimezone } from "../utils/dateUtils.js";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Page header — title, subtitle, refresh action, and timezone badge.
 */
export function HistoryHeader({ onRefresh, isRefreshing = false }) {
  const timezone = getUserTimezone();

  return (
    <div className="flex items-center justify-between gap-4 pb-5 border-b border-border/60">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          History
        </h1>
        <p className="text-sm text-muted-foreground">Your work journal & daily focus review</p>
      </div>
      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
        <Badge variant="outline" className="font-mono text-[11px] font-normal text-muted-foreground/80 py-0.5 px-2">
          {timezone}
        </Badge>
      </div>
    </div>
  );
}
