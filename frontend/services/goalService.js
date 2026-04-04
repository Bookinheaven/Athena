import RequestService from "./requestService";

class GoalService extends RequestService {
  createGoal(payload) {
    return this.request("/goal", { method: "POST", body: payload });
  }

  getGoals() {
    return this.request("/goal", { method: "GET"});
  }

  getGoal(goalId) {
    return this.request(`/goal/${goalId}`, { method: "GET"});
  }

  updateGoal(goalId, payload) {
    return this.request(`/goal/${goalId}`, { method: "PATCH", body: payload });
  }

  deleteGoal(goalId, payload) {
    return this.request(`/notes/${goalId}`, { method: "DELETE", body: payload })
  }
}

export default new GoalService();