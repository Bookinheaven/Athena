class RLTrackingService {
  constructor() {
    this.events = [];
    this.sessionPrefix = "rl_session_";
  }

  /**
   * Log an event locally (to be replaced with API calls when ML model is ready)
   * @param {string} eventType 
   * @param {Object} payload 
   */
  _logEvent(eventType, payload) {
    const event = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.events.push(event);
    console.debug(`[RL Tracking] ${eventType}:`, payload);

    // For persistence in dev, we could write to localStorage
    try {
      const storedEvents = JSON.parse(localStorage.getItem('rl_tracking_events') || '[]');
      storedEvents.push(event);
      // Keep only last 1000 events to prevent quota issues in localStorage
      if (storedEvents.length > 1000) storedEvents.shift();
      localStorage.setItem('rl_tracking_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.error("[RL Tracking] Failed to persist event to localStorage", error);
    }
  }

  trackSessionStart(sessionData) {
    this._logEvent('SESSION_START', {
      sessionId: sessionData?.sessionId,
      sessionType: sessionData?.sessionType,
      plannedDuration: sessionData?.plannedDuration,
      timestamp: new Date().toISOString()
    });
  }

  trackPauseEvent(sessionData, pauseEvent) {
    this._logEvent('SESSION_PAUSED', {
      sessionId: sessionData?.sessionId,
      pauseId: pauseEvent.id,
      durationSeconds: pauseEvent.duration,
      reason: pauseEvent.reason,
      startTime: pauseEvent.startTime,
      endTime: pauseEvent.endTime
    });
  }

  trackSegmentComplete(sessionData, segmentIndex, duration) {
    this._logEvent('SEGMENT_COMPLETED', {
      sessionId: sessionData?.sessionId,
      segmentIndex,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  trackSessionEnd(sessionData, sessionStats, status) {
    this._logEvent('SESSION_END', {
      sessionId: sessionData?.sessionId,
      status, // 'completed' | 'skipped' | 'stopped'
      stats: sessionStats,
      timestamp: new Date().toISOString()
    });
  }
}

export const rlTrackingService = new RLTrackingService();
