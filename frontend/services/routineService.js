import RequestService from "./requestService.js";

class RoutineService extends RequestService {
  getRoutines(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append("status", params.status);
    if (params.includeArchived) searchParams.append("includeArchived", "true");
    const qs = searchParams.toString();
    return this.request(`/routines${qs ? `?${qs}` : ""}`, { method: "GET" });
  }

  getRoutine(id) {
    return this.request(`/routines/${id}`, { method: "GET" });
  }

  createRoutine(payload) {
    return this.request("/routines", {
      method: "POST",
      body: payload,
    });
  }

  updateRoutine(id, payload) {
    return this.request(`/routines/${id}`, {
      method: "PATCH",
      body: payload,
    });
  }

  updateStatus(id, status) {
    return this.request(`/routines/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  }

  deleteRoutine(id) {
    return this.request(`/routines/${id}`, {
      method: "DELETE",
    });
  }

  getTodayOccurrences() {
    return this.request("/routines/occurrences/today", { method: "GET" });
  }

  getOccurrencesByDate(date) {
    return this.request(`/routines/occurrences?date=${encodeURIComponent(date)}`, { method: "GET" });
  }

  completeStep(occurrenceId, stepId, isCompleted = true) {
    return this.request(`/routines/occurrences/${occurrenceId}/steps/${stepId}/complete`, {
      method: "PATCH",
      body: { isCompleted },
    });
  }

  skipOccurrence(occurrenceId) {
    return this.request(`/routines/occurrences/${occurrenceId}/skip`, {
      method: "POST",
    });
  }

  unskipOccurrence(occurrenceId) {
    return this.request(`/routines/occurrences/${occurrenceId}/unskip`, {
      method: "POST",
    });
  }
}

export default new RoutineService();
