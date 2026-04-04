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

//   async fetchMonthly(data) {
//     return this.request("/api/streak/monthly", { method: "POST", body: data })
//   }
  
}

export default new StreakService()