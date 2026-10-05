import RequestService from "./requestService";

class StreakService extends RequestService {
  async fetchStreak() {
    return this.request("/streak/summary", { method: "GET" })
  }
  async processToday (data) {
    return this.request("/streak/process-today", { method: "POST", body: data })
  }
  async fetchStreakDetails (type) {
    return this.request(`/streak/${type}`, { method: "GET"})
  }

  async fetchMonthly(year, month) {
    const query = new URLSearchParams({ year, month }).toString();
    return this.request(`/streak/monthly?${query}`, { method: "GET" });
  }
  
}

export default new StreakService()