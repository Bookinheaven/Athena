import transformSessionForDashboard from "./transformSessionForDashboard.js";

const generateInsights = async (userId, sessions) => {
  const summarizedSessions = sessions.map(transformSessionForDashboard);

  if (summarizedSessions.length === 0) {
    const emptyTrends = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
      (day) => ({ day, focusTime: 0 })
    );
    return {
      kpis: {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        avgMood: 0,
        avgFocus: 0,
        avgSessionLength: 0,
        avgTodosCompleted: 0,
      },
      focusVsBreakData: [],
      focusMoodData: [],
      topDistractions: [],
      focusTrends: emptyTrends,
    };
  }

  const totalFocusTime = summarizedSessions.reduce(
    (acc, s) => acc + (s.actualFocusDuration || 0),
    0
  );
  const sessionsCompleted = summarizedSessions.filter(
    (s) => s.status === "completed"
  ).length;

  const validMoods = summarizedSessions
    .map((s) => s.feedbackMood)
    .filter((m) => m != null);
  const validFocus = summarizedSessions
    .map((s) => s.feedbackFocus)
    .filter((f) => f != null);
  const avgMood =
    validMoods.length > 0
      ? validMoods.reduce((acc, m) => acc + m, 0) / validMoods.length
      : 0;
  const avgFocus =
    validFocus.length > 0
      ? validFocus.reduce((acc, f) => acc + f, 0) / validFocus.length
      : 0;

  const totalSessionDurations = summarizedSessions.reduce(
    (acc, s) =>
      acc + (s.actualFocusDuration || 0) + (s.actualBreakDuration || 0),
    0
  );
  const avgSessionLength = totalSessionDurations / summarizedSessions.length;
  const avgTodosCompleted =
    summarizedSessions.reduce((acc, s) => acc + (s.todosCompleted || 0), 0) /
    summarizedSessions.length;

  const kpis = {
    totalFocusTime,
    sessionsCompleted,
    avgMood: avgMood.toFixed(1),
    avgFocus: avgFocus.toFixed(1),
    avgSessionLength,
    avgTodosCompleted: avgTodosCompleted.toFixed(1),
  };

  const totalBreakTime = summarizedSessions.reduce(
    (acc, s) => acc + (s.actualBreakDuration || 0),
    0
  );
  const focusVsBreakData = [
    { name: "Focus", value: totalFocusTime, fill: "#805AD5" },
    { name: "Break", value: totalBreakTime, fill: "#4A5568" },
  ];

  const focusMoodData = [
    { subject: "Focus", value: avgFocus, fullMark: 5 },
    { subject: "Mood", value: avgMood, fullMark: 5 },
  ];

  const distractionCounts = {};
  summarizedSessions.forEach((s) => {
    if (s.feedbackDistractions) {
      const distraction = s.feedbackDistractions.toLowerCase().trim();
      if (distraction) {
        distractionCounts[distraction] =
          (distractionCounts[distraction] || 0) + 1;
      }
    }
  });
  const topDistractions = Object.entries(distractionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const dailyTotals = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  summarizedSessions.forEach((session) => {
    if (session.createdAt) {
      const date = new Date(session.createdAt);
      const dayName = dayNames[date.getDay()];
      dailyTotals[dayName] += (session.actualFocusDuration || 0) / 60;
    }
  });
  const focusTrends = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
    (day) => ({
      day,
      focusTime: Math.round(dailyTotals[day]),
    })
  );

  return {
    kpis,
    focusVsBreakData,
    focusMoodData,
    topDistractions,
    focusTrends,
  };
};

export default generateInsights;
