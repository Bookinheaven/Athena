export const RESCHEDULE_THRESHOLD = 3;
export const LOW_FOCUS_THRESHOLD_MINUTES = 10;
export const LOW_FOCUS_THRESHOLD_SECONDS = LOW_FOCUS_THRESHOLD_MINUTES * 60; // 600 seconds

/**
 * Computes deterministic task friction / repeated deferral signal.
 *
 * @param {object} params
 * @param {object} [params.task] - Domain task object ({ id, status, title, ... })
 * @param {Array<object>} [params.occurrences=[]] - Historical task_occurrences for this task
 * @param {number} [params.focusSeconds=0] - Cumulative focus seconds invested across sessions
 * @returns {{
 *   status: "insufficient_data" | "normal" | "repeated_deferral",
 *   rescheduleCount: number,
 *   focusMinutes: number,
 *   focusSeconds: number,
 *   isUnfinished: boolean,
 *   trigger: boolean,
 *   confidence: "none" | "normal" | "high",
 *   evidence: {
 *     rescheduleCount: number,
 *     focusMinutes: number,
 *     focusSeconds: number,
 *     thresholdReschedules: number,
 *     thresholdFocusMinutes: number,
 *     explanation: string
 *   },
 *   recommendation: {
 *     title: string,
 *     evidence: string,
 *     message: string,
 *     action: string,
 *     availableActions: Array<{ id: string, label: string }>
 *   } | null
 * }}
 */
export function computeTaskFriction({ task, occurrences = [], focusSeconds = 0 } = {}) {
    // If task is missing, return safe insufficient data
    if (!task) {
        return {
            status: "insufficient_data",
            rescheduleCount: 0,
            focusMinutes: 0,
            focusSeconds: 0,
            isUnfinished: false,
            trigger: false,
            confidence: "none",
            evidence: {
                rescheduleCount: 0,
                focusMinutes: 0,
                focusSeconds: 0,
                thresholdReschedules: RESCHEDULE_THRESHOLD,
                thresholdFocusMinutes: LOW_FOCUS_THRESHOLD_MINUTES,
                explanation: "No task record provided.",
            },
            recommendation: null,
        };
    }

    const isCompleted = task.status === "completed";
    const isCancelled = task.status === "cancelled";
    const isUnfinished = !isCompleted && !isCancelled;

    const validOccurrences = Array.isArray(occurrences) ? occurrences : [];
    const rawFocusSec = Math.max(0, Number(focusSeconds) || 0);
    const roundedFocusMinutes = Math.round((rawFocusSec / 60) * 10) / 10;

    // 1. Check for insufficient history
    // If a task has no occurrence records at all, we cannot evaluate deferral history
    if (validOccurrences.length === 0) {
        return {
            status: "insufficient_data",
            rescheduleCount: 0,
            focusMinutes: roundedFocusMinutes,
            focusSeconds: rawFocusSec,
            isUnfinished,
            trigger: false,
            confidence: "none",
            evidence: {
                rescheduleCount: 0,
                focusMinutes: roundedFocusMinutes,
                focusSeconds: rawFocusSec,
                thresholdReschedules: RESCHEDULE_THRESHOLD,
                thresholdFocusMinutes: LOW_FOCUS_THRESHOLD_MINUTES,
                explanation: "Insufficient scheduling history to evaluate task friction.",
            },
            recommendation: null,
        };
    }

    // 2. Count occurrences where outcome is 'rescheduled'
    const rescheduleCount = validOccurrences.filter(
        (occ) => occ && occ.outcome === "rescheduled"
    ).length;

    const meetsRescheduleThreshold = rescheduleCount >= RESCHEDULE_THRESHOLD;
    const meetsLowFocusThreshold = rawFocusSec < LOW_FOCUS_THRESHOLD_SECONDS;

    // 3. Trigger condition: unfinished + >= 3 reschedules + < 10m focus
    const trigger = isUnfinished && meetsRescheduleThreshold && meetsLowFocusThreshold;

    let status = "normal";
    let explanation = "";

    if (trigger) {
        status = "repeated_deferral";
        const minsText = roundedFocusMinutes === 0
            ? "zero focus time"
            : `${roundedFocusMinutes}m of focus`;
        explanation = `Rescheduled ${rescheduleCount} times with ${minsText} recorded (less than ${LOW_FOCUS_THRESHOLD_MINUTES} minutes).`;
    } else if (!isUnfinished) {
        status = "normal";
        explanation = isCompleted
            ? "Task is completed."
            : "Task is cancelled.";
    } else if (!meetsRescheduleThreshold) {
        status = "normal";
        explanation = `Task has been rescheduled ${rescheduleCount} time${rescheduleCount === 1 ? "" : "s"} (threshold is ${RESCHEDULE_THRESHOLD}).`;
    } else if (!meetsLowFocusThreshold) {
        status = "normal";
        explanation = `Task has recorded substantial focus investment (${roundedFocusMinutes}m) despite ${rescheduleCount} reschedules.`;
    }

    const confidence = validOccurrences.length >= RESCHEDULE_THRESHOLD ? "high" : "normal";

    const recommendation = trigger
        ? {
            title: "Repeatedly rescheduled",
            evidence: `${rescheduleCount} reschedules · ${Math.round(roundedFocusMinutes)}m Focus`,
            message: "This task may be easier to finish if you break it into a smaller action or move it to your backlog.",
            action: "break_into_smaller_task",
            availableActions: [
                { id: "break_down", label: "Break into smaller task" },
                { id: "move_to_backlog", label: "Move to backlog" },
                { id: "reschedule", label: "Reschedule" },
            ],
        }
        : null;

    return {
        status,
        rescheduleCount,
        focusMinutes: roundedFocusMinutes,
        focusSeconds: rawFocusSec,
        isUnfinished,
        trigger,
        confidence: trigger ? "high" : confidence,
        evidence: {
            rescheduleCount,
            focusMinutes: roundedFocusMinutes,
            focusSeconds: rawFocusSec,
            thresholdReschedules: RESCHEDULE_THRESHOLD,
            thresholdFocusMinutes: LOW_FOCUS_THRESHOLD_MINUTES,
            explanation,
        },
        recommendation,
    };
}
