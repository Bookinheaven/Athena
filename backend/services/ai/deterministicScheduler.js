import { calculatePlanningOverload } from "../../utils/capacityEngine.js";

class DeterministicScheduler {
  /**
   * Computes non-overlapping free time intervals within the planning window.
   *
   * @param {number} windowStartMs Window start epoch ms
   * @param {number} windowEndMs Window end epoch ms
   * @param {Array<object>} occupiedIntervals Existing occupied intervals
   * @returns {Array<{ startMs: number, endMs: number, durationMinutes: number }>}
   */
  computeAvailableIntervals(windowStartMs, windowEndMs, occupiedIntervals = []) {
    // 1. Clip occupied intervals strictly inside the planning window
    const clipped = [];
    for (const b of occupiedIntervals) {
      const start = Math.max(windowStartMs, Number(b.startMs));
      const end = Math.min(windowEndMs, Number(b.endMs));
      if (end > start) {
        clipped.push({ startMs: start, endMs: end });
      }
    }

    // 2. Sort by start time ascending
    clipped.sort((a, b) => a.startMs - b.startMs);

    // 3. Merge overlapping or adjacent occupied intervals
    const merged = [];
    for (const block of clipped) {
      if (merged.length === 0) {
        merged.push({ ...block });
      } else {
        const last = merged[merged.length - 1];
        if (block.startMs <= last.endMs) {
          last.endMs = Math.max(last.endMs, block.endMs);
        } else {
          merged.push({ ...block });
        }
      }
    }

    // 4. Compute free intervals between occupied blocks
    const freeIntervals = [];
    let cursor = windowStartMs;

    for (const occ of merged) {
      if (occ.startMs > cursor) {
        const durationMinutes = Math.round((occ.startMs - cursor) / 60000);
        if (durationMinutes >= 5) {
          freeIntervals.push({
            startMs: cursor,
            endMs: occ.startMs,
            durationMinutes,
          });
        }
      }
      cursor = Math.max(cursor, occ.endMs);
    }

    if (cursor < windowEndMs) {
      const durationMinutes = Math.round((windowEndMs - cursor) / 60000);
      if (durationMinutes >= 5) {
        freeIntervals.push({
          startMs: cursor,
          endMs: windowEndMs,
          durationMinutes,
        });
      }
    }

    return freeIntervals;
  }

  /**
   * Sorts candidates deterministically by priority, habit commitment, and overdue urgency.
   */
  _sortCandidatesDeterministically(candidates) {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return [...candidates].sort((a, b) => {
      // 1. Routine occurrences prioritized as daily anchor habits
      if (a.targetType === "routine_occurrence" && b.targetType !== "routine_occurrence") return -1;
      if (b.targetType === "routine_occurrence" && a.targetType !== "routine_occurrence") return 1;

      // 2. Priority tier comparison (High > Medium > Low)
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;

      // 3. Overdue urgency
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // 4. Due date / planned date
      const dateA = a.plannedProductDate || a.dueDate || "9999-99-99";
      const dateB = b.plannedProductDate || b.dueDate || "9999-99-99";
      return dateA.localeCompare(dateB);
    });
  }

  /**
   * Merges and validates AI recommended ordering with candidate list.
   * Discards hallucinated or unknown candidate IDs.
   */
  _resolveCandidateOrder(candidates, aiRecommendation = null) {
    const candidateMap = new Map(candidates.map((c) => [String(c.id), c]));
    const ordered = [];
    const seenIds = new Set();

    // 1. If AI recommendation is available, validate proposed IDs
    if (aiRecommendation?.recommendedOrder && Array.isArray(aiRecommendation.recommendedOrder)) {
      for (const rec of aiRecommendation.recommendedOrder) {
        const idStr = String(rec.targetId);
        if (candidateMap.has(idStr) && !seenIds.has(idStr)) {
          seenIds.add(idStr);
          const candidate = candidateMap.get(idStr);
          ordered.push({
            ...candidate,
            rationale: rec.rationale || `Recommended based on ${candidate.priority} priority.`,
          });
        }
      }
    }

    // 2. Append any eligible candidates omitted by the model (or all candidates if no model recommendation)
    const omitted = candidates.filter((c) => !seenIds.has(String(c.id)));
    const sortedOmitted = this._sortCandidatesDeterministically(omitted);

    for (const c of sortedOmitted) {
      let defaultRationale = `Scheduled based on ${c.priority} priority and daily commitment.`;
      if (c.targetType === "routine_occurrence") {
        defaultRationale = `Routine habit anchor (${c.stepProgress || "pending steps"}).`;
      } else if (c.isOverdue) {
        defaultRationale = `Overdue task prioritized for immediate resolution.`;
      }
      ordered.push({
        ...c,
        rationale: defaultRationale,
      });
    }

    return ordered;
  }

