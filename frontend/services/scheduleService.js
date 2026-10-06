import RequestService from "./requestService.js";

class ScheduleService extends RequestService {
  /**
   * Get schedule blocks for user with optional query filters (date, startDate, endDate, taskId, status)
   */
  getScheduleBlocks(params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append("date", params.date);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.taskId) query.append("taskId", params.taskId);
    if (params.status) query.append("status", params.status);

    const queryString = query.toString();
    const endpoint = queryString ? `/schedule-block?${queryString}` : "/schedule-block";
    return this.request(endpoint, { method: "GET" });
  }

  /**
   * Get adaptive capacity alert for target date (C14 vs scheduled minutes)
   */
  getCapacityAlert(params = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append("date", params.date);
    const queryString = query.toString();
    const endpoint = queryString ? `/schedule-block/capacity?${queryString}` : "/schedule-block/capacity";
    return this.request(endpoint, { method: "GET" });
  }

  /**
   * Get single schedule block by ID
   */
  getScheduleBlock(id) {
    return this.request(`/schedule-block/${id}`, { method: "GET" });
  }

  /**
   * Create a new schedule block
   */
  createScheduleBlock(payload) {
    return this.request("/schedule-block", {
      method: "POST",
      body: payload,
    });
  }

  /**
   * Update an existing schedule block (time interval, status, date)
   */
  updateScheduleBlock(id, payload) {
    return this.request(`/schedule-block/${id}`, {
      method: "PATCH",
      body: payload,
    });
  }

  /**
   * Delete a schedule block
   */
  deleteScheduleBlock(id) {
    return this.request(`/schedule-block/${id}`, {
      method: "DELETE",
    });
  }
}

export default new ScheduleService();
