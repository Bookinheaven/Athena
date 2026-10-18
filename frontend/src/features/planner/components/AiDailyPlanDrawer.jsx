import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Bot,
  Cpu,
  Clock,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Repeat,
  CheckSquare,
  X,
  RotateCw,
  Info,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import scheduleService from "../../../../services/scheduleService.js";
import { formatPlannerDateHeader, getUserTimezone } from "@/utils/dateUtils.js";

function CapacityBar({ percent = 0, isOverloaded = false }) {
  const capped = Math.min(percent, 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-border/30 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${isOverloaded
            ? "bg-amber-500"
            : "bg-emerald-500"
          }`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
}

function DrawerLoadingSkeleton() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5"
      data-testid="ai-plan-loading-state"
    >
      <div className="relative flex items-center justify-center w-12 h-12">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/15">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <RotateCw className="w-8 h-8 text-primary/20 animate-spin absolute" />
        </div>
      </div>
      <div className="space-y-1.5 max-w-[260px]">
        <h3 className="text-sm font-semibold text-foreground">
          Analyzing commitments...
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Evaluating routine habits, task priorities, and sustainable capacity to
          build an optimized draft.
        </p>
      </div>
      {/* Shimmer bars */}
      <div className="w-full max-w-xs space-y-2.5 pt-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-muted/40 animate-pulse"
            style={{ width: `${85 - i * 12}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProposedBlockCard({ block }) {
  const accentColor =
    block.targetType === "routine_occurrence"
      ? "border-l-violet-500/70"
      : block.priority === "high"
        ? "border-l-rose-500/70"
        : block.priority === "medium"
          ? "border-l-amber-500/70"
          : "border-l-sky-500/70";

  const typeLabel = block.targetType === "routine_occurrence" ? "Routine" : "Task";
  const TypeIcon = block.targetType === "routine_occurrence" ? Repeat : CheckSquare;

  return (
    <div
      data-testid="proposed-block-item"
      className={`group p-4 rounded-xl bg-card/80 border border-border/50 hover:border-border/80 transition-all duration-150 border-l-[3px] ${accentColor}`}
    >
      {/* Top row: Title + Time */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-foreground leading-snug mb-1.5">
            {block.title}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <TypeIcon className="w-2.5 h-2.5" />
              {typeLabel}
            </span>
            {block.priority && (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${block.priority === "high"
                    ? "text-rose-500/80"
                    : block.priority === "medium"
                      ? "text-amber-500/80"
                      : "text-muted-foreground"
                  }`}
                data-testid={block.targetType === "routine_occurrence" ? "block-type-routine" : "block-type-task"}
              >
                {block.priority}
              </span>
            )}
            {block.isDurationAssumed && (
              <span
                className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80"
                data-testid="assumed-duration-badge"
                title="Default duration was applied because no estimate was set."
              >
                Assumed {block.durationMinutes}m
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs font-semibold text-foreground tabular-nums">
            {block.formattedTimeRange}
          </p>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {block.durationMinutes}m
          </p>
        </div>
      </div>

      {/* Rationale */}
      {block.rationale && (
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-2.5 pt-2.5 border-t border-border/30">
          {block.rationale}
        </p>
      )}
    </div>
  );
}

export function AiDailyPlanReviewContent({
  selectedDate,
  draft,
  isLoading,
  error,
  onRegenerate,
  onClose,
}) {
  const headerInfo = useMemo(() => {
    return formatPlannerDateHeader(selectedDate);
  }, [selectedDate]);

  const timezone = draft?.timezone || getUserTimezone();

  const proposedBlocks = draft?.proposedBlocks || [];
  const unplacedItems = draft?.unplacedItems || [];
  const existingBlocks = draft?.existingBlocks || [];
  const summary = draft?.summary || {};
  const capacity = draft?.capacity || {};
  const ai = draft?.ai || {};
  const warnings = draft?.warnings || [];

  const isAssumedDurationPresent =
    summary.hasAssumedDurations || proposedBlocks.some((b) => b.isDurationAssumed);

  const isFallback =
    ai.provider === "deterministic-fallback" || ai.aiAssistanceAvailable === false;

  const capacityPercent = useMemo(() => {
    if (!capacity.overloadRatio && !summary.totalPlannedMinutes) return 0;
    if (capacity.overloadRatio) return Math.round(capacity.overloadRatio * 100);
    return 50;
  }, [capacity, summary]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground" data-testid="ai-daily-plan-drawer">
      <div className="shrink-0 border-b border-border/50">
        <div className="px-6 pt-5 pb-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-foreground" data-testid="ai-plan-title">
                  AI Daily Plan Draft
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Proposed schedule for{" "}
                <span className="text-foreground font-medium">
                  {headerInfo.calendar}
                </span>{" "}
                <span className="text-muted-foreground/60">({timezone})</span>
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-lg h-7 w-7 text-muted-foreground hover:text-foreground"
              data-testid="ai-plan-dismiss-button"
              aria-label="Close review"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Read-only guarantee */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-[11px] text-muted-foreground">
            <Info className="w-3 h-3 shrink-0" />
            <span>
              <strong className="font-semibold">Read-only preview.</strong> Your saved schedule will not be modified.
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && <DrawerLoadingSkeleton />}

        {/* Error State */}
        {!isLoading && error && (
          <div className="px-6 py-6">
            <div
              className="p-4 rounded-xl bg-destructive/8 border border-destructive/15 text-destructive space-y-3"
              data-testid="ai-plan-error-state"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Failed to generate AI plan draft</h4>
                  <p className="text-xs text-destructive/80 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRegenerate}
                  className="rounded-lg text-xs h-8 px-3 border-destructive/20 hover:bg-destructive/10 text-destructive font-medium"
                  data-testid="ai-plan-retry-button"
                >
                  <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && draft && (
          <div className="divide-y divide-border/30">

            {/* Section 1: Engine info */}
            <div className="px-6 py-5" data-testid="ai-plan-provider-banner">
              <div className="flex items-center gap-2.5 mb-1.5">
                {isFallback ? (
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isFallback
                    ? "Deterministic Engine (Local Fallback)"
                    : `Local AI Assisted (${ai.model || "qwen2.5-coder:7b"})`}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-medium px-1.5 py-0 rounded-md text-muted-foreground border-border/50 ml-auto"
                  data-testid="ai-provider-badge"
                >
                  {ai.provider}
                </Badge>
              </div>

              {isFallback ? (
                <p
                  className="text-xs text-muted-foreground/80 leading-relaxed"
                  data-testid="ai-plan-fallback-reason"
                >
                  {ai.fallbackReason ||
                    "Local AI was unreachable; Athena used priority rules and collision-free scheduling."}
                </p>
              ) : (
                ai.overallReasoning && (
                  <p
                    className="text-xs text-muted-foreground/80 leading-relaxed italic"
                    data-testid="ai-plan-reasoning"
                  >
                    "{ai.overallReasoning}"
                  </p>
                )
              )}
            </div>

            {/* Section 2: Stats row */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-5">
                {/* Planning Window */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                    <Clock className="w-3 h-3" />
                    <span>Window</span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                    {draft.planningWindow?.formattedRange || "09:00 – 18:00"}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {draft.planningWindow?.availableMinutes ?? 0}m available
                  </p>
                </div>

                {/* Capacity */}
                <div className="space-y-1" data-testid="ai-plan-capacity-card">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                    {capacity.isOverloaded ? (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                    <span>Capacity</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                      {summary.totalPlannedMinutes || 0}m
                    </p>
                    {capacity.formattedCapacity && (
                      <span className="text-[11px] text-muted-foreground">
                        / {capacity.formattedCapacity}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] font-medium ${capacity.isOverloaded
                        ? "text-amber-500"
                        : capacity.status === "realistic"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    data-testid="ai-plan-capacity-status"
                  >
                    {capacity.isOverloaded
                      ? `Overload (${Math.round((capacity.overloadRatio - 1) * 100)}% over)`
                      : capacity.status === "realistic"
                        ? "Realistic load"
                        : "Baseline in progress"}
                  </p>
                  <CapacityBar
                    percent={capacityPercent}
                    isOverloaded={capacity.isOverloaded}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Warnings (combined into one section) */}
            {(capacity.isOverloaded || isAssumedDurationPresent) && (
              <div className="px-6 py-5 space-y-3">
                {capacity.isOverloaded && (
                  <div
                    className="flex items-start gap-2.5 text-xs"
                    data-testid="ai-plan-overload-warning"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Planning Overload Warning</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground leading-relaxed">
                        {capacity.explanation ||
                          "Total planned time exceeds your 14-day median. Consider deferring lower-priority items."}
                      </span>
                    </div>
                  </div>
                )}

                {isAssumedDurationPresent && (
                  <div
                    className="flex items-start gap-2.5 text-xs"
                    data-testid="ai-plan-assumed-duration-warning"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Assumed Default Durations</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground leading-relaxed">
                        {summary.assumedDurationsCount || "Some"} block(s) use a default 30-minute estimate.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Proposed Schedule */}
            <div className="px-6 py-5" data-testid="ai-proposed-blocks-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                  Proposed Schedule
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md tabular-nums">
                    {proposedBlocks.length}
                  </span>
                </h3>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {summary.proposedMinutes || 0}m total
                </span>
              </div>

              {proposedBlocks.length === 0 ? (
                <div
                  className="py-10 text-center space-y-2"
                  data-testid="ai-plan-empty-state"
                >
                  <Calendar className="w-5 h-5 mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-medium text-muted-foreground">No proposed blocks</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    All tasks for this day are already scheduled or complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5" data-testid="ai-proposed-blocks-list">
                  {proposedBlocks.map((block, idx) => (
                    <ProposedBlockCard key={block.targetId || idx} block={block} />
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Unplaced Items */}
            {unplacedItems.length > 0 && (
              <div className="px-6 py-5" data-testid="ai-unplaced-items-section">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    Could Not Be Scheduled
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md tabular-nums">
                      ({unplacedItems.length})
                    </span>
                  </h3>
                  <Badge variant="outline" className="text-[9px] font-medium text-muted-foreground border-border/50">
                    Window Full
                  </Badge>
                </div>

                <div className="space-y-2">
                  {unplacedItems.map((item, idx) => (
                    <div
                      key={item.targetId || idx}
                      data-testid="unplaced-item"
                      className="px-3.5 py-2.5 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate text-[13px]">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.durationMinutes}m · {item.priority || "medium"} priority
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-amber-500/80 shrink-0">
                        {item.reason === "insufficient_available_time"
                          ? "Insufficient time"
                          : item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: Existing blocks reference */}
            {existingBlocks.length > 0 && (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500/60" />
                    {existingBlocks.length} existing block(s) respected
                  </span>
                  <span className="tabular-nums">{summary.existingMinutes || 0}m</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/50 px-6 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span>Review only · schedule unmodified</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isLoading}
          className="rounded-lg text-xs h-8 px-3.5 font-medium"
          data-testid="ai-plan-regenerate-button"
        >
          <RotateCw className={`w-3 h-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}


export default function AiDailyPlanDrawer({
  open = false,
  onOpenChange,
  selectedDate,
}) {
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDraft = useCallback(
    async (dateStr) => {
      if (!dateStr || isLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await scheduleService.getAiDraft({
          productDate: dateStr,
        });

        if (response && response.success && response.draft) {
          setDraft(response.draft);
        } else if (response && response.draft) {
          setDraft(response.draft);
        } else {
          setDraft(response);
        }
      } catch (err) {
        console.error("AI Daily Plan Draft request failed:", err);
        setError(err.message || "Failed to generate AI planning draft");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // Fetch draft whenever the drawer is opened or date changes
  useEffect(() => {
    if (open && selectedDate) {
      fetchDraft(selectedDate);
    } else if (!open) {
      // Clear error on close
      setError(null);
    }
  }, [open, selectedDate]); // fetchDraft is stable via useCallback with isLoading dependency

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleRegenerate = () => {
    fetchDraft(selectedDate);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col bg-background border-l border-border/50"
        data-testid="ai-plan-sheet-content"
      >
        <AiDailyPlanReviewContent
          selectedDate={selectedDate}
          draft={draft}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleRegenerate}
          onClose={handleClose}
        />
      </SheetContent>
    </Sheet>
  );
}
