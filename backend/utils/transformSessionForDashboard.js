const transformSessionForDashboard = (session) => {
  const s = session.toObject ? session.toObject() : session;

  const actualFocusDuration = s.history
    .filter((h) => h.type === "focus")
    .reduce((acc, h) => acc + h.totalDuration, 0);

  const actualBreakDuration = s.history
    .filter((h) => h.type === "break")
    .reduce((acc, h) => acc + h.totalDuration, 0);

  const completedSegments = s.history.filter((h) => h.type === "focus" && s.isDone === true).length;
  const totalSegments = s.history.filter((h) => h.type === "focus").length;
  return {
    id: s._id,
    title: s.title,
    createdAt: s.timestamp,
    endedAt: s.endedAt,
    status: s.status,

    plannedFocusDuration: s.userSettings?.totalFocusDuration || 0,
    plannedBreakDuration: s.userSettings?.breakDuration || 0,
    actualFocusDuration,
    actualBreakDuration,
    completedSegments,
    totalSegments: totalSegments || 0,

    todosCompleted:
      s.userData?.todos?.filter((t) => t.status === "completed").length || 0,
    todosTotal: s.userData?.todos?.length || 0,

    feedbackMood: s.sessionFeedback?.mood ?? null,
    feedbackFocus: s.sessionFeedback?.focus ?? null,
    feedbackDistractions: s.sessionFeedback?.distractions || "",
  };
};

export default transformSessionForDashboard;
