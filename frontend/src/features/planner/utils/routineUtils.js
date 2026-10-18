export const ISO_WEEKDAYS = [
  { day: 1, short: "Mon", label: "Monday" },
  { day: 2, short: "Tue", label: "Tuesday" },
  { day: 3, short: "Wed", label: "Wednesday" },
  { day: 4, short: "Thu", label: "Thursday" },
  { day: 5, short: "Fri", label: "Friday" },
  { day: 6, short: "Sat", label: "Saturday" },
  { day: 7, short: "Sun", label: "Sunday" },
];

export function formatRecurrence(recurrenceType, recurrenceDays = []) {
  if (recurrenceType === "daily") {
    return "Every day";
  }

  const days = Array.isArray(recurrenceDays) ? [...recurrenceDays].sort((a, b) => a - b) : [];
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";

  const isWeekdays =
    days.length === 5 && days.every((d, i) => d === i + 1);
  if (isWeekdays) return "Weekdays (Mon–Fri)";

  const isWeekends =
    days.length === 2 && days[0] === 6 && days[1] === 7;
  if (isWeekends) return "Weekends (Sat–Sun)";

  const shortNames = days.map((d) => {
    const found = ISO_WEEKDAYS.find((w) => w.day === d);
    return found ? found.short : `Day ${d}`;
  });

  return shortNames.join(", ");
}

export function formatTargetTime(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(":");
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, "0");

  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${ampm}`;
}

export function validateRoutinePayload(formData) {
  const errors = {};

  if (!formData.title || !formData.title.trim()) {
    errors.title = "Routine title is required";
  } else if (formData.title.trim().length > 150) {
    errors.title = "Routine title must be 150 characters or less";
  }

  if (formData.recurrenceType === "selected_days") {
    if (!Array.isArray(formData.recurrenceDays) || formData.recurrenceDays.length === 0) {
      errors.recurrenceDays = "Select at least one weekday";
    }
  }

  const est = Number(formData.estimatedMinutes);
  if (isNaN(est) || est < 1) {
    errors.estimatedMinutes = "Estimated duration must be at least 1 minute";
  }

  if (!Array.isArray(formData.steps) || formData.steps.length === 0) {
    errors.steps = "At least one step is required";
  } else {
    const invalidSteps = formData.steps.some(
      (s) => !s || typeof s.title !== "string" || !s.title.trim()
    );
    if (invalidSteps) {
      errors.stepTitles = "All checklist steps must have a title";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
