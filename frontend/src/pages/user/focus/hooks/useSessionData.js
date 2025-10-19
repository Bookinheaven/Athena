const createSessionData = (totalFocusDuration, breakDuration, maxBreaks) => {
  const minFocusSegmentDuration = 5 * 60; // e.g., minimum 5 minutes focus for a break to be meaningful

  const possibleBreaks = Math.min(
    maxBreaks,
    Math.floor(totalFocusDuration / (minFocusSegmentDuration + breakDuration))
  );

  const segments = [];
  const focusSegmentDuration = Math.floor(totalFocusDuration / (possibleBreaks + 1));

  for (let i = 0; i < possibleBreaks + 1; i++) {
    segments.push({
      type: "focus",
      duration: 0,
      totalDuration: focusSegmentDuration,
      completedAt: null,
      startTimestamp: null,
    });

    if (i < possibleBreaks) {
      segments.push({
        type: "break",
        duration: 0,
        totalDuration: breakDuration,
        completedAt: null,
        startTimestamp: null,
      });
    }
  }

  return segments;
};

export default createSessionData;
