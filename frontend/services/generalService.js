const API_BASE_URL = import.meta.env.VITE_API_URL;

class GeneralService {
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
  async getQuote() {
    return this.request("/general/motivational", {
        method: "GET"
    })
  }
}

export default new GeneralService();