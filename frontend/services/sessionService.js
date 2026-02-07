import RequestService from "./requestService";

class SessionService extends RequestService {
  async saveSession(sessionData) {
    return this.request("/session/save", {
      method: "POST",
      body: sessionData,
    });
  }

  async getSessions() {
      return this.request("/session/getAll", { method: "GET" });
  }

  async getActiveSession() {
      return this.request("/session/getCurrent", { method: "GET" });
  }

  async getInsights() {
    return this.request("/session/insights", { method: "GET" });
  }
}

export default new SessionService();
