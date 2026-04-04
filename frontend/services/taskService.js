import RequestService from "./requestService";

class TaskService extends RequestService {
  createTask(payload) {
    return this.request("/task", { method: "POST", body: payload });
  }

  getTasks() {
    return this.request("/task", { method: "GET"});
  }

  reOrderTasks(payload) {
    return this.request("/task/reorder", { method: "PATCH", body: payload});
  }

  updateTask(taskId, payload) {
    return this.request(`/task/${taskId}`, { method: "PATCH", body: payload});
  }
  
  deleteTask(taskId) {
    return this.request(`/task/${taskId}`, { method: "DELETE" })
  }
}

export default new TaskService();