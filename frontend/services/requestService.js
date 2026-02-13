const API_BASE_URL = import.meta.env.VITE_API_URL;

export default class RequestService {
  async request(
    endpoint,
    options = {},
    retryOptions = { retries: 3, retryDelay: 500 }
  ) {
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

    let attempt = 0;

    while (attempt <= retryOptions.retries) {
      try {
        const response = await fetch(url, config);

        const data = await response.json().catch(() => null);

        // Client errors -> do NOT retry
        if (!response.ok && response.status < 500) {
          throw new Error(data?.message || "Request failed");
        }

        // Server error -> retry
        if (!response.ok) {
          throw new Error("Server error");
        }

        return data;

      } catch (error) {
        if (attempt === retryOptions.retries) {
          throw error;
        }

        // exponential backoff
        const delay =
          retryOptions.retryDelay * Math.pow(2, attempt);

        await this.sleep(delay);
        attempt++;
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
