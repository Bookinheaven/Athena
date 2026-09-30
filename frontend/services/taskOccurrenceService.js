import RequestService from "./requestService";

class TaskOccurrenceService extends RequestService {
  /**
   * Get task occurrences for a given date or range.
   *
   * @param {object} [params={}]
   * @param {string} [params.date] "YYYY-MM-DD"
   * @param {string} [params.startDate] "YYYY-MM-DD"
   * @param {string} [params.endDate] "YYYY-MM-DD"
   * @param {string} [params.taskId]
   * @param {string} [params.outcome]
   * @returns {Promise<{ success: boolean, occurrences: Array }>}
   */
  async getOccurrences(params = {}) {
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        cleanParams[key] = value;
      }
    }
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/task-occurrences${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  }

  /**
   * Ensure or create a planned task occurrence.
   *
   * @param {object} payload
   * @returns {Promise<{ success: boolean, occurrence: object }>}
   */
  async createOccurrence(payload) {
    return this.request("/task-occurrences", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * Update occurrence outcome.
   *
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<{ success: boolean, occurrence: object }>}
   */
  async updateOutcome(id, payload) {
    return this.request(`/task-occurrences/${id}/outcome`, {
      method: "PATCH",
      body: payload,
    });
  }

  /**
   * Reschedule an occurrence.
   *
   * @param {string} id
   * @param {object} payload
   * @returns {Promise<{ success: boolean, occurrence: object }>}
   */
  async reschedule(id, payload) {
    return this.request(`/task-occurrences/${id}/reschedule`, {
      method: "POST",
      body: payload,
    });
  }
}

export default new TaskOccurrenceService();
