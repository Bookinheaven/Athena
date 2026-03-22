import RequestService from "./requestService";

class plannerService extends RequestService {
  getTasks() {
    return this.request("/planner", { method: "GET"});
  }
}

export default new plannerService();