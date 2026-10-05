import RequestService from "./requestService";

class SessionService extends RequestService {
  startSession(payload) {
    return this.request("/session", { method: "POST", body: payload });
  }

  updateProgress(payload) {
    return this.request(`/session/${payload.sessionId}`, { method: "PATCH", body: payload });
  }

  checkpointProgress(payload) {
    return this.request(`/session/${payload.sessionId}/progress`, { method: "PATCH", body: payload });
  }

  sessionFeedback(payload) {
    return this.request(`/session/${payload.sessionId}/feedback`, { method: "POST", body: payload.feedback })
  }

  recordTaskOutcome(sessionId, outcomePayload) {
    const body =
      typeof outcomePayload === "object" && outcomePayload !== null
        ? outcomePayload
        : { taskOutcome: outcomePayload };
    return this.request(`/session/${sessionId}/task-outcome`, { method: "POST", body });
  }

  getActiveSession() {
    return this.request("/session/active", { method: "GET" });
  }

  getSessions() {
    return this.request("/session/all", { method: "GET" });
  }

  getHistory(queryParams = {}) {
    const query = new URLSearchParams(queryParams).toString();
    return this.request(`/session/history${query ? `?${query}` : ""}`, { method: "GET" });
  }

  getInsights() {
    return this.request("/session/insights", { method: "GET" });
  }
  
  getTodaysInsights() {
    return this.request("/session/today", { method: "GET" });
  }
}

export default new SessionService();