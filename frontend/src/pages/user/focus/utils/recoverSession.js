export const recoverElapsed = (segment) => {
    if (!segment) return 0;
    // Completed then total duration
    if (segment.completedAt) {
        return segment.totalDuration;
    }
    const stored = segment.duration || 0;
    // currently running
    if (segment.startedAt) {
        const start = new Date(segment.startedAt).getTime();
        const now = Date.now();
        const live = Math.floor((now - start) / 1000);
        return Math.min(stored + live, segment.totalDuration);
    }
     return stored;
};
