const createSessionData = (totalFocusDuration, breakDuration, maxBreaks) => {
  const minFocusSegmentDuration = 25 * 60;
  // const minFocusSegmentDuration = 10;

  const possibleBreaks = Math.min(
    maxBreaks,
    Math.floor(totalFocusDuration / (minFocusSegmentDuration + breakDuration))
  );

  const totalBreakTime = possibleBreaks * breakDuration;
  const totalFocusTime = totalFocusDuration - totalBreakTime; 
  const focusSegmentDuration = Math.floor(totalFocusTime / (possibleBreaks + 1));

  const segments = [];

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