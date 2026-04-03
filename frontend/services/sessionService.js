import RequestService from "./requestService";

class SessionService extends RequestService {
  startSession(payload) {
    return this.request("/session", { method: "POST", body: payload });
  }

  updateProgress(payload) {
    return this.request(`/session/${payload.sessionId}`, { method: "PATCH", body: payload });
  }

  sessionFeedback(payload) {
    return this.request(`/session/${payload.sessionId}/feedback`, { method: "POST", body: payload.feedback })
  }

  getActiveSession() {
    return this.request("/session/active", { method: "GET" });
  }

  getSessions() {
    return this.request("/session/all", { method: "GET" });
  }

  getInsights() {
    return this.request("/session/insights", { method: "GET" });
  }
  
  getTodaysInsights() {
    return this.request("/session/today", { method: "GET" });
  }
}

export default new SessionService();