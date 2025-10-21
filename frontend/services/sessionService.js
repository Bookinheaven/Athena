const API_BASE_URL = import.meta.env.VITE_API_URL;

class SessionService {
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

  async saveSession(sessionData) {
    return this.request("/session/save", {
      method: "POST",
      body: sessionData,
    });
  }

  async getSessions() {
    let response = await this.request("/session/getAll", {
      method: "GET",
    });
    return response;
  }

  async getActiveSession() {
    let response = await this.request("/session/getCurrent", {
      method: "GET",
    });
    return response;
  }

  async getInsights() {
    let response = await this.request("/session/insights", {
      method: "GET",
    });
    return response;
  }
}

export default new SessionService();