  /**
   * Formats an epoch millisecond timestamp into a human-readable local time "HH:mm".
   */
  _formatLocalTime(epochMs, timezone) {
    const d = new Date(epochMs);
    return d.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  /**
   * Generates a deterministic, collision-free schedule draft.
   *
   * @param {object} planningContext Output of planningContextService.assembleContext
   * @param {object} [aiRecommendation=null] Validated AI order recommendation
   * @param {object} [aiMetadata=null] Information about the AI provider used
   * @returns {object} Final planning draft
   */
  buildDraft(planningContext, aiRecommendation = null, aiMetadata = null) {
    const {
      productDate,
      timezone,
      planningWindow,
      occupiedIntervals,
      candidates,
      currentlyScheduledMinutes,
      capacityResult,
      defaultTaskDurationMinutes,
    } = planningContext;

    // 1. Compute free intervals
    const freeIntervals = this.computeAvailableIntervals(
      planningWindow.startMs,
      planningWindow.endMs,
      occupiedIntervals
    );

    const initialAvailableMinutes = freeIntervals.reduce((sum, int) => sum + int.durationMinutes, 0);

    // 2. Resolve candidate ordering (validating model IDs)
    const orderedCandidates = this._resolveCandidateOrder(candidates, aiRecommendation);

    // 3. Slot candidates into free intervals
    const proposedBlocks = [];
    const unplacedItems = [];
    const mutableIntervals = freeIntervals.map((int) => ({ ...int }));

    for (const candidate of orderedCandidates) {
      const rawDuration = Number(candidate.durationMinutes || defaultTaskDurationMinutes || 30);
      const requiredMinutes = isNaN(rawDuration)
        ? 30
        : Math.max(5, Math.min(240, Math.round(rawDuration)));

      // Find first interval with enough room
      let placed = false;
      for (const interval of mutableIntervals) {
        if (interval.durationMinutes >= requiredMinutes) {
          const blockStartMs = interval.startMs;
          const blockEndMs = blockStartMs + requiredMinutes * 60000;

          const blockStart = new Date(blockStartMs);
          const blockEnd = new Date(blockEndMs);

          const timeRangeStr = `${this._formatLocalTime(blockStartMs, timezone)} – ${this._formatLocalTime(blockEndMs, timezone)}`;

          proposedBlocks.push({
            targetType: candidate.targetType,
            targetId: candidate.id,
            title: candidate.title,
            startTime: blockStart.toISOString(),
            endTime: blockEnd.toISOString(),
            formattedTimeRange: timeRangeStr,
            durationMinutes: requiredMinutes,
            isDurationAssumed: Boolean(candidate.isDurationAssumed),
            priority: candidate.priority || "medium",
            rationale: candidate.rationale,
          });

          // Advance interval start
          interval.startMs = blockEndMs;
          interval.durationMinutes = Math.round((interval.endMs - interval.startMs) / 60000);
          placed = true;
          break;
        }
      }

      if (!placed) {
        unplacedItems.push({
          targetType: candidate.targetType,
          targetId: candidate.id,
          title: candidate.title,
          durationMinutes: requiredMinutes,
          priority: candidate.priority || "medium",
          reason: "insufficient_available_time",
        });
      }
    }

    // 4. Summaries & Capacity
    const proposedMinutes = proposedBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
    const totalPlannedMinutes = currentlyScheduledMinutes + proposedMinutes;
    const assumedCount = proposedBlocks.filter((b) => b.isDurationAssumed).length;

    const capacityOverload = calculatePlanningOverload(
      totalPlannedMinutes,
      capacityResult,
      productDate
    );

    // 5. Warnings
    const warnings = [];
    if (assumedCount > 0) {
      warnings.push(
        `${assumedCount} proposed block(s) use assumed default durations (${defaultTaskDurationMinutes}m). Review before execution.`
      );
    }
    if (capacityOverload.isOverloaded) {
      warnings.push(
        `Planning Overload Warning: Proposed ${totalPlannedMinutes}m exceeds your sustainable capacity (${capacityOverload.formattedCapacity || "C14"}) by ${Math.round((capacityOverload.overloadRatio - 1) * 100)}%.`
      );
    }
    if (unplacedItems.length > 0) {
      warnings.push(
        `${unplacedItems.length} item(s) could not be scheduled due to insufficient time in the planning window.`
      );
    }

    return {
      productDate,
      timezone,
      planningWindow: {
        startTime: planningWindow.startTime,
        endTime: planningWindow.endTime,
        formattedRange: planningWindow.formattedRange,
        totalWindowMinutes: planningWindow.totalWindowMinutes,
        availableMinutes: initialAvailableMinutes,
      },
      proposedBlocks,
      unplacedItems,
      existingBlocks: occupiedIntervals.map((b) => ({
        id: b.id,
        title: b.title,
        targetType: b.targetType,
        targetId: b.targetId,
        startTime: b.startTime,
        endTime: b.endTime,
        durationMinutes: b.durationMinutes,
      })),
      summary: {
        proposedBlocksCount: proposedBlocks.length,
        proposedMinutes,
        existingBlocksCount: occupiedIntervals.length,
        existingMinutes: currentlyScheduledMinutes,
        totalPlannedMinutes,
        unplacedCount: unplacedItems.length,
        assumedDurationsCount: assumedCount,
        hasAssumedDurations: assumedCount > 0,
      },
      capacity: {
        rollingCapacityMinutes: capacityOverload.rollingCapacityMinutes,
        scheduledMinutes: totalPlannedMinutes,
        overloadRatio: capacityOverload.overloadRatio,
        threshold: capacityOverload.threshold,
        status: capacityOverload.status,
        isOverloaded: capacityOverload.isOverloaded,
        explanation: capacityOverload.explanation,
        formattedCapacity: capacityOverload.formattedCapacity,
      },
      ai: {
        provider: aiMetadata?.provider || "deterministic-fallback",
        model: aiMetadata?.model || null,
        aiAssistanceAvailable: Boolean(aiMetadata?.aiAssistanceAvailable),
        fallbackReason: aiMetadata?.fallbackReason || null,
        overallReasoning: aiRecommendation?.overallReasoning || null,
      },
      warnings,
    };
  }
}

export const deterministicScheduler = new DeterministicScheduler();
export default deterministicScheduler;
