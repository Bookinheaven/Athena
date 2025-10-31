import transformSessionForDashboard from "./transformSessionForDashboard.js";

// Helper to calculate productivity score
const calculateProductivityScore = (kpis) => {
  if (!kpis) return 0;

  const focusScore = Math.min((kpis.totalFocusTime / 3600) * 10, 40); // max 40 pts
  const sessionScore = Math.min(kpis.sessionsCompleted * 5, 30); // max 30 pts
  const moodScore = (parseFloat(kpis.avgMood) / 5) * 20; // max 20 pts
  const focusQualityScore = (parseFloat(kpis.avgFocus) / 5) * 10; // max 10 pts

  return Math.round(focusScore + sessionScore + moodScore + focusQualityScore);
};

const generateDailyComparison = (sessions) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();

  const thisWeekData = {};
  const lastWeekData = {};
  days.forEach((day) => {
    thisWeekData[day] = 0;
    lastWeekData[day] = 0;
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    if (!session.createdAt) return;
    const sessionDate = new Date(session.createdAt);
    const dayName = dayNames[sessionDate.getDay()];
    const focusMinutes = (session.actualFocusDuration || 0) / 60;

    if (sessionDate >= oneWeekAgo && sessionDate <= today) {
      thisWeekData[dayName] += focusMinutes;
    } else if (
      sessionDate >= new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
      sessionDate < oneWeekAgo
    ) {
      lastWeekData[dayName] += focusMinutes;
    }
  });

  return days.map((day) => ({
    day,
    thisWeek: Math.round(thisWeekData[day] || 0),
    lastWeek: Math.round(lastWeekData[day] || 0),
  }));
};

const generateMoodTrend = (sessions) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const moodByDay = {};
  const focusByDay = {};

  days.forEach((day) => {
    moodByDay[day] = [];
    focusByDay[day] = [];
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    if (!session.createdAt) return;

    const sessionDate = new Date(session.createdAt);
    if (sessionDate < oneWeekAgo) return;

    const dayName = dayNames[sessionDate.getDay()];

    if (session.feedbackMood != null)
      moodByDay[dayName].push(parseFloat(session.feedbackMood));
    if (session.feedbackFocus != null)
      focusByDay[dayName].push(parseFloat(session.feedbackFocus));
  });

  return days.map((day) => ({
    day,
    mood: (moodByDay[day].length
      ? moodByDay[day].reduce((a, b) => a + b, 0) / moodByDay[day].length
      : 0
    ).toFixed(1),
    focus: (focusByDay[day].length
      ? focusByDay[day].reduce((a, b) => a + b, 0) / focusByDay[day].length
      : 0
    ).toFixed(1),
  }));
};

const generateSessionsByDay = (sessions) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const sessionsByDay = {};
  days.forEach((day) => (sessionsByDay[day] = 0));

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    if (!session.createdAt) return;

    const sessionDate = new Date(session.createdAt);
    if (sessionDate < oneWeekAgo) return;

    const dayName = dayNames[sessionDate.getDay()];
    sessionsByDay[dayName]++;
  });

  return days.map((day) => ({
    day,
    sessions: sessionsByDay[day] || 0,
  }));
};

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
      dailyComparison: emptyTrends.map((d) => ({
        day: d.day,
        thisWeek: 0,
        lastWeek: 0,
      })),
      moodTrend: emptyTrends.map((d) => ({
        day: d.day,
        mood: "0.0",
        focus: "0.0",
      })),
      sessionsByDay: emptyTrends.map((d) => ({ day: d.day, sessions: 0 })),
      completionRate: [
        { name: "Completed", value: 0 },
        { name: "Incomplete", value: 0 },
      ],
    };
  }

  // KPIs calculations
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
  const avgMood = validMoods.length
    ? validMoods.reduce((a, b) => a + b, 0) / validMoods.length
    : 0;
  const avgFocus = validFocus.length
    ? validFocus.reduce((a, b) => a + b, 0) / validFocus.length
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

  // Productivity Score
  const productivityScore = calculateProductivityScore(kpis);

  // Focus vs Break pie data
  const totalBreakTime = summarizedSessions.reduce(
    (acc, s) => acc + (s.actualBreakDuration || 0),
    0
  );
  const focusVsBreakData = [
    { name: "Focus", value: totalFocusTime, fill: "#805AD5" },
    { name: "Break", value: totalBreakTime, fill: "#4A5568" },
  ];

  // Focus Mood Radar chart data
  const focusMoodData = [
    { subject: "Focus", value: parseFloat(avgFocus), fullMark: 5 },
    { subject: "Mood", value: parseFloat(avgMood), fullMark: 5 },
  ];

  // Top distractions
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

  // Generate trends, daily comparison, sessions by day
  const dailyComparison = generateDailyComparison(summarizedSessions);
  const moodTrend = generateMoodTrend(summarizedSessions);
  const sessionsByDay = generateSessionsByDay(summarizedSessions);

  // Completion rate
  const completedCount = sessionsCompleted;
  const incompleteCount = summarizedSessions.length - completedCount;
  const completionRate = [
    { name: "Completed", value: completedCount },
    { name: "Incomplete", value: incompleteCount },
  ];

  // Focus trends - total focus time per day of week
  const dailyTotals = {};
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(
    (day) => (dailyTotals[day] = 0)
  );
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
    productivityScore,
    focusVsBreakData,
    focusMoodData,
    topDistractions,
    focusTrends,
    dailyComparison,
    moodTrend,
    sessionsByDay,
    completionRate,
  };
};

export default generateInsights;
