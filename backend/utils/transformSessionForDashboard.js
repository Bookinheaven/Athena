const transformSessionForDashboard = (session) => {
  const s = session.toObject ? session.toObject() : session;

  const actualFocusDuration = s.sessionSegments
    .filter((h) => h.type === "focus")
    .reduce((acc, h) => acc + h.totalDuration, 0);

  const actualBreakDuration = s.sessionSegments
    .filter((h) => h.type === "break")
    .reduce((acc, h) => acc + h.totalDuration, 0);
  const completedSegments = s.sessionSegments.filter((h) => h.type === "focus" && h.completedAt != null).length;
  const totalSegments = s.sessionSegments.filter((h) => h.type === "focus").length;
  return {
    id: s._id,
    title: s.title,
    createdAt: s.createdAt,
    endedAt: s.endedAt,
    status: s.status,
    isDone: s.plannedDuration == s.duration,
    plannedFocusDuration: s.plannedDuration || 0,
    plannedBreakDuration: s.sessionSettings?.breakDuration || 0,
    actualFocusDuration,
    actualBreakDuration,
    completedSegments,
    totalSegments: totalSegments || 0,

    todosCompleted:
      s.todos?.filter((t) => t.status === "Completed").length || 0,
    todosTotal: s.todos?.length || 0,

    feedbackMood: s.sessionFeedback?.mood ?? null,
    feedbackFocus: s.sessionFeedback?.focus ?? null,
    feedbackDistractions: s.sessionFeedback?.distractions || "",
  };
};

export default transformSessionForDashboard;
