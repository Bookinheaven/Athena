import RequestService from "./requestService";

class AdminService extends RequestService {
  async getUsers() {
    return this.request("/admin/users", {
      method: "GET"
    });
  }

  async getUserDetails(id) {
    return this.request(`/admin/users/${id}`, {
      method: "GET"
    });
  }

  async addUsers(data) {
    let response = await this.request("/admin/add", {
      method: "POST",
      body: data
    });
    return response;
  }
  async deleteUsers(data) {
    let response = await this.request("/admin/delete", {
      method: "POST",
      body: { data }
    });
    return response;
  }
  async updateUser(id, user) {
    let response = await this.request("/admin/update", {
      method: "POST",
      body: {id, user}
    });
    return response;
  }

  async getSessions() {
    let response = await this.request("/admin/userSessions", {
      method: "GET"
    });
    return response;
  }

  async getDeveloperDatasets() {
    return this.request("/admin/developer-data/datasets", { method: "GET" });
  }

  async previewDeveloperData(payload) {
    return this.request("/admin/developer-data/preview", {
      method: "POST",
      body: payload
    });
  }

  async generateDeveloperData(payload) {
    return this.request("/admin/developer-data/generate", {
      method: "POST",
      body: payload
    });
  }

  async addDataToUser(payload) {
    return this.request("/admin/developer-data/add-to-user", {
      method: "POST",
      body: payload
    });
  }

  async validateDeveloperData(userId) {
    return this.request("/admin/developer-data/validate", {
      method: "POST",
      body: { userId }
    });
  }

  async cleanupDeveloperData(userId) {
    return this.request("/admin/developer-data/cleanup-user", {
      method: "POST",
      body: { userId }
    });
  }

  async deleteDeveloperDataset(datasetId) {
    return this.request(`/admin/developer-data/datasets/${datasetId}`, {
      method: "DELETE"
    });
  }
}

export default new AdminService();
