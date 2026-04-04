import RequestService from "./requestService";

class plannerService extends RequestService {
  getPlanner() {
    return this.request("/planner", { method: "GET"});
  }
}

export default new plannerService();