import RequestService from "./requestService";

class SessionService extends RequestService {
  async saveSession(sessionData) {
    return this.request("/session/save", {
      method: "POST",
      body: sessionData,
    });
  }

  async startSession(data) {
    return this.request("/session/", {
      method: "POST",
      body: data,
    });
  }

  updateSession(id,action){
    return this.request(`/session/${id}`,{
      method:"PATCH",
      body:{ action }
    })
  }

  sendFeedback(id, data){
    return this.request(`/session/${id}/feedback`,{
      method:"POST",
      body: data
    })
  }

  async getSessions() {
      return this.request("/session/all", { method: "GET" });
  }

  async getActiveSession() {
      return this.request("/session/active", { method: "GET" });
  }

  async getInsights() {
    return this.request("/session/insights", { method: "GET" });
  }
 
  async getTodaysInsights() {
    return this.request("/session/today", { method: "GET" });
  }
}

export default new SessionService();
