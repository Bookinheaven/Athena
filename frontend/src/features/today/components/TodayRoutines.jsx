import { useNavigate } from "react-router-dom";
import { Repeat, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import TodayRoutineItem from "./TodayRoutineItem.jsx";

export default function TodayRoutines({
  occurrences = [],
  isLoading = false,
  isError = false,
  onCompleteStep,
  onSkipOccurrence,
  onUnskipOccurrence,
  onRetry,
}) {
  const navigate = useNavigate();

  // Ensure archived routines are never displayed on Today's dashboard
  const activeOccurrences = occurrences.filter(
    (o) => o.routineStatus !== "archived" && o.status !== "archived"
  );
  const totalCount = activeOccurrences.length;
  const completedCount = activeOccurrences.filter((o) => o.status === "completed").length;

  return (
    <section className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Routines
            </h2>
          </div>
          {!isLoading && totalCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            >
              {completedCount}/{totalCount} completed
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground font-medium rounded-lg px-2.5"
          onClick={() => navigate("/planner?tab=routines")}
        >
          Manage Routines <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Could not load today's routines</span>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 text-xs rounded-lg gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          )}
        </div>
      ) : activeOccurrences.length > 0 ? (
        <div className="space-y-2.5 max-h-[380px] sm:max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
          {activeOccurrences.map((occ) => (
            <TodayRoutineItem
              key={occ.id || occ._id}
              occurrence={occ}
              onCompleteStep={onCompleteStep}
              onSkipOccurrence={onSkipOccurrence}
              onUnskipOccurrence={onUnskipOccurrence}
            />
          ))}
        </div>
      ) : (
        /* Empty state: No routines scheduled today */
        <div className="p-4 rounded-xl border border-dashed border-border/80 bg-card/40 text-center space-y-1.5">
          <p className="text-xs font-medium text-foreground">
            No routines scheduled for today
          </p>
          <p className="text-[11px] text-muted-foreground">
            Create recurring daily or scheduled routines to build lasting daily habits.
          </p>
        </div>
      )}
    </section>
  );
}
