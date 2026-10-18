const API_BASE_URL = import.meta.env.VITE_API_URL;

export default class RequestService {
  async request(
    endpoint,
    options = {},
    retryOptions = { retries: 3, retryDelay: 500 }
  ) {
    const url = `${API_BASE_URL}${endpoint}`;

    let userTimezone = "UTC";
    try {
      userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      // fallback
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        "x-timezone": userTimezone,
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
          const clientError = new Error(data?.message || "Request failed");
          clientError.status = response.status;
          clientError.isClientError = true;
          throw clientError;
        }

        // Server error -> retry
        if (!response.ok) {
          throw new Error("Server error");
        }

        return data;

      } catch (error) {
        // Do not retry client errors (4xx, including 429 rate limit) or aborted requests
        if (error?.isClientError || error?.name === "AbortError" || attempt === retryOptions.retries) {
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
