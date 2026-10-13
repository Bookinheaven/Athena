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

  async getAdaptiveTarget() {
    return this.request("/streak/adaptive-target", { method: "GET" });
  }

  async applyAdaptiveTarget(targetMinutes = null) {
    return this.request("/streak/adaptive-target/apply", {
      method: "POST",
      body: targetMinutes !== null ? { targetMinutes } : {},
    });
  }

  async updateTargetSettings(data = {}) {
    return this.request("/streak/target-settings", {
      method: "PUT",
      body: data,
    });
  }
}

export default new StreakService()