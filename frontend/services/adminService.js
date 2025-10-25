const API_BASE_URL = import.meta.env.VITE_API_URL;

class AdminService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }

  async getUsers() {
    return this.request("/admin/users", {
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
      body: data
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
}

export default new AdminService();
