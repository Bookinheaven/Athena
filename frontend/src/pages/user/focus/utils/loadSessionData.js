import sessionService from "../../../../../services/sessionService";

export const loadSessionData = async ({
  initialSession,
  setSessionData,
  setIsLoading,
  dispatch,
  setSessionTitle,
  setSessionPlannedDuration,
}) => {
  try {
    const backendSession = await sessionService.getActiveSession();
    if (backendSession?.status === "active") {
      const segments = backendSession.sessionSegments;

      let currentIndex = segments.findIndex(
        (x) => x.completedAt === null
      );
      if (currentIndex < 0) currentIndex = 0;

      const currentSegment = segments[currentIndex];
      setSessionTitle(backendSession.title);
      setSessionPlannedDuration(backendSession.plannedDuration);

      setSessionData({
        sessionId: backendSession.sessionId,
        title: backendSession.title,
        segmentIndex: currentIndex,
        totalBreaks: segments.filter((s) => s.type === "break").length,
        segments,
        currentDuration: segments.reduce(
          (sum, s) => sum + (s.duration || 0),
          0
        ),
        plannedDuration: backendSession.plannedDuration,
        timestamp: backendSession.createdAt,
        backendCreated: true,
        taskIds: backendSession.taskIds || [],
        sessionType: backendSession.sessionType || "quick",
      });

      dispatch({
        type: "LOAD",
        payload: {
          segments,
          segmentIndex: currentIndex,
          totalSegments: segments?.length,
          status: currentSegment?.completedAt ? "ready" : "paused",
          isDone: false,
        },
      });
    } else {
      setSessionData(initialSession());
    }
  } catch (err) {
    setSessionData(initialSession());
  } finally {
    setIsLoading(false);
  }
};